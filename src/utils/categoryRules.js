const RULES = [
  ['Subscription', /\b(netflix|spotify|youtube|prime|icloud|subscription|membership)\b/i],
  ['Food', /\b(grocery|groceries|restaurant|cafe|coffee|food|meal|dinner|lunch|breakfast)\b/i],
  ['Transport', /\b(gas|fuel|grab|uber|taxi|bus|train|fare|parking)\b/i],
  ['Utilities', /\b(electric|water|internet|wifi|phone|mobile|utility|utilities)\b/i],
  ['Rent', /\b(rent|lease|mortgage)\b/i],
  ['Health', /\b(pharmacy|doctor|hospital|clinic|medicine|health)\b/i]
]

const normalize = (value) => String(value || '').trim().toLowerCase()

export function suggestCategory(description, categories = []) {
  const text = String(description || '')
  if (!text.trim()) return ''

  for (const [ruleName, pattern] of RULES) {
    if (!pattern.test(text)) continue
    const match = categories.find((category) => normalize(category.name) === normalize(ruleName))
    if (match) return match.name
  }

  return ''
}
