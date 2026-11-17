import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

export type TabDef = { to: string; label: string; icon: ReactNode; end?: boolean }

const svg = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">{d}</svg>
)

export const icons = {
  books: svg(<><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h6" /></>),
  gift: svg(<><rect x="3" y="8" width="18" height="5" rx="1" /><path d="M5 13v7h14v-7" /><path d="M12 8v12" /><path d="M12 8S10 3 7.5 4.5 8 8 12 8zm0 0s2-5 4.5-3.5S16 8 12 8z" /></>),
  panel: svg(<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 11a3 3 0 1 0 0-6" /><path d="M21 20c0-2.5-1.5-4.600-4-5.500" /></>),
  shuffle: svg(<><path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" /></>),
  sheet: svg(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M4 15h16M10 9v12" /></>),
  user: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.400 3.600-7 8-7s8 2.600 8 7" /></>),
  logout: svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>),
}

export default function TabBar({ tabs, onLogout }: { tabs: TabDef[]; onLogout: () => void }) {
  return (
    <nav className="tabbar" aria-label="Navegação principal">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}
        >
          {t.icon}
          {t.label}
        </NavLink>
      ))}
      <button className="tab" onClick={onLogout}>
        {icons.logout}
        Sair
      </button>
    </nav>
  )
}
