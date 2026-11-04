import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Customer } from './types'

interface AuthState {
  session: Session | null
  profile: Customer | null
  loading: boolean
  signIn: (email: string, password: string, remember: boolean) => Promise<string | null>
  signUp: (email: string, password: string, fullName: string, phone: string, remember: boolean) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthCtx = createContext<AuthState>({} as AuthState)
export const useAuth = () => useContext(AuthCtx)

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => { sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!session?.user) { setProfile(null); return }
      const { data } = await supabase.from('customers').select('*').eq('user_id', session.user.id).maybeSingle()
      setProfile((data as Customer | null) ?? null)
    }
    load()
  }, [session])

  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    localStorage.setItem('jk-remember', rememberMe ? '1' : '0')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  const signUp = async (email: string, password: string, fullName: string, phone: string, rememberMe: boolean) => {
    localStorage.setItem('jk-remember', rememberMe ? '1' : '0')
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, phone } },
    })
    if (error) return error.message
    // create the customer profile row linked to this auth user
    if (data.user) {
      await supabase.from('customers').upsert({
        user_id: data.user.id, email, full_name: fullName, phone,
      }, { onConflict: 'user_id' }).select()
    }
    return null
  }

  const signOut = async () => { await supabase.auth.signOut(); setProfile(null) }

  return (
    <AuthCtx.Provider value={{ session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  )
}
