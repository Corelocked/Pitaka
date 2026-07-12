export function reportAppError(scope, error, context = {}) {
  const entry = {
    scope,
    message: error?.message || String(error || 'Unknown error'),
    context,
    createdAt: new Date().toISOString()
  }

  console.error(`[${scope}]`, error, context)

  if (typeof window === 'undefined') return

  try {
    const key = 'pitaka.errorLog'
    const current = JSON.parse(window.localStorage.getItem(key) || '[]')
    window.localStorage.setItem(key, JSON.stringify([entry, ...current].slice(0, 20)))
  } catch {
    // Ignore storage failures.
  }
}
