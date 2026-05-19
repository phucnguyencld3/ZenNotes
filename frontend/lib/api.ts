type ApiErrorShape = {
  message?: string | string[]
  error?: string
  statusCode?: number
}

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
}

export function getAuthHeader(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

export async function readApiError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorShape
    if (Array.isArray(data.message)) return data.message.join("\n")
    if (typeof data.message === "string" && data.message.trim()) return data.message
    if (typeof data.error === "string" && data.error.trim()) return data.error
  } catch {
    // ignore
  }
  return `${res.status} ${res.statusText || "Request failed"}`
}