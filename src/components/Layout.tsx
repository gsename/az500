import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { applyTheme, getStoredTheme, type Theme } from '../lib/theme'

export default function Layout() {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <NavLink to="/" className="brand" end>
          <span className="brand-badge">AZ</span>
          AZ-500 Study Guide
        </NavLink>
        <NavLink to="/" className="nav-link" end>
          Dashboard
        </NavLink>
        <NavLink to="/domains" className="nav-link">
          Domaines
        </NavLink>
        <NavLink to="/exam" className="nav-link">
          Examen blanc
        </NavLink>
        <NavLink to="/labs" className="nav-link">
          Labs
        </NavLink>
        <button className="theme-toggle" onClick={toggleTheme} title="Changer de thème" aria-label="Changer de thème">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
      <div className="page">
        <Outlet />
      </div>
    </div>
  )
}
