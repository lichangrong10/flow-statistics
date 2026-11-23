import { request } from './request'
import type { UserProfile } from '@/types'
import { mapUser, type RealUser } from './real'

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  expiresIn: number
  user: UserProfile
}

interface RealLoginResult {
  token: string
  tokenType: string
  expiresIn: string | number
  user: RealUser
}

export async function login(payload: LoginPayload): Promise<LoginResult> {
  const result = await request<RealLoginResult>('POST', '/auth/login', { data: payload })
  const expiresIn =
    typeof result.expiresIn === 'number'
      ? result.expiresIn
      : Number.parseInt(result.expiresIn, 10) || 7200
  return { token: result.token, expiresIn, user: mapUser(result.user) }
}

export function logout(): Promise<unknown> {
  return request('POST', '/auth/logout')
}

export async function getProfile(): Promise<UserProfile> {
  const profile = await request<RealUser>('GET', '/auth/profile')
  return mapUser(profile)
}
