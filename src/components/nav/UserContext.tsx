'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface UserInfo {
  displayName: string
  initials: string
  email: string
  avatarUrl: string | null
  activeModules: string[]
}

const UserCtx = createContext<UserInfo | null>(null)

export function UserProvider({ value, children }: { value: UserInfo; children: ReactNode }) {
  return <UserCtx.Provider value={value}>{children}</UserCtx.Provider>
}

export function useUserInfo() {
  return useContext(UserCtx)
}
