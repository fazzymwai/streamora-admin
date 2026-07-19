'use client'

import { useState, type FormEvent } from 'react'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

function errorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message.replace('Firebase: ', '')
  }
  return 'Sign-in failed. Try again.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(signIn: () => Promise<unknown>) {
    setBusy(true)
    setError('')
    try {
      await signIn()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void run(() => signInWithEmailAndPassword(auth, email, password))
  }

  return (
    <div className="screen-center">
      <div className="card auth-card">
        <h1 className="brand">
          Streamora <span className="brand-accent">Admin</span>
        </h1>
        <p className="muted">Sign in with an admin account.</p>
        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              required
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button className="btn primary" type="submit" disabled={busy}>
            Sign in
          </button>
        </form>
        <div className="divider">or</div>
        <button
          className="btn ghost"
          disabled={busy}
          onClick={() => void run(() => signInWithPopup(auth, googleProvider))}
        >
          Continue with Google
        </button>
        {error ? <p className="error">{error}</p> : null}
      </div>
    </div>
  )
}
