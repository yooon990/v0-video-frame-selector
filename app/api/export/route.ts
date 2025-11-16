import { NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import { join } from "path"
import { readFile, unlink } from "fs/promises"
import { existsSync } from "fs"

interface ClipRequest {
  start: number
  end: number
}

interface ExportRequest {
  videoId: string
  clips: ClipRequest[]
  format: string
}

async function isKeyframeAligned(videoPath: string, timestamp: number): Promise<boolean> {
  return new Promise((resolve) => {
    // Get keyframe information using ffprobe
    const ffprobe = spawn("ffprobe", [
      "-select_streams",
      "v:0",
      "-show_entries",
      "packet=pts_time,flags",
      "-of",
      "csv=print_section=0",
      "-read_intervals",
      `${Math.max(0, timestamp - 2)}%${timestamp + 2}`,
      videoPath,
    ])

    let output = ""

    ffprobe.stdout.on("data", (data) => {
      output += data.toString()
    })

    ffprobe.on("close", () => {
      // Check if there's a keyframe within 0.1 seconds of the timestamp
      const lines = output.split("\n").filter((line) => line.trim())
      const hasNearbyKeyframe = lines.some((line) => {
        const [pts, flags] = line.split(",")
        const ptsTime = parseFloat(pts)
        return flags?.includes("K") && Math.abs(ptsTime - timestamp) < 0.1
      })
      resolve(hasNearbyKeyframe)
    })

    ffprobe.on("error", () => {
      resolve(false)
    })
  })
}

async function exportClip(
  inputPath: string,
  outputPath: string,
  start: number,
  end: number,
  useStreamCopy: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    let ffmpegArgs: string[]

    if (useStreamCopy) {
      // Fast stream copy (no re-encoding) for keyframe-aligned clips
      ffmpegArgs = [
        "-i",
        inputPath,
        "-ss",
        start.toString(),
        "-to",
        end.toString(),
        "-c",
        "copy", // Copy streams without re-encoding
        "-avoid_negative_ts",
        "make_zero",
        outputPath,
      ]
    } else {
      // High-quality re-encoding for precise cuts
      ffmpegArgs = [
        "-i",
        inputPath,
        "-ss",
        start.toString(),
        "-to",
        end.toString(),
        "-c:v",
        "libx264", // H.264 video codec
        "-preset",
        "slow", // Better compression
        "-crf",
        "18", // High quality (lower = better, 18 = visually lossless)
        "-c:a",
        "aac", // AAC audio codec
        "-b:a",
        "192k", // High-quality audio
        "-movflags",
        "+faststart", // Enable fast start for web playback
        "-avoid_negative_ts",
        "make_zero",
        outputPath,
      ]
    }

    const ffmpeg = spawn("ffmpeg", ["-y", ...ffmpegArgs])

    let errorOutput = ""

    ffmpeg.stderr.on("data", (data) => {
      errorOutput += data.toString()
    })

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${errorOutput}`))
      }
    })

    ffmpeg.on("error", (error) => {
      reject(error)
    })
  })
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json()
    const { videoId, clips, format } = body

    if (!videoId || !clips || clips.length === 0) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 })
    }

    const inputPath = join(process.cwd(), "uploads", `${videoId}.mp4`)

    if (!existsSync(inputPath)) {
      return NextResponse.json({ error: "Video file not found" }, { status: 404 })
    }

    const exportedClips = []

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const clipId = `${videoId}-clip-${i + 1}`
      const outputPath = join(process.cwd(), "uploads", `${clipId}.${format}`)

      // Check if start and end times align with keyframes
      const startAligned = await isKeyframeAligned(inputPath, clip.start)
      const endAligned = await isKeyframeAligned(inputPath, clip.end)
      const useStreamCopy = startAligned && endAligned

      console.log(
        `[v0] Exporting clip ${i + 1}: ${clip.start}s - ${clip.end}s (${useStreamCopy ? "stream copy" : "re-encoding"})`
      )

      try {
        await exportClip(inputPath, outputPath, clip.start, clip.end, useStreamCopy)

        // Read the exported file
        const fileBuffer = await readFile(outputPath)

        exportedClips.push({
          clipId,
          clipNumber: i + 1,
          startTime: clip.start,
          endTime: clip.end,
          duration: clip.end - clip.start,
          size: fileBuffer.length,
          data: fileBuffer.toString("base64"),
          method: useStreamCopy ? "stream-copy" : "re-encoded",
        })

        // Clean up temporary file
        await unlink(outputPath)
      } catch (error) {
        console.error(`[v0] Error exporting clip ${i + 1}:`, error)
        throw error
      }
    }

    return NextResponse.json({
      success: true,
      videoId,
      clips: exportedClips,
    })
  } catch (error) {
    console.error("[v0] Export error:", error)
    return NextResponse.json(
      { error: "Failed to export clips", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
