import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function Account() {
  const { profile } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setOk(false)
    if (password !== confirm) return setError('As senhas não conferem.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(traduz(error.message))
    setPassword('')
    setConfirm('')
    setOk(true)
  }

  return (
    <>
      <div className="card">
        <strong>{profile?.name}</strong>
        <div className="muted">{profile?.email}</div>
      </div>

      <form className="card stack" onSubmit={submit}>
        <h3>Alterar senha</h3>
        <label>
          Nova senha
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Repita a nova senha
          <input
            type="password"
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        {ok && <p className="ok" role="status">Senha alterada com sucesso.</p>}
        <button className="btn block" disabled={busy}>{busy ? 'Salvando…' : 'Salvar nova senha'}</button>
      </form>
      <p className="muted">Esqueceu a senha? Peça uma senha temporária ao organizador pelo grupo.</p>
    </>
  )
}

function traduz(msg: string) {
  if (msg.includes('different from the old password')) return 'A nova senha precisa ser diferente da atual.'
  if (msg.includes('at least')) return 'A senha precisa ter pelo menos 6 caracteres.'
  return msg
}
