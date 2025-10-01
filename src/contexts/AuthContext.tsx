'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if we're on the client side and if Supabase is configured
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!hasSupabaseConfig) {
      // Demo mode - create a mock user
      console.log('🔧 DEMO MODE: Using mock authentication (Supabase not configured)')
      const mockUser = {
        id: 'demo-user-123',
        email: 'demo@wherenext.com',
        user_metadata: {
          full_name: 'Demo User',
          avatar_url: null
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: null,
        confirmation_sent_at: null,
        recovery_sent_at: null,
        email_change_sent_at: null,
        new_email: null,
        invited_at: null,
        action_link: null,
        phone: null,
        role: 'authenticated',
        identities: []
      } as User

      const mockSession = {
        access_token: 'demo-token',
        refresh_token: 'demo-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session

      setUser(mockUser)
      setSession(mockSession)
      setLoading(false)
      return
    }

    // Real Supabase auth
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.error('Supabase auth error:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const hasSupabaseConfig = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (hasSupabaseConfig) {
      await supabase.auth.signOut()
    } else {
      // Demo mode - just clear the user
      setUser(null)
      setSession(null)
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
