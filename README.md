# FrameSelect - Video Frame Selection Tool

A modern web app that helps video creators select key frames and create short clips from uploaded videos.

## Features

- Upload video files (MP4, MOV)
- Extract and preview key frames from videos
- Create short clips with precise timeline trimming
- Server-side video processing with FFmpeg for high-quality exports
- Dual export modes:
  - **Stream Copy**: Fast exports when cuts align with keyframes (no re-encoding)
  - **High-Quality Re-encoding**: Precise cuts with H.264 @ CRF 18 for visually lossless quality

## Prerequisites

### FFmpeg Installation

This application requires FFmpeg to be installed on the server for video processing.

#### Linux (Ubuntu/Debian)
\`\`\`bash
sudo apt update
sudo apt install ffmpeg
\`\`\`

#### macOS
\`\`\`bash
brew install ffmpeg
\`\`\`

#### Windows
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html)
2. Extract and add to PATH environment variable

### Verify Installation
\`\`\`bash
ffmpeg -version
ffprobe -version
\`\`\`

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000)

## How It Works

### Client-Side (Preview)
- Videos are displayed using WebM or browser-native formats for smooth preview
- Timeline scrubbing and frame selection happens in the browser
- Thumbnails are extracted client-side for quick display

### Server-Side (Export)
- Original MP4 files are uploaded to the server
- FFmpeg processes the original high-quality video
- Intelligent encoding strategy:
  - **Keyframe-aligned cuts**: Uses `-c copy` for instant, lossless trimming
  - **Precise cuts**: Uses `-c:v libx264 -preset slow -crf 18` for high-quality re-encoding
- Maintains original resolution, fps, and quality
- Exports as MP4 with H.264 video and AAC audio

## API Endpoints

### POST /api/upload
Upload original video file to server for processing.

**Request**: `multipart/form-data` with video file

**Response**:
\`\`\`json
{
  "videoId": "video-1234567890-abc123",
  "filename": "my-video.mp4",
  "size": 10485760,
  "message": "Video uploaded successfully"
}
\`\`\`

### POST /api/export
Export clips from uploaded video using FFmpeg.

**Request**:
\`\`\`json
{
  "videoId": "video-1234567890-abc123",
  "clips": [
    { "start": 10.5, "end": 25.3 },
    { "start": 45.0, "end": 60.0 }
  ],
  "format": "mp4"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "videoId": "video-1234567890-abc123",
  "clips": [
    {
      "clipId": "video-1234567890-abc123-clip-1",
      "clipNumber": 1,
      "startTime": 10.5,
      "endTime": 25.3,
      "duration": 14.8,
      "size": 2097152,
      "data": "base64-encoded-video-data",
      "method": "stream-copy"
    }
  ]
}
\`\`\`

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **Framer Motion** - Smooth animations
- **shadcn/ui** - Beautiful UI components
- **FFmpeg** - Server-side video processing
- **Lucide Icons** - Modern icon set

## File Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── upload/route.ts      # Video upload endpoint
│   │   └── export/route.ts      # FFmpeg clip export endpoint
│   ├── page.tsx                 # Main app page
│   ├── summary/page.tsx         # Selected frames summary
│   └── layout.tsx               # Root layout
├── components/
│   ├── video-upload.tsx         # Video file upload component
│   ├── frame-carousel.tsx       # Frame selection carousel
│   ├── clip-creator.tsx         # Clip creation interface
│   ├── video-timeline.tsx       # Timeline scrubbing component
│   └── nearby-frames-modal.tsx  # Frame selection modal
├── lib/
│   └── video-utils.ts           # Video processing utilities
└── uploads/                     # Temporary video storage (gitignored)
\`\`\`

## Production Deployment

### Important Notes

1. **Storage**: The `uploads/` directory stores temporary video files. Consider using cloud storage (S3, R2) for production.

2. **FFmpeg on Vercel**: Vercel doesn't support FFmpeg by default. For production:
   - Use Vercel Serverless Functions with custom runtime
   - Deploy FFmpeg processing to a separate service (AWS Lambda with FFmpeg layer, Docker container, etc.)
   - Consider using cloud video processing services (AWS MediaConvert, Cloudflare Stream)

3. **File Size Limits**: Adjust Next.js config for larger video uploads:
\`\`\`js
// next.config.mjs
export default {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
}
\`\`\`

4. **Environment Variables**: Configure upload limits and storage paths via env vars.

## License

MIT
