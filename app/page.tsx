"use client"

import { useState } from "react"
import { VideoUpload } from "@/components/video-upload"
import { FrameCarousel } from "@/components/frame-carousel"
import { ClipCreator } from "@/components/clip-creator"
import { NearbyFramesModal } from "@/components/nearby-frames-modal"
import { extractFrames, extractNearbyFrames, type Frame } from "@/lib/video-utils"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ImageIcon, Scissors } from "lucide-react"

type Mode = "frames" | "clips"

export default function Home() {
  const router = useRouter()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set())
  const [selectedFrame, setSelectedFrame] = useState<Frame | null>(null)
  const [nearbyFrames, setNearbyFrames] = useState<Frame[]>([])
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [mode, setMode] = useState<Mode>("frames")

  const handleVideoSelect = async (file: File) => {
    setVideoFile(file)
    setIsProcessing(true)

    try {
      const extractedFrames = await extractFrames(file, 20)
      setFrames(extractedFrames)
    } catch (error) {
      console.error("[v0] Error extracting frames:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFrameSelect = (frameId: string) => {
    setSelectedFrames((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(frameId)) {
        newSet.delete(frameId)
      } else {
        newSet.add(frameId)
      }
      return newSet
    })
  }

  const handleFrameClick = async (frame: Frame) => {
    if (!videoFile) return

    setSelectedFrame(frame)
    setIsLoadingNearby(true)

    try {
      const nearby = await extractNearbyFrames(videoFile, frame.timestamp, 9)
      setNearbyFrames(nearby)
    } catch (error) {
      console.error("[v0] Error extracting nearby frames:", error)
    } finally {
      setIsLoadingNearby(false)
    }
  }

  const handleNearbyFrameSelect = (frame: Frame) => {
    setFrames((prev) => {
      const newFrames = [...prev]
      const originalIndex = newFrames.findIndex((f) => f.id === selectedFrame?.id)
      if (originalIndex !== -1) {
        newFrames[originalIndex] = { ...frame, id: selectedFrame!.id }
      }
      return newFrames
    })
    setSelectedFrame(null)
    setNearbyFrames([])
  }

  const handleContinue = () => {
    const selected = frames.filter((f) => selectedFrames.has(f.id))
    sessionStorage.setItem("selectedFrames", JSON.stringify(selected))
    router.push("/summary")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">{"DROPCUT"}</h1>
          <p className="text-muted-foreground text-lg">Select key frames or create short clips from your videos</p>
        </motion.div>

        {frames.length === 0 ? (
          <VideoUpload onVideoSelect={handleVideoSelect} isProcessing={isProcessing} />
        ) : (
          <div className="space-y-8">
            <div className="flex justify-center">
              <div className="inline-flex rounded-xl border border-border bg-muted p-1.5 gap-1">
                <Button
                  variant={mode === "frames" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("frames")}
                  className="rounded-lg"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Key Frames
                </Button>
                <Button
                  variant={mode === "clips" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("clips")}
                  className="rounded-lg"
                >
                  <Scissors className="w-4 h-4 mr-2" />
                  Create Clips
                </Button>
              </div>
            </div>

            {mode === "frames" ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">Select Frames</h2>
                    <p className="text-muted-foreground mt-1">
                      Click frames to view nearby options, check to select for export
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-muted-foreground">{selectedFrames.size} frames selected</p>
                    <Button onClick={handleContinue} disabled={selectedFrames.size === 0}>
                      Continue
                    </Button>
                  </div>
                </div>

                <FrameCarousel
                  frames={frames}
                  selectedFrames={selectedFrames}
                  onFrameSelect={handleFrameSelect}
                  onFrameClick={handleFrameClick}
                />
              </>
            ) : (
              <ClipCreator videoFile={videoFile} />
            )}
          </div>
        )}
      </div>

      <NearbyFramesModal
        isOpen={selectedFrame !== null}
        onClose={() => {
          setSelectedFrame(null)
          setNearbyFrames([])
        }}
        frames={nearbyFrames}
        isLoading={isLoadingNearby}
        onFrameSelect={handleNearbyFrameSelect}
        centerFrame={selectedFrame}
      />
    </main>
  )
}
