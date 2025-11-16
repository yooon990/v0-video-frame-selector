import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("video") as File

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 })
    }

    // Generate unique video ID
    const videoId = `video-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const uploadDir = join(process.cwd(), "uploads")

    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save the original MP4 file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = join(uploadDir, `${videoId}.mp4`)
    await writeFile(filePath, buffer)

    return NextResponse.json({
      videoId,
      filename: file.name,
      size: file.size,
      message: "Video uploaded successfully",
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json({ error: "Failed to upload video" }, { status: 500 })
  }
}
