"use client"

import { useState } from "react"
import { motion, AnimatePresence, type PanInfo } from "framer-motion"
import { Check, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Frame } from "@/lib/video-utils"

interface FrameCarouselProps {
  frames: Frame[]
  selectedFrames: Set<string>
  onFrameSelect: (frameId: string) => void
  onFrameClick: (frame: Frame) => void
}

export function FrameCarousel({ frames, selectedFrames, onFrameSelect, onFrameClick }: FrameCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(0)
  const framesPerPage = 4
  const totalPages = Math.ceil(frames.length / framesPerPage)

  const startIndex = currentPage * framesPerPage
  const endIndex = startIndex + framesPerPage
  const currentFrames = frames.slice(startIndex, endIndex)

  const handleDragEnd = (_: any, info: PanInfo) => {
    const swipeThreshold = 50
    if (info.offset.x > swipeThreshold && currentPage > 0) {
      setDirection(1)
      setCurrentPage(currentPage - 1)
    } else if (info.offset.x < -swipeThreshold && currentPage < totalPages - 1) {
      setDirection(-1)
      setCurrentPage(currentPage + 1)
    }
  }

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setDirection(1)
            setCurrentPage(Math.max(0, currentPage - 1))
          }}
          disabled={currentPage === 0}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setDirection(-1)
            setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
          }}
          disabled={currentPage === totalPages - 1}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: -100 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 * direction }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid grid-cols-2 gap-6"
            >
              {currentFrames.map((frame, index) => {
                const isSelected = selectedFrames.has(frame.id)
                return (
                  <motion.div
                    key={frame.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative group"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div
                      className={`relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                        isSelected ? "border-accent shadow-xl" : "border-border hover:border-accent/50 hover:shadow-lg"
                      }`}
                      onClick={() => onFrameClick(frame)}
                    >
                      <img
                        src={frame.dataUrl || "/placeholder.svg"}
                        alt={`Frame ${startIndex + index + 1}`}
                        className="w-full h-auto aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-3 left-3 text-white text-sm font-medium bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        {formatTimestamp(frame.timestamp)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onFrameSelect(frame.id)
                      }}
                      className={`absolute -top-3 -right-3 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 z-20 ${
                        isSelected
                          ? "bg-accent border-accent text-accent-foreground shadow-lg scale-110"
                          : "bg-white border-border hover:border-accent hover:shadow-lg hover:scale-110"
                      }`}
                    >
                      <AnimatePresence>
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check className="w-5 h-5" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPage(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentPage ? "bg-accent w-6" : "bg-border hover:bg-accent/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
