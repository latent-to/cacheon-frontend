import { useFetcher } from 'react-router'
import type { ContactResult } from '~/lib/contact.server'

const inputClass =
  'border-border bg-bg text-primary mt-2 w-full rounded-none border px-3 py-3 text-base focus:border-accent'

export default function ContactForm({ initialResult }: { initialResult?: ContactResult }) {
  const fetcher = useFetcher<ContactResult>()
  const result = fetcher.data ?? initialResult
  const pending = fetcher.state !== 'idle'

  if (result?.ok) {
    return (
      <p role="status" className="border-accent border-l-2 pl-5 text-lg">
        {result.message}
      </p>
    )
  }

  return (
    <fetcher.Form
      method="post"
      action="/?index#contact-us"
      className="space-y-5"
      aria-label="Contact the Cacheon team"
      aria-busy={pending}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {(
          [
            ['name', 'Name', 'text', 'name', 120],
            ['email', 'Work email', 'email', 'email', 254],
          ] as const
        ).map(([name, label, type, autoComplete, maxLength]) => (
          <div key={name}>
            <label htmlFor={`contact-${name}`} className="text-sm">
              {label}
            </label>
            <input
              id={`contact-${name}`}
              name={name}
              type={type}
              autoComplete={autoComplete}
              maxLength={maxLength}
              required
              className={inputClass}
              aria-invalid={!!result?.errors?.[name]}
              aria-describedby={result?.errors?.[name] ? `contact-${name}-error` : undefined}
            />
            {result?.errors?.[name] && (
              <p id={`contact-${name}-error`} className="mt-2 text-sm text-red-300">
                {result.errors[name]}
              </p>
            )}
          </div>
        ))}
      </div>
      <div>
        <label htmlFor="contact-company" className="text-sm">
          Company <span className="text-secondary">(optional)</span>
        </label>
        <input
          id="contact-company"
          name="company"
          autoComplete="organization"
          maxLength={160}
          className={inputClass}
          aria-invalid={!!result?.errors?.company}
          aria-describedby={result?.errors?.company ? 'contact-company-error' : undefined}
        />
        {result?.errors?.company && (
          <p id="contact-company-error" className="mt-2 text-sm text-red-300">
            {result.errors.company}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="contact-message" className="text-sm">
          What would you like to optimize?
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          maxLength={5000}
          required
          className={`${inputClass} resize-y`}
          placeholder="Your models, hardware, traffic, and performance goals…"
          aria-invalid={!!result?.errors?.message}
          aria-describedby={result?.errors?.message ? 'contact-message-error' : undefined}
        />
        {result?.errors?.message && (
          <p id="contact-message-error" className="mt-2 text-sm text-red-300">
            {result.errors.message}
          </p>
        )}
      </div>
      <div hidden aria-hidden="true">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {result && (
        <p role="alert" className="text-sm text-red-300">
          {result.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-bg inline-flex w-full cursor-pointer items-center justify-between px-6 py-3.5 text-sm font-semibold hover:bg-teal-200 disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send inquiry'} <span aria-hidden="true">↗</span>
      </button>
      <p className="text-secondary text-xs leading-relaxed">
        Your details go to the Cacheon team so we can respond to your inquiry.
      </p>
    </fetcher.Form>
  )
}
