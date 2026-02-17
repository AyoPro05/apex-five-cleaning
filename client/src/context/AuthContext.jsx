/**
 * AUTH CONTEXT
 * Manages user authentication state, tokens, and session.
 * GDPR: Tokens stored in sessionStorage by default (cleared on tab close).
 * Option to use localStorage for "remember me".
 */

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { post } from '../utils/apiClient'

const AuthContext = createContext(null)

const TOKEN_KEY = 'jwtToken'
const REFRESH_KEY = 'refreshToken'
const USER_KEY = 'user'
const REMEMBER_KEY = 'rememberMe'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const openSignInRef = useRef(null)
  const openSignUpRef = useRef(null)

  const getStorage = () =>
    typeof window !== 'undefined' && localStorage.getItem(REMEMBER_KEY) === 'true'
      ? localStorage
      : sessionStorage

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }
    const fromLocal = localStorage.getItem(TOKEN_KEY)
    const fromSession = sessionStorage.getItem(TOKEN_KEY)
    const savedToken = fromLocal || fromSession
    const savedUser = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(REFRESH_KEY)
        sessionStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password, rememberMe = false) => {
    const data = await post('/api/auth/login', { email, password, rememberMe })
    const st = typeof window !== 'undefined' ? (rememberMe ? localStorage : sessionStorage) : null
    if (st && data.tokens) {
      if (rememberMe) localStorage.setItem(REMEMBER_KEY, 'true')
      else localStorage.removeItem(REMEMBER_KEY)
      st.setItem(TOKEN_KEY, data.tokens.accessToken)
      st.setItem(REFRESH_KEY, data.tokens.refreshToken)
      st.setItem(USER_KEY, JSON.stringify(data.user))
    }
    setToken(data.tokens.accessToken)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const data = await post('/api/auth/register', formData)
    const st = typeof window !== 'undefined' ? (formData.rememberMe ? localStorage : sessionStorage) : null
    if (st && data.tokens) {
      if (formData.rememberMe) localStorage.setItem(REMEMBER_KEY, 'true')
      else localStorage.removeItem(REMEMBER_KEY)
      st.setItem(TOKEN_KEY, data.tokens.accessToken)
      st.setItem(REFRESH_KEY, data.tokens.refreshToken)
      st.setItem(USER_KEY, JSON.stringify(data.user))
      setToken(data.tokens.accessToken)
      setUser(data.user)
    }
    return data
  }

  const logout = async () => {
    try {
      await post('/api/auth/logout')
    } catch {}
    ;[localStorage, sessionStorage].forEach((s) => {
      s.removeItem(TOKEN_KEY)
      s.removeItem(REFRESH_KEY)
      s.removeItem(USER_KEY)
      s.removeItem(REMEMBER_KEY)
    })
    setUser(null)
    setToken(null)
  }

  const getToken = () => getStorage()?.getItem(TOKEN_KEY)
  const isAuthenticated = () => !!user && !!getToken()

  const registerAuthModals = (openSignIn, openSignUp) => {
    openSignInRef.current = openSignIn
    openSignUpRef.current = openSignUp
  }

  const value = {
    user,
    token: getToken(),
    loading,
    login,
    register,
    logout,
    isAuthenticated: isAuthenticated(),
    openSignIn: () => openSignInRef.current?.(),
    openSignUp: () => openSignUpRef.current?.(),
    registerAuthModals,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
