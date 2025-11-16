"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Scissors, Download, Trash2, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { type Clip, generateClipThumbnail } from "@/lib/video-utils"

interface ClipCreatorProps {
  videoFile: File
}

export function ClipCreator({ videoFile }: ClipCreatorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [clips, setClips] = useState<Clip[]>([])
  const [trimRange, setTrimRange] = useState<[number, number]>([0, 0])
  const [isCreatingClip, setIsCreatingClip] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      video.src = URL.createObjectURL(videoFile)
      
      return () => {
        if (video.src) {
          URL.revokeObjectURL(video.src)
        }
      }
    }
  }, [videoFile])

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      setDuration(dur)
      setTrimRange([0, dur])
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0]
      setCurrentTime(value[0])
    }
  }

  const handleTrimRangeChange = (value: number[]) => {
    setTrimRange([value[0], value[1]])
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`
  }

  const createClip = async () => {
    setIsCreatingClip(true)
    
    try {
      const clipId = `clip-${Date.now()}`
      const thumbnailUrl = await generateClipThumbnail(videoFile, trimRange[0])
      
      const newClip: Clip = {
        id: clipId,
        startTime: trimRange[0],
        endTime: trimRange[1],
        thumbnailUrl,
        status: 'pending'
      }
      
      setClips(prev => [...prev, newClip])
      
      const response = await fetch('/api/clips/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: trimRange[0],
          endTime: trimRange[1],
          fileName: videoFile.name
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        
        setClips(prev => prev.map(clip => 
          clip.id === clipId 
            ? { ...clip, videoUrl: data.url, status: 'completed' }
            : clip
        ))
      } else {
        setClips(prev => prev.map(clip => 
          clip.id === clipId 
            ? { ...clip, status: 'error' }
            : clip
        ))
      }
    } catch (error) {
      console.error("[v0] Error creating clip:", error)
    } finally {
      setIsCreatingClip(false)
    }
  }

  const deleteClip = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId))
  }

  const downloadClip = (clip: Clip) => {
    if (clip.videoUrl) {
      const a = document.createElement('a')
      a.href = clip.videoUrl
      a.download = `clip-${clip.startTime}-${clip.endTime}.mp4`
      a.click()
    }
  }

  return (
    <div className="space-y-8">
      {/* Video Player */}
      <div className="bg-card rounded-2xl shadow-md overflow-hidden border border-border">
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
        
        <div className="p-6 space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              className="rounded-full"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
            </div>
            
            <span className="text-sm text-muted-foreground font-mono min-w-[80px] text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          {/* Trim Range */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Trim Range</label>
              <span className="text-sm text-muted-foreground font-mono">
                {formatTime(trimRange[0])} - {formatTime(trimRange[1])}
              </span>
            </div>
            <Slider
              value={trimRange}
              max={duration}
              step={0.1}
              onValueChange={handleTrimRangeChange}
              className="cursor-pointer"
              minStepsBetweenThumbs={1}
            />
          </div>
          
          <Button
            onClick={createClip}
            disabled={isCreatingClip}
            className="w-full"
          >
            {isCreatingClip ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Clip...
              </>
            ) : (
              <>
                <Scissors className="w-4 h-4 mr-2" />
                Create Clip
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Clips List */}
      {clips.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Created Clips ({clips.length})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {clips.map((clip) => (
                <motion.div
                  key={clip.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-card rounded-xl border border-border overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="relative aspect-video bg-muted">
                    {clip.thumbnailUrl && (
                      <img
                        src={clip.thumbnailUrl || "/placeholder.svg"}
                        alt="Clip thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                      {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                    </div>
                    {clip.status === 'processing' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-3">
                    {clip.videoUrl && (
                      <div className="text-xs text-muted-foreground font-mono break-all bg-muted p-2 rounded">
                        {clip.videoUrl}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadClip(clip)}
                        disabled={clip.status !== 'completed'}
                        className="flex-1"
                      >
                        <Download className="w-3 h-3 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteClip(clip.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    {clip.status === 'error' && (
                      <p className="text-xs text-destructive">Failed to create clip</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
