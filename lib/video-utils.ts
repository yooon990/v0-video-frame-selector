export interface Frame {
  id: string
  dataUrl: string
  timestamp: number
  index: number
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
