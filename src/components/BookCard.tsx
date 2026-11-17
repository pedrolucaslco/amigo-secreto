import type { Book } from '../lib/supabase'

export default function BookCard({ book, onRemove }: { book: Book; onRemove?: () => void }) {
  return (
    <div className="book">
      <div className="cover" aria-hidden="true">{book.title.charAt(0).toUpperCase()}</div>
      <div className="info">
        <strong>{book.title}</strong>
        <span>{book.author}</span>
        {book.link && (
          <div>
            <a href={book.link} target="_blank" rel="noreferrer">Ver livro ↗</a>
          </div>
        )}
      </div>
      {onRemove && (
        <button className="link-btn" onClick={onRemove} aria-label={`Remover ${book.title}`}>
          Remover
        </button>
      )}
    </div>
  )
}
