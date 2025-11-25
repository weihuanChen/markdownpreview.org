import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { locales } from '@/i18n'

const REVALIDATE_TAGS = ['blog-slugs', 'blog-posts', 'blog-search']

function unauthorizedResponse() {
  return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
}

function serverError(message: string, status: number = 500) {
  return NextResponse.json({ message }, { status })
}

function isValidToken(req: NextRequest) {
  const expectedToken = process.env.REVALIDATE_TOKEN
  const authHeader = req.headers.get('authorization') || ''

  if (!expectedToken) {
    return { valid: false, reason: 'Server configuration error', status: 500 }
  }

  const [scheme, token] = authHeader.split(' ')
  if (scheme !== 'Bearer' || token !== expectedToken) {
    return { valid: false, reason: 'Invalid token', status: 401 }
  }

  return { valid: true }
}

export async function POST(req: NextRequest) {
  const authResult = isValidToken(req)
  if (!authResult.valid) {
    if (authResult.status === 500) {
      return serverError(authResult.reason)
    }
    return unauthorizedResponse()
  }

  let payload: { event?: string; collection?: string; key?: string } = {}
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      payload = await req.json()
    }
  } catch {
    // Ignore malformed JSON and continue with empty payload for logging
  }

  try {
    REVALIDATE_TAGS.forEach((tag) => revalidateTag(tag))

    locales.forEach((locale) => {
      revalidatePath(`/${locale}/blog`)
      if (payload.key) {
        revalidatePath(`/${locale}/blog/${payload.key}`)
      }
    })

    const timestamp = new Date().toISOString()

    console.info('Revalidation triggered', {
      event: payload.event,
      collection: payload.collection,
      key: payload.key,
      timestamp,
    })

    return NextResponse.json({
      revalidated: true,
      tags: REVALIDATE_TAGS,
      timestamp,
    })
  } catch (error) {
    console.error('Error during revalidation', error)
    return NextResponse.json(
      {
        message: 'Error revalidating',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
