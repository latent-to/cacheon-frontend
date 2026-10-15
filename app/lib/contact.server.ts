export type ContactResult = {
  ok: boolean
  message: string
  errors?: Partial<Record<'name' | 'email' | 'company' | 'message', string>>
}

export type ContactEnv = {
  CONTACT_DISCORD_BOT_TOKEN?: string
  CONTACT_DISCORD_CHANNEL_ID?: string
  CONTACT_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> }
}

const unavailable = 'We could not send your message. Please try again later.'

export async function submitContact(
  request: Request,
  env: ContactEnv,
  fetchImpl: typeof fetch = fetch,
) {
  const result = (status: number, body: ContactResult) => ({ status, body })
  if (request.method !== 'POST') {
    return result(405, { ok: false, message: 'Please submit the contact form using POST.' })
  }
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return result(403, { ok: false, message: 'Please submit the form from this website.' })
  }
  if (!request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) {
    return result(415, { ok: false, message: 'Please use the contact form to send your message.' })
  }
  if (
    !env.CONTACT_DISCORD_BOT_TOKEN?.trim() ||
    !/^[0-9]{17,20}$/.test(env.CONTACT_DISCORD_CHANNEL_ID ?? '') ||
    !env.CONTACT_RATE_LIMITER
  ) {
    return result(503, { ok: false, message: unavailable })
  }

  try {
    const { success } = await env.CONTACT_RATE_LIMITER.limit({
      key: request.headers.get('CF-Connecting-IP') ?? 'local-preview',
    })
    if (!success) {
      return result(429, { ok: false, message: 'Please wait a minute before trying again.' })
    }

    // Bound the actual stream, including requests without Content-Length.
    const reader = request.body?.getReader()
    if (!reader) return result(400, { ok: false, message: 'Please complete the form.' })
    const chunks: Uint8Array[] = []
    let size = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 32_768) {
        await reader.cancel()
        return result(413, { ok: false, message: 'Your message is too long. Please shorten it.' })
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    const form = new URLSearchParams(new TextDecoder().decode(bytes))
    if (form.get('website')) {
      return result(400, { ok: false, message: 'Unable to submit this form.' })
    }
    const name = (form.get('name') ?? '').trim()
    const email = (form.get('email') ?? '').trim()
    const company = (form.get('company') ?? '').trim()
    const message = (form.get('message') ?? '').trim()
    const errors: NonNullable<ContactResult['errors']> = {}
    if (!name || name.length > 120) errors.name = 'Enter your name (up to 120 characters).'
    if (
      email.length > 254 ||
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(
        email,
      )
    ) {
      errors.email = 'Enter a valid email address.'
    }
    if (company.length > 160) errors.company = 'Use up to 160 characters.'
    if (!message || message.length > 5000)
      errors.message = 'Tell us about your workload (up to 5,000 characters).'
    if (Object.keys(errors).length) {
      return result(400, { ok: false, message: 'Please check the highlighted fields.', errors })
    }

    // One Discord message preserves the full inquiry within embed limits.
    // User-supplied mentions must never ping members, roles, or @everyone.
    // Avoid splitting a UTF-16 surrogate pair at the description boundary.
    const splitAt = /[\uD800-\uDBFF]/.test(message.charAt(3999)) ? 3999 : 4000
    const embeds = [
      {
        title: 'Website inquiry — inference optimization',
        description: message.slice(0, splitAt),
        fields: [
          { name: 'Name', value: name },
          { name: 'Reply email', value: email },
          { name: 'Company', value: company || 'Not provided' },
        ],
      },
      ...(message.length > splitAt
        ? [{ title: 'Workload / goals (continued)', description: message.slice(splitAt) }]
        : []),
    ]
    const response = await fetchImpl(
      `https://discord.com/api/v10/channels/${env.CONTACT_DISCORD_CHANNEL_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${env.CONTACT_DISCORD_BOT_TOKEN.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ embeds, allowed_mentions: { parse: [] } }),
        signal: AbortSignal.timeout(8000),
        redirect: 'error',
      },
    )
    // No automatic retries: an ambiguous timeout may already have created a message.
    if (!response.ok) return result(503, { ok: false, message: unavailable })
    const receipt: unknown = await response.json()
    if (
      !receipt ||
      typeof receipt !== 'object' ||
      !('id' in receipt) ||
      typeof receipt.id !== 'string' ||
      !receipt.id
    ) {
      return result(503, { ok: false, message: unavailable })
    }
    return result(200, {
      ok: true,
      message: 'Thanks for reaching out. Your inquiry has been submitted to our sales team.',
    })
  } catch {
    // Do not log contact details or return provider errors to visitors.
    return result(503, { ok: false, message: unavailable })
  }
}
