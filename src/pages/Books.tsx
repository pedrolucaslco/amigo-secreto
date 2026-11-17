import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { supabase, type Book } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import BookCard from '../components/BookCard'

export default function Books() {
  const { session } = useAuth()
  const uid = session!.user.id
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const { data } = await supabase.from('books').select('*').eq('user_id', uid).order('id')
    setBooks((data as Book[]) ?? [])
    setLoading(false)
  }, [uid])

  useEffect(() => {
    load()
  }, [load])

  async function add(e: FormEvent) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('books').insert({
      user_id: uid,
      title: title.trim(),
      author: author.trim(),
      link: link.trim() || null,
    })
    if (error) return setError(error.message)
    setTitle('')
    setAuthor('')
    setLink('')
    setOpen(false)
    load()
  }

  async function remove(b: Book) {
    if (!confirm(`Remover "${b.title}"?`)) return
    const { error } = await supabase.from('books').delete().eq('id', b.id)
    if (error) setError(error.message)
    load()
  }

  if (loading) return <p className="center">Carregando…</p>

  return (
    <>
      <p className="muted">Sugira até 3 livros que você gostaria de ganhar. {books.length}/3</p>
      <div className="slots" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className={'slot' + (i < books.length ? ' on' : '')} />
        ))}
      </div>

      {books.map((b) => (
        <BookCard key={b.id} book={b} onRemove={() => remove(b)} />
      ))}
      {books.length === 0 && (
        <p className="muted" style={{ margin: '8px 0 16px' }}>
          Você ainda não sugeriu nenhum livro.
        </p>
      )}

      {error && !open && <p className="error" role="alert">{error}</p>}

      {books.length < 3 && !open && (
        <button className="btn block" onClick={() => setOpen(true)}>+ Adicionar livro</button>
      )}

      {open && (
        <form className="card stack" onSubmit={add}>
          <h3>Novo livro</h3>
          <label>
            Nome do livro
            <input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
          </label>
          <label>
            Autor
            <input value={author} onChange={(e) => setAuthor(e.target.value)} required />
          </label>
          <label>
            Link (opcional)
            <input type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="row">
            <button className="btn" style={{ flex: 1 }}>Salvar</button>
            <button type="button" className="btn secondary" onClick={() => { setOpen(false); setError('') }}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </>
  )
}
