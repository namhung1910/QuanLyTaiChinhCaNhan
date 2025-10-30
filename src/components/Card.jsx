import './Card.css'

export default function Card({ 
  title, 
  description, 
  type, 
  isDefault = false, 
  onEdit, 
  onDelete, 
  children,
  className = '',
  showActions = true 
}) {
  return (
    <div className={`card ${className}`}>
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          {showActions && (
            <div className="card-actions">
              {onEdit && (
                <button className="card-btn edit-btn" onClick={onEdit}>
                  <span className="material-symbols-rounded">edit</span>
                </button>
              )}
              {onDelete && (
                <button className="card-btn delete-btn" onClick={onDelete}>
                  <span className="material-symbols-rounded">delete</span>
                </button>
              )}
            </div>
          )}
        </div>
        {description && (
          <p className="card-description">{description}</p>
        )}
        <div className="card-tags">
          {type && (
            <span className={`card-tag type-tag ${type === 'thu' ? 'income' : 'expense'}`}>
              {type === 'thu' ? 'Thu nhập' : 'Chi tiêu'}
            </span>
          )}
          {isDefault && (
            <span className="card-tag default-tag">Mặc định</span>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
