"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Play, Pause, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoTimelineProps {
  videoFile: File
  duration: number
  onClipCreate: (startTime: number, endTime: number) => void
}

export function VideoTimeline({ videoFile, duration, onClipCreate }: VideoTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [startMarker, setStartMarker] = useState<number | null>(null)
  const [endMarker, setEndMarker] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState<"start" | "end" | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = URL.createObjectURL(videoFile)
    }
    return () => {
      if (videoRef.current?.src) {
        URL.revokeObjectURL(videoRef.current.src)
      }
    }
  }, [videoFile])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDragging) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = percentage * duration

    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleMarkerDrag = (e: React.MouseEvent<HTMLDivElement>, marker: "start" | "end") => {
    e.stopPropagation()
    setIsDragging(marker)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    const percentage = x / rect.width
    const time = percentage * duration

    if (isDragging === "start") {
      setStartMarker(Math.min(time, endMarker ?? duration))
    } else {
      setEndMarker(Math.max(time, startMarker ?? 0))
    }
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSetStartMarker = () => {
    setStartMarker(currentTime)
    if (endMarker !== null && currentTime > endMarker) {
      setEndMarker(null)
    }
  }

  const handleSetEndMarker = () => {
    setEndMarker(currentTime)
    if (startMarker !== null && currentTime < startMarker) {
      setStartMarker(null)
    }
  }

  const handleCreateClip = () => {
    if (startMarker !== null && endMarker !== null) {
      onClipCreate(startMarker, endMarker)
      setStartMarker(null)
      setEndMarker(null)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateTime = () => setCurrentTime(video.currentTime)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("ended", handleEnded)
    }
  }, [])

  const currentPercentage = (currentTime / duration) * 100
  const startPercentage = startMarker !== null ? (startMarker / duration) * 100 : null
  const endPercentage = endMarker !== null ? (endMarker / duration) * 100 : null

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-contain" />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={togglePlayPause} size="icon" variant="outline">
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <Button onClick={handleSetStartMarker} variant="outline" size="sm">
          Set Start
        </Button>
        <Button onClick={handleSetEndMarker} variant="outline" size="sm">
          Set End
        </Button>
        <Button
          onClick={handleCreateClip}
          disabled={startMarker === null || endMarker === null}
          size="sm"
          className="ml-auto"
        >
          <Scissors className="w-4 h-4 mr-2" />
          Create Clip
        </Button>
      </div>

      <div
        ref={timelineRef}
        className="relative h-20 bg-muted rounded-xl cursor-pointer select-none"
        onClick={handleTimelineClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {startPercentage !== null && endPercentage !== null && (
          <div
            className="absolute top-0 bottom-0 bg-accent/30 border-l-2 border-r-2 border-accent"
            style={{
              left: `${startPercentage}%`,
              width: `${endPercentage - startPercentage}%`,
            }}
          />
        )}

        {startPercentage !== null && (
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-green-500 cursor-ew-resize z-10"
            style={{ left: `${startPercentage}%` }}
            onMouseDown={(e) => handleMarkerDrag(e, "start")}
            whileHover={{ scale: 1.2 }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {formatTime(startMarker!)}
            </div>
          </motion.div>
        )}

        {endPercentage !== null && (
          <motion.div
            className="absolute top-0 bottom-0 w-1 bg-red-500 cursor-ew-resize z-10"
            style={{ left: `${endPercentage}%` }}
            onMouseDown={(e) => handleMarkerDrag(e, "end")}
            whileHover={{ scale: 1.2 }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {formatTime(endMarker!)}
            </div>
          </motion.div>
        )}

        <motion.div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground z-20 pointer-events-none"
          style={{ left: `${currentPercentage}%` }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full" />
        </motion.div>

        <div className="absolute bottom-2 left-3 text-xs text-muted-foreground">{formatTime(currentTime)}</div>
        <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">{formatTime(duration)}</div>
      </div>
    </div>
  )
}
