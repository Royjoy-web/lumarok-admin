"use client"

import * as React from "react"
import { Auth, loadUser, clearAuth, silentRefresh, type User } from "@/lib/api"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const router = useRouter()

  // Initialize auth state
  React.useEffect(() => {
    const initAuth = async () => {
      const storedUser = loadUser()
      if (storedUser?.role === 'admin') {
        try {
          await silentRefresh()
          const { user: freshUser } = await Auth.me()
          if (freshUser?.role === 'admin') {
            setUser(freshUser)
          } else {
            clearAuth()
            setUser(null)
          }
        } catch {
          clearAuth()
          setUser(null)
        }
      } else {
        clearAuth()
        setUser(null)
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  // Listen for session expiry
  React.useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null)
      router.push('/login')
    }

    window.addEventListener('lmr:session-expired', handleSessionExpired)
    return () => window.removeEventListener('lmr:session-expired', handleSessionExpired)
  }, [router])

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await Auth.login(email, password)
    setUser(loggedInUser)
  }

  const logout = () => {
    Auth.logout()
    setUser(null)
    router.push('/login')
  }

  const refreshUser = async () => {
    try {
      const { user: freshUser } = await Auth.me()
      setUser(freshUser)
    } catch {
      logout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
