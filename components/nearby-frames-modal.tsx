"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import type { Frame } from "@/lib/video-utils"

interface NearbyFramesModalProps {
  isOpen: boolean
  onClose: () => void
  frames: Frame[]
  isLoading: boolean
  onFrameSelect: (frame: Frame) => void
  centerFrame: Frame | null
}

export function NearbyFramesModal({
  isOpen,
  onClose,
  frames,
  isLoading,
  onFrameSelect,
  centerFrame,
}: NearbyFramesModalProps) {
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl bg-card rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Select Nearby Frame</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a more precise frame from around {centerFrame && formatTimestamp(centerFrame.timestamp)}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Extracting nearby frames...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {frames.map((frame, index) => {
                    const isCenterFrame = Math.floor(frames.length / 2) === index
                    return (
                      <motion.div
                        key={frame.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          isCenterFrame
                            ? "border-accent ring-2 ring-accent/20"
                            : "border-border hover:border-accent/50"
                        }`}
                        onClick={() => onFrameSelect(frame)}
                      >
                        <img
                          src={frame.dataUrl || "/placeholder.svg"}
                          alt={`Nearby frame ${index + 1}`}
                          className="w-full h-auto aspect-video object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/60 px-2 py-1 rounded">
                          {formatTimestamp(frame.timestamp)}
                        </div>
                        {isCenterFrame && (
                          <div className="absolute top-2 right-2 text-white text-xs font-medium bg-accent px-2 py-1 rounded">
                            Original
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
