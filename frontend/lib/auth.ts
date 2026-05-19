import { getApiBaseUrl, readApiError } from "./api"

export type AuthUser = {
  id: string
  fullName: string
  email: string
}

export type AuthResponse = {
  accessToken: string
  user: AuthUser
}

const ACCESS_TOKEN_KEY = "accessToken"
const AUTH_USER_KEY = "authUser"

export async function login(input: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as AuthResponse
}

export async function register(input: {
  fullName: string
  email: string
  password: string
}): Promise<AuthResponse> {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as AuthResponse
}

export function saveAuthSession(data: AuthResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user))
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export async function updateProfile(
  token: string,
  fullName: string
): Promise<AuthUser> {
  const res = await fetch(`${getApiBaseUrl()}/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fullName }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  const updatedUser = (await res.json()) as AuthUser
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser))
  return updatedUser
}

export async function changePassword(
  token: string,
  input: { oldPassword: string; newPassword: string }
): Promise<{ message: string }> {
  const res = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as { message: string }
}

export async function verifyEmail(email: string): Promise<boolean> {
  const res = await fetch(`${getApiBaseUrl()}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return true
}

export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, newPassword }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return true
}