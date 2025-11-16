"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Trash2, Download } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { VideoTimeline } from "@/components/video-timeline"
import {
  extractClipThumbnail,
  getVideoDuration,
  exportClipFromServer,
  uploadVideoToServer,
  type Clip,
} from "@/lib/video-utils"

interface ClipCreatorProps {
  videoFile: File
}

export function ClipCreator({ videoFile }: ClipCreatorProps) {
  const [clips, setClips] = useState<Clip[]>([])
  const [duration, setDuration] = useState(0)
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null)
  const [isLoadingThumbnail, setIsLoadingThumbnail] = useState(false)
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    getVideoDuration(videoFile).then(setDuration)
    uploadVideo()
  }, [videoFile])

  const uploadVideo = async () => {
    setIsUploading(true)
    try {
      const id = await uploadVideoToServer(videoFile)
      setVideoId(id)
      console.log("[v0] Video uploaded to server with ID:", id)
    } catch (error) {
      console.error("[v0] Error uploading video:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClipCreate = async (startTime: number, endTime: number) => {
    setIsLoadingThumbnail(true)
    try {
      const thumbnail = await extractClipThumbnail(videoFile, startTime)
      const newClip: Clip = {
        id: `clip-${Date.now()}`,
        startTime,
        endTime,
        duration: endTime - startTime,
        thumbnail,
      }
      setClips((prev) => [...prev, newClip])
    } catch (error) {
      console.error("[v0] Error creating clip:", error)
    } finally {
      setIsLoadingThumbnail(false)
    }
  }

  const handleClipDelete = (clipId: string) => {
    setClips((prev) => prev.filter((c) => c.id !== clipId))
    if (selectedClip?.id === clipId) {
      setSelectedClip(null)
    }
  }

  const handleClipDownload = async (clip: Clip, index: number) => {
    if (!videoId) {
      console.error("[v0] Video not uploaded to server yet")
      return
    }

    setDownloadingClipId(clip.id)
    try {
      await exportClipFromServer(videoId, [{ start: clip.startTime, end: clip.endTime }], "mp4")
    } catch (error) {
      console.error("[v0] Error downloading clip:", error)
    } finally {
      setDownloadingClipId(null)
    }
  }

  const handleDownloadAll = async () => {
    if (!videoId || clips.length === 0) {
      return
    }

    setDownloadingClipId("all")
    try {
      const clipRanges = clips.map((clip) => ({ start: clip.startTime, end: clip.endTime }))
      await exportClipFromServer(videoId, clipRanges, "mp4")
    } catch (error) {
      console.error("[v0] Error downloading all clips:", error)
    } finally {
      setDownloadingClipId(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Create Short Clips</h2>
        <p className="text-muted-foreground">
          Use the timeline to select segments and create multiple clips from your video
        </p>
        {isUploading && <p className="text-sm text-muted-foreground mt-2">Uploading video to server...</p>}
        {videoId && <p className="text-sm text-accent mt-2">Video ready for processing (ID: {videoId})</p>}
      </div>

      <VideoTimeline videoFile={videoFile} duration={duration} onClipCreate={handleClipCreate} />

      {clips.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-foreground">Your Clips ({clips.length})</h3>
            {clips.length > 1 && videoId && (
              <Button onClick={handleDownloadAll} disabled={downloadingClipId !== null} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download All ({clips.length})
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {clips.map((clip, index) => (
                <motion.div
                  key={clip.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative group"
                >
                  <div
                    className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                      selectedClip?.id === clip.id
                        ? "border-accent shadow-xl"
                        : "border-border hover:border-accent/50 hover:shadow-lg"
                    }`}
                    onClick={() => setSelectedClip(clip)}
                  >
                    {clip.thumbnail && (
                      <img
                        src={clip.thumbnail || "/placeholder.svg"}
                        alt={`Clip ${index + 1}`}
                        className="w-full aspect-video object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium">Clip {index + 1}</p>
                      <p className="text-white/80 text-xs">
                        {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                      </p>
                      <p className="text-white/60 text-xs">{formatTime(clip.duration)} duration</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="absolute -top-2 -right-2 flex gap-1 z-10">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="w-8 h-8 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClipDownload(clip, index)
                      }}
                      disabled={downloadingClipId !== null || !videoId}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8 rounded-full shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClipDelete(clip.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {isLoadingThumbnail && (
        <div className="text-center text-muted-foreground">
          <p>Creating clip...</p>
        </div>
      )}
    </div>
  )
}
