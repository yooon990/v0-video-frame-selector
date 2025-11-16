import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startTime, endTime, fileName } = body
    
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockUrl = `https://example.com/clips/${fileName}-${startTime}-${endTime}.mp4`
    
    return NextResponse.json({
      success: true,
      url: mockUrl,
      startTime,
      endTime
    })
  } catch (error) {
    console.error("[v0] Error creating clip:", error)
    return NextResponse.json(
      { success: false, error: 'Failed to create clip' },
      { status: 500 }
    )
  }
}
