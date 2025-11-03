"use client"

import type React from "react"

import { useCallback } from "react"
import { Upload } from "lucide-react"
import { motion } from "framer-motion"

interface VideoUploadProps {
  onVideoSelect: (file: File) => void
  isProcessing: boolean
}

export function VideoUpload({ onVideoSelect, isProcessing }: VideoUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && (file.type === "video/mp4" || file.type === "video/quicktime")) {
        onVideoSelect(file)
      }
    },
    [onVideoSelect],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onVideoSelect(file)
      }
    },
    [onVideoSelect],
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} className="relative">
        <input
          type="file"
          accept="video/mp4,video/quicktime"
          onChange={handleFileInput}
          disabled={isProcessing}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          id="video-upload"
        />
        <label
          htmlFor="video-upload"
          className="flex flex-col items-center justify-center w-full h-64 bg-card border-2 border-dashed border-border rounded-2xl shadow-md hover:border-accent hover:bg-accent/5 transition-all duration-300 cursor-pointer"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="p-4 bg-accent/10 rounded-full">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-foreground">
                {isProcessing ? "Processing video..." : "Upload a video"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Drag and drop or click to browse</p>
              <p className="text-xs text-muted-foreground mt-2">Supports MP4 and MOV files</p>
            </div>
          </motion.div>
        </label>
      </div>
    </motion.div>
  )
}
