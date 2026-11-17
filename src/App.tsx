import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './lib/auth'
import { supabase } from './lib/supabase'
import TabBar, { icons, type TabDef } from './components/TabBar'
import Login from './pages/Login'
import Books from './pages/Books'
import Result from './pages/Result'
import Admin from './pages/Admin'

const participantTabs: TabDef[] = [
  { to: '/livros', label: 'Livros', icon: icons.books },
  { to: '/resultado', label: 'Meu amigo', icon: icons.gift },
]
const adminTabs: TabDef[] = [
  { to: '/admin', label: 'Painel', icon: icons.panel, end: true },
  { to: '/admin/sorteio', label: 'Sorteio', icon: icons.shuffle },
  { to: '/admin/planilha', label: 'Planilha', icon: icons.sheet },
]

const titles: Record<string, string> = {
  '/livros': 'Meus livros',
  '/resultado': 'Meu amigo secreto',
  '/admin': 'Painel',
  '/admin/sorteio': 'Sorteio',
  '/admin/planilha': 'Planilha',
}

function Protected({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <p className="center">Carregando…</p>
  if (!session) return <Navigate to="/" replace />
  if (!profile) return <p className="center">Carregando perfil…</p>
  if (admin && !profile.is_admin) return <Navigate to="/livros" replace />
  if (!admin && profile.is_admin) return <Navigate to="/admin" replace />
  return <>{children}</>
}

export default function App() {
  const { session, profile } = useAuth()
  const { pathname } = useLocation()
  const showTabs = Boolean(session && profile)
  const tabs = profile?.is_admin ? adminTabs : participantTabs
  const title = titles[pathname]

  return (
    <>
      {showTabs && title && (
        <header className="app-header">
          <h1>{title}</h1>
          <span className="sub">{profile?.name.split(' ')[0]}</span>
        </header>
      )}
      <main className={'app-content' + (showTabs ? '' : ' no-tabs')}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/livros" element={<Protected><Books /></Protected>} />
          <Route path="/resultado" element={<Protected><Result /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin view="painel" /></Protected>} />
          <Route path="/admin/sorteio" element={<Protected admin><Admin view="sorteio" /></Protected>} />
          <Route path="/admin/planilha" element={<Protected admin><Admin view="planilha" /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {showTabs && <TabBar tabs={tabs} onLogout={() => supabase.auth.signOut()} />}
    </>
  )
}
