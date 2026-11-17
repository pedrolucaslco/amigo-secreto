import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const nav = useNavigate()
  const { session, profile } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (session && profile) nav(profile.is_admin ? '/admin' : '/livros', { replace: true })
  }, [session, profile, nav])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { name: name.trim() } },
          })
        : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) setError(traduz(error.message))
  }

  return (
    <div className="login">
      <div className="logo">
        <div className="emoji" aria-hidden="true">📚</div>
        <h1>Amigo Secreto de Livros</h1>
        <p className="muted">Sugira livros e descubra quem você tirou.</p>
      </div>

      <div className="segmented" role="tablist">
        <button type="button" className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>
          Cadastrar
        </button>
        <button type="button" className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>
          Entrar
        </button>
      </div>

      <form className="stack" onSubmit={submit}>
        {mode === 'signup' && (
          <label>
            Nome
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label>
          Senha
          <PasswordInput
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
          />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn block" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}

function traduz(msg: string) {
  if (msg.includes('Invalid login')) return 'Email ou senha incorretos.'
  if (msg.includes('already registered')) return 'Este email já está cadastrado. Use "Entrar".'
  if (msg.includes('Database error saving new user'))
    return 'Cadastros encerrados: o sorteio já foi realizado.'
  return msg
}
