import { getApiBaseUrl, getAuthHeader, readApiError } from "./api"

export type Note = {
  id: string
  title: string
  content?: string | null
  userId: string
  createdAt: string
  updatedAt: string
  tags?: string[]
}

export async function listNotes(token: string): Promise<Note[]> {
  const res = await fetch(`${getApiBaseUrl()}/notes`, {
    headers: getAuthHeader(token),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as Note[]
}

export async function createNote(
  token: string,
  input: { title: string; content?: string; tags?: string[] }
): Promise<Note> {
  const res = await fetch(`${getApiBaseUrl()}/notes`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as Note
}

export async function updateNote(
  token: string,
  id: string,
  input: { title?: string; content?: string; tags?: string[] }
): Promise<Note> {
  const res = await fetch(`${getApiBaseUrl()}/notes/${id}`, {
    method: "PATCH",
    headers: getAuthHeader(token),
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as Note
}

export async function deleteNote(token: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/notes/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(token),
  })
  if (!res.ok) throw new Error(await readApiError(res))
}

export async function listTags(token: string): Promise<string[]> {
  const res = await fetch(`${getApiBaseUrl()}/notes/tags`, {
    headers: getAuthHeader(token),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as string[]
}