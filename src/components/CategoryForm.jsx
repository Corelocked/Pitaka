import { useState, useEffect } from 'react'
import './Form.css'

function CategoryForm({ onAddCategory, editingCategory, onUpdateCategory, onCancelEdit }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name)
      setDescription(editingCategory.description || '')
    } else {
      setName('')
      setDescription('')
    }
  }, [editingCategory])

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      if (editingCategory) {
        await onUpdateCategory({ ...editingCategory, name: name.trim(), description: description.trim() })
      } else {
        await onAddCategory({ name: name.trim(), description: description.trim() })
        setName('')
        setDescription('')
      }
    } catch (err) {
      setError(err.message || 'Could not save category. Please try again.')
    } finally { setSaving(false) }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    onCancelEdit()
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-group">
        <label htmlFor="category-name">Category Name</label>
        <input
          id="category-name"
          type="text"
          placeholder="e.g., Food, Transportation, Entertainment"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="category-description">Description (Optional)</label>
        <input
          id="category-description"
          type="text"
          placeholder="Brief description of this category"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="form-buttons">
        <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingCategory ? 'Save category' : 'Add category'}</button>
        {editingCategory && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default CategoryForm
