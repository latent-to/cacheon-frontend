export type ContactResult = {
  ok: boolean
  message: string
  errors?: Partial<Record<'name' | 'email' | 'company' | 'message', string>>
}

type SalesEmail = {
  from: string
  to: string
  replyTo: string
  subject: string
  text: string
}

export type ContactEnv = {
  SALES_EMAIL?: { send(message: SalesEmail): Promise<unknown> }
  CONTACT_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> }
}

const unavailable = 'We could not send your message. Please try again later.'

export async function submitContact(request: Request, env: ContactEnv) {
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
  if (!env.SALES_EMAIL || !env.CONTACT_RATE_LIMITER) {
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

    await env.SALES_EMAIL.send({
      from: 'website@cacheon.ai',
      to: 'sales@cacheon.ai',
      replyTo: email,
      subject: 'Cacheon website — inference optimization inquiry',
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || 'Not provided'}\n\nWorkload / goals:\n${message}`,
    })
    return result(200, {
      ok: true,
      message: 'Thanks for reaching out. Your inquiry has been submitted to our sales team.',
    })
  } catch {
    // Do not log contact details or return provider errors to visitors.
    return result(503, { ok: false, message: unavailable })
  }
}
