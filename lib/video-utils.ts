export interface Frame {
  id: string
  dataUrl: string
  timestamp: number
  index: number
}

export interface Clip {
  id: string
  startTime: number
  endTime: number
  duration: number
  thumbnail?: string
}

export async function extractFrames(videoFile: File, frameCount = 20): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    video.preload = "metadata"
    video.crossOrigin = "anonymous"

    const frames: Frame[] = []
    let currentFrameIndex = 0

    video.onloadedmetadata = () => {
      const duration = video.duration
      const interval = duration / frameCount

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const captureFrame = () => {
        if (currentFrameIndex >= frameCount) {
          resolve(frames)
          URL.revokeObjectURL(video.src)
          return
        }

        const timestamp = currentFrameIndex * interval
        video.currentTime = timestamp
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8)

        frames.push({
          id: `frame-${currentFrameIndex}`,
          dataUrl,
          timestamp: video.currentTime,
          index: currentFrameIndex,
        })

        currentFrameIndex++
        captureFrame()
      }

      captureFrame()
    }

    video.onerror = () => {
      reject(new Error("Error loading video"))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(videoFile)
  })
}

export async function extractNearbyFrames(videoFile: File, centerTimestamp: number, frameCount = 5): Promise<Frame[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    video.preload = "metadata"
    video.crossOrigin = "anonymous"

    const frames: Frame[] = []
    let currentFrameIndex = 0

    video.onloadedmetadata = () => {
      const duration = video.duration
      const offset = Math.floor(frameCount / 2)
      const frameInterval = 0.5 // 0.5 seconds between frames

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const captureFrame = () => {
        if (currentFrameIndex >= frameCount) {
          resolve(frames)
          URL.revokeObjectURL(video.src)
          return
        }

        const relativeIndex = currentFrameIndex - offset
        let timestamp = centerTimestamp + relativeIndex * frameInterval
        timestamp = Math.max(0, Math.min(timestamp, duration))

        video.currentTime = timestamp
      }

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8)

        frames.push({
          id: `nearby-${currentFrameIndex}`,
          dataUrl,
          timestamp: video.currentTime,
          index: currentFrameIndex,
        })

        currentFrameIndex++
        captureFrame()
      }

      captureFrame()
    }

    video.onerror = () => {
      reject(new Error("Error loading video"))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(videoFile)
  })
}

export async function extractClipThumbnail(videoFile: File, timestamp: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      reject(new Error("Could not get canvas context"))
      return
    }

    video.preload = "metadata"
    video.crossOrigin = "anonymous"

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      video.currentTime = timestamp
    }

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      resolve(dataUrl)
      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error("Error loading video"))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(videoFile)
  })
}

export async function getVideoDuration(videoFile: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.crossOrigin = "anonymous"

    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }

    video.onerror = () => {
      reject(new Error("Error loading video"))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(videoFile)
  })
}

export async function uploadVideoToServer(videoFile: File): Promise<string> {
  const formData = new FormData()
  formData.append("video", videoFile)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Failed to upload video")
  }

  const data = await response.json()
  return data.videoId
}

export async function exportClipFromServer(
  videoId: string,
  clips: Array<{ start: number; end: number }>,
  format: string = "mp4"
): Promise<void> {
  const response = await fetch("/api/export", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      videoId,
      clips,
      format,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to export clips")
  }

  const data = await response.json()

  // Download each exported clip
  for (const clip of data.clips) {
    const blob = new Blob([Uint8Array.from(atob(clip.data), (c) => c.charCodeAt(0))], { type: "video/mp4" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `clip-${clip.clipNumber}_${clip.startTime.toFixed(1)}s-${clip.endTime.toFixed(1)}s.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
  }
}

export async function exportClip(videoFile: File, startTime: number, endTime: number, clipName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video")
    const canvas = document.createElement("canvas")
    video.crossOrigin = "anonymous"
    video.preload = "metadata"
    video.muted = true

    video.onloadedmetadata = async () => {
      try {
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Create MediaRecorder to capture the trimmed segment
        const stream = canvas.captureStream(30) // 30 fps

        // Try to get audio track from video if available
        try {
          const audioContext = new AudioContext()
          const source = audioContext.createMediaElementSource(video)
          const destination = audioContext.createMediaStreamDestination()
          source.connect(destination)
          source.connect(audioContext.destination)

          // Add audio track to stream if available
          if (destination.stream.getAudioTracks().length > 0) {
            destination.stream.getAudioTracks().forEach((track) => {
              stream.addTrack(track)
            })
          }
        } catch (audioError) {
          console.log("[v0] Audio capture not available, exporting video only")
        }

        const chunks: Blob[] = []
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
          videoBitsPerSecond: 2500000,
        })

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data)
          }
        }

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" })
          const url = URL.createObjectURL(blob)

          const a = document.createElement("a")
          a.href = url
          a.download = `${clipName}_${startTime.toFixed(1)}s-${endTime.toFixed(1)}s.webm`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)

          setTimeout(() => {
            URL.revokeObjectURL(url)
            URL.revokeObjectURL(video.src)
            resolve()
          }, 100)
        }

        mediaRecorder.onerror = (e) => {
          reject(new Error("MediaRecorder error"))
        }

        // Start recording at the specified start time
        video.currentTime = startTime

        video.onseeked = () => {
          video.play()
          mediaRecorder.start()

          // Draw frames to canvas while playing
          const drawFrame = () => {
            if (video.currentTime >= endTime || video.paused || video.ended) {
              mediaRecorder.stop()
              video.pause()
              return
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            requestAnimationFrame(drawFrame)
          }

          drawFrame()
        }

        // Stop recording when we reach the end time
        video.ontimeupdate = () => {
          if (video.currentTime >= endTime) {
            video.pause()
          }
        }
      } catch (error) {
        reject(error)
      }
    }

    video.onerror = () => {
      reject(new Error("Error loading video"))
      URL.revokeObjectURL(video.src)
    }

    video.src = URL.createObjectURL(videoFile)
  })
}
