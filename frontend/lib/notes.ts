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

export type Tag = {
  name: string
  color?: string | null
  description?: string | null
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

export async function listTags(token: string): Promise<Tag[]> {
  const res = await fetch(`${getApiBaseUrl()}/notes/tags`, {
    headers: getAuthHeader(token),
  })
  if (!res.ok) throw new Error(await readApiError(res))
  return (await res.json()) as Tag[]
}

export async function createTagApi(
  token: string,
  name: string,
  color?: string,
  description?: string
): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/notes/tags`, {
    method: "POST",
    headers: getAuthHeader(token),
    body: JSON.stringify({ name, color, description }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
}

export async function renameTag(
  token: string,
  oldName: string,
  newName: string,
  color?: string,
  description?: string
): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/notes/tags/${encodeURIComponent(oldName)}`, {
    method: "PATCH",
    headers: getAuthHeader(token),
    body: JSON.stringify({ newName, color, description }),
  })
  if (!res.ok) throw new Error(await readApiError(res))
}

export async function deleteTag(
  token: string,
  name: string
): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/notes/tags/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: getAuthHeader(token),
  })
  if (!res.ok) throw new Error(await readApiError(res))
}