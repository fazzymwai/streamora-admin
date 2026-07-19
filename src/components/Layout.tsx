'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { signOut, useAuth } from '../auth/context'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/movies', label: 'Movies' },
  { href: '/categories', label: 'Categories' },
  { href: '/users', label: 'Users' },
]

function isActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          Streamora <span className="brand-accent">Admin</span>
        </div>
        <nav className="nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(pathname, link.href) ? 'nav-link active' : 'nav-link'
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="muted small">{user?.email}</div>
          <button className="btn ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  )
}
