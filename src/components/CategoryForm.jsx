import { useState, useEffect } from 'react'
import './Form.css'

function CategoryForm({ onAddCategory, editingCategory, onUpdateCategory, onCancelEdit }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (editingCategory) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(editingCategory.name)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDescription(editingCategory.description || '')
    }
  }, [editingCategory])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim()) {
      if (editingCategory) {
        onUpdateCategory({ ...editingCategory, name: name.trim(), description: description.trim() })
      } else {
        onAddCategory({ name: name.trim(), description: description.trim() })
        setName('')
        setDescription('')
      }
    }
  }

  const handleCancel = () => {
    setName('')
    setDescription('')
    onCancelEdit()
  }

  return (
    <form onSubmit={handleSubmit} className="form">
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
        <button type="submit">{editingCategory ? 'Update' : 'Add'} Category</button>
        {editingCategory && <button type="button" onClick={handleCancel}>Cancel</button>}
      </div>
    </form>
  )
}

export default CategoryForm