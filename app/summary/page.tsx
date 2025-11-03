"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Download, ArrowLeft, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Frame } from "@/lib/video-utils"
import JSZip from "jszip"

export default function SummaryPage() {
  const router = useRouter()
  const [selectedFrames, setSelectedFrames] = useState<Frame[]>([])
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem("selectedFrames")
    if (stored) {
      setSelectedFrames(JSON.parse(stored))
    } else {
      router.push("/")
    }
  }, [router])

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleDownloadAll = async () => {
    setIsDownloading(true)

    try {
      const zip = new JSZip()

      for (let i = 0; i < selectedFrames.length; i++) {
        const frame = selectedFrames[i]
        const base64Data = frame.dataUrl.split(",")[1]
        const timestamp = formatTimestamp(frame.timestamp).replace(":", "-")
        zip.file(`frame-${i + 1}-${timestamp}.jpg`, base64Data, { base64: true })
      }

      const blob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `frames-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Error downloading frames:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadSingle = (frame: Frame, index: number) => {
    const a = document.createElement("a")
    a.href = frame.dataUrl
    const timestamp = formatTimestamp(frame.timestamp).replace(":", "-")
    a.download = `frame-${index + 1}-${timestamp}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (selectedFrames.length === 0) {
    return null
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Button variant="ghost" onClick={() => router.push("/")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Selection
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">Selected Frames</h1>
              <p className="text-muted-foreground text-lg">
                {selectedFrames.length} frame{selectedFrames.length !== 1 ? "s" : ""} ready to download
              </p>
            </div>
            <Button onClick={handleDownloadAll} disabled={isDownloading} size="lg">
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download All"}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedFrames.map((frame, index) => (
            <motion.div
              key={frame.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-lg overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative aspect-video">
                <img
                  src={frame.dataUrl || "/placeholder.svg"}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                  {formatTimestamp(frame.timestamp)}
                </div>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span>Frame {index + 1}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownloadSingle(frame, index)}>
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  )
}
