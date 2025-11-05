import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function handleRequest(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/')
  const vitePayUrl = `https://api.vitepay.com/${path}`
  
  try {
    console.log(`Proxying ${request.method} request to Vite Pay: ${vitePayUrl}`)
    
    const response = await fetch(vitePayUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('Authorization') || ''
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.text() 
        : undefined
    })
    
    if (!response.ok) {
      console.error('Vite Pay API error:', {
        status: response.status,
        statusText: response.statusText,
        url: vitePayUrl
      })
    }
    
    const data = await response.json()
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      }
    })
  } catch (error: unknown) {
    console.error('Vite Pay proxy error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to communicate with Vite Pay API',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : String(error)
        })
      },
      { status: 500 }
    )
  }
}

export const GET = handleRequest
export const POST = handleRequest
export const PUT = handleRequest
export const PATCH = handleRequest
export const DELETE = handleRequest
export const OPTIONS = handleRequest
