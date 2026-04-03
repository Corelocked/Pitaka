import { useState } from 'react'
import emailjs from '@emailjs/browser'
import './ContactForm.css'

const EMAILJS_SERVICE_ID = String(import.meta.env.VITE_EMAILJS_SERVICE_ID || '')
const EMAILJS_TEMPLATE_ID = String(import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '')
const EMAILJS_PUBLIC_KEY = String(import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '')

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  topic: 'feedback',
  subject: '',
  message: '',
  company: ''
}

const TOPIC_LABELS = {
  feedback: 'Feedback',
  suggestion: 'Suggestion',
  concern: 'Concern'
}

function isEmailJsConfigured() {
  return Boolean(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY)
}

export default function ContactForm() {
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)
  const [submitState, setSubmitState] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!isEmailJsConfigured()) {
      setSubmitState({
        type: 'error',
        message: 'This contact form is not configured yet. Add the EmailJS environment variables before using it.'
      })
      return
    }

    if (formState.company.trim()) {
      setSubmitState({
        type: 'success',
        message: 'Thanks. Your message was received.'
      })
      setFormState(INITIAL_FORM_STATE)
      return
    }

    setIsSubmitting(true)
    setSubmitState({ type: 'idle', message: '' })

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formState.name.trim(),
          reply_to: formState.email.trim(),
          topic: TOPIC_LABELS[formState.topic] || 'Feedback',
          subject: formState.subject.trim(),
          message: formState.message.trim(),
          app_name: 'Pitaka'
        },
        {
          publicKey: EMAILJS_PUBLIC_KEY
        }
      )

      setSubmitState({
        type: 'success',
        message: 'Message sent. Thanks for sharing your thoughts.'
      })
      setFormState(INITIAL_FORM_STATE)
    } catch (error) {
      console.error('EmailJS submit failed:', error)
      setSubmitState({
        type: 'error',
        message: 'Message failed to send. Check your EmailJS configuration and try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isConfigured = isEmailJsConfigured()

  return (
    <form className="landing-contact-form" onSubmit={handleSubmit}>
      <div className="landing-contact-grid">
        <div className="landing-contact-field">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            value={formState.name}
            onChange={handleChange}
            placeholder="Your name"
            autoComplete="name"
            required
          />
        </div>

        <div className="landing-contact-field">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            value={formState.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="landing-contact-grid">
        <div className="landing-contact-field">
          <label htmlFor="contact-topic">Type</label>
          <select
            id="contact-topic"
            name="topic"
            value={formState.topic}
            onChange={handleChange}
          >
            <option value="feedback">Feedback</option>
            <option value="suggestion">Suggestion</option>
            <option value="concern">Concern</option>
          </select>
        </div>

        <div className="landing-contact-field">
          <label htmlFor="contact-subject">Subject</label>
          <input
            id="contact-subject"
            name="subject"
            type="text"
            value={formState.subject}
            onChange={handleChange}
            placeholder="What is this about?"
            required
          />
        </div>
      </div>

      <div className="landing-contact-field landing-contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          value={formState.company}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="landing-contact-field">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          name="message"
          value={formState.message}
          onChange={handleChange}
          placeholder="Tell us what you like, what should improve, or what went wrong."
          rows={6}
          required
        />
      </div>

      <div className="landing-contact-actions">
        <button
          type="submit"
          className="landing-btn landing-btn-primary landing-contact-submit"
          disabled={isSubmitting || !isConfigured}
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
        {!isConfigured && (
          <p className="landing-contact-note">
            Configure `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, and `VITE_EMAILJS_PUBLIC_KEY` to enable submissions.
          </p>
        )}
      </div>

      {submitState.message && (
        <p
          className={`landing-contact-status ${submitState.type === 'error' ? 'error' : 'success'}`}
          role="status"
          aria-live="polite"
        >
          {submitState.message}
        </p>
      )}
    </form>
  )
}
