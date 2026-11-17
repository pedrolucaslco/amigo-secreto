import { useEffect, useState } from 'react'
import { supabase, type Book } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import BookCard from '../components/BookCard'

export default function Result() {
  const { session } = useAuth()
  const uid = session!.user.id
  const [loading, setLoading] = useState(true)
  const [friend, setFriend] = useState<string | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: d } = await supabase
        .from('draw')
        .select('receiver_id')
        .eq('giver_id', uid)
        .maybeSingle()
      if (d) {
        const [p, b] = await Promise.all([
          supabase.from('profiles').select('name').eq('id', d.receiver_id).single(),
          supabase.from('books').select('*').eq('user_id', d.receiver_id).order('id'),
        ])
        setFriend(p.data?.name ?? null)
        setBooks((b.data as Book[]) ?? [])
      }
      setLoading(false)
    })()
  }, [uid])

  if (loading) return <p className="center">Carregando…</p>

  if (!friend)
    return (
      <div className="card center" style={{ marginTop: 16 }}>
        <div style={{ fontSize: 48 }} aria-hidden="true">⏳</div>
        <h2 style={{ color: 'var(--fg)' }}>O sorteio ainda não foi realizado</h2>
        <p className="muted">Volte em breve!</p>
      </div>
    )

  return (
    <>
      <div className="gift-wrap">
        <button
          className={'gift' + (revealed ? ' open' : '')}
          onClick={() => setRevealed(true)}
          aria-label={revealed ? `Você tirou ${friend}` : 'Toque para revelar quem você tirou'}
        >
          <div className="face front">
            <span className="emoji" aria-hidden="true">🎁</span>
            <span>Toque para revelar</span>
          </div>
          <div className="face back">
            <span className="muted">Você tirou</span>
            <span className="name">{friend}</span>
          </div>
        </button>
      </div>

      {revealed && (
        <>
          <h3 style={{ margin: '8px 0 12px' }}>Sugestões de livros</h3>
          {books.map((b) => <BookCard key={b.id} book={b} />)}
          {books.length === 0 && <p className="muted">Esta pessoa não cadastrou livros.</p>}
          <button className="link-btn" onClick={() => setRevealed(false)}>Esconder</button>
        </>
      )}
    </>
  )
}
