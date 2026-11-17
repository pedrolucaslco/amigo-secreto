import { useCallback, useEffect, useState } from 'react'
import { supabase, type Book, type Profile } from '../lib/supabase'
import { exportXlsx } from '../lib/exportXlsx'

type DrawRow = { giver_id: string; receiver_id: string }
type View = 'painel' | 'sorteio' | 'planilha'

export default function Admin({ view }: { view: View }) {
  const [people, setPeople] = useState<Profile[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [draw, setDraw] = useState<DrawRow[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    const [p, b, d] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_admin', false).order('name'),
      supabase.from('books').select('*').order('id'),
      supabase.from('draw').select('*'),
    ])
    setPeople((p.data as Profile[]) ?? [])
    setBooks((b.data as Book[]) ?? [])
    setDraw((d.data as DrawRow[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const name = (id: string) => people.find((p) => p.id === id)?.name ?? '?'
  const done = draw.length > 0
  const missing = people.filter((p) => !books.some((b) => b.user_id === p.id))

  async function sortear() {
    setMessage('')
    if (!confirm(`Sortear entre ${people.length} participantes?`)) return
    let { data, error } = await supabase.rpc('run_draw', { p_force: false })
    if (error) return setMessage(error.message)
    if (data && !data.done) {
      const ok = confirm(`Sem livros cadastrados: ${data.missing_books.join(', ')}.\nSortear mesmo assim?`)
      if (!ok) return
      ;({ data, error } = await supabase.rpc('run_draw', { p_force: true }))
      if (error) return setMessage(error.message)
    }
    setMessage('Sorteio realizado!')
    load()
  }

  async function resetar() {
    if (!confirm('Apagar o sorteio atual e reabrir edição de livros?')) return
    const { error } = await supabase.rpc('reset_draw')
    if (error) return setMessage(error.message)
    setMessage('Sorteio resetado.')
    load()
  }

  if (loading) return <p className="center">Carregando…</p>

  return (
    <>
      {view === 'painel' && (
        <>
          <div className="stats">
            <div className="stat"><b>{people.length}</b><span>participantes</span></div>
            <div className="stat"><b>{people.length - missing.length}</b><span>com livros</span></div>
            <div className="stat"><b>{missing.length}</b><span>faltando</span></div>
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <button className="btn secondary small" onClick={load}>Atualizar</button>
          </div>
          {people.map((p) => {
            const mine = books.filter((b) => b.user_id === p.id)
            return (
              <div className="card person" key={p.id}>
                <div className="person-head">
                  <div>
                    <strong>{p.name}</strong>
                    <div className="muted">{p.email}</div>
                  </div>
                  {mine.length === 0 ? (
                    <span className="badge warn">falta cadastrar</span>
                  ) : (
                    <span className="badge ok">{mine.length} {mine.length === 1 ? 'livro' : 'livros'}</span>
                  )}
                </div>
                {mine.length > 0 && (
                  <ul>
                    {mine.map((b) => (
                      <li key={b.id}>
                        {b.title} — {b.author}
                        {b.link && <> · <a href={b.link} target="_blank" rel="noreferrer">link</a></>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
          {people.length === 0 && <p className="center">Ninguém se cadastrou ainda.</p>}
        </>
      )}

      {view === 'sorteio' && (
        <>
          <div className="card stack">
            <p style={{ margin: 0 }}>
              {done
                ? 'O sorteio já foi realizado.'
                : `${people.length} participantes · ${missing.length} sem livros.`}
            </p>
            {!done && <button className="btn block" onClick={sortear}>🎲 Sortear agora</button>}
            {done && <button className="btn danger block" onClick={resetar}>Resetar sorteio</button>}
            {message && <p className="muted" role="status">{message}</p>}
          </div>
          {done && (
            <div className="card">
              <h3 style={{ marginBottom: 8 }}>Quem tirou quem</h3>
              {draw.map((d) => (
                <div className="draw-line" key={d.giver_id}>
                  <strong>{name(d.giver_id)}</strong>
                  <span className="arrow">→</span>
                  <span>{name(d.receiver_id)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === 'planilha' && (
        <div className="card stack">
          <p style={{ margin: 0 }}>
            Baixe um arquivo <strong>.xlsx</strong> com as abas Participantes, Livros e Sorteio.
          </p>
          <button className="btn block" onClick={() => exportXlsx(people, books, draw)}>
            ⬇ Exportar planilha
          </button>
        </div>
      )}
    </>
  )
}
