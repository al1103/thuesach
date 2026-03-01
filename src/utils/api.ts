const API_BASE = 'http://localhost:3001/api'

function getToken(): string | null {
  return sessionStorage.getItem('auth_token')
}

function setToken(token: string): void {
  sessionStorage.setItem('auth_token', token)
}

function clearToken(): void {
  sessionStorage.removeItem('auth_token')
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Lỗi không xác định' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  auth: {
    async login(username: string, password: string) {
      const result = await request<{ user: unknown; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      setToken(result.token)
      return result
    },
    async register(data: {
      username: string
      password: string
      name: string
      email?: string
      phone?: string
    }) {
      const result = await request<{ user: unknown; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      setToken(result.token)
      return result
    },
    async me() {
      return request<{ user: unknown }>('/auth/me')
    },
    logout() {
      clearToken()
    },
  },

  books: {
    getAll: () => request<unknown[]>('/books'),
    get: (id: number) => request<unknown>(`/books/${id}`),
    create: (data: unknown) =>
      request<unknown>('/books', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: unknown) =>
      request<unknown>(`/books/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/books/${id}`, { method: 'DELETE' }),
  },

  members: {
    getAll: () => request<unknown[]>('/members'),
    get: (id: number) => request<unknown>(`/members/${id}`),
    create: (data: unknown) =>
      request<unknown>('/members', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: unknown) =>
      request<unknown>(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/members/${id}`, { method: 'DELETE' }),
    blacklist: (id: number, until: string, reason: string) =>
      request<{ message: string }>(`/members/${id}/blacklist`, {
        method: 'POST',
        body: JSON.stringify({ until, reason }),
      }),
    unblacklist: (id: number) =>
      request<{ message: string }>(`/members/${id}/blacklist`, { method: 'DELETE' }),
  },

  rentals: {
    getAll: () => request<unknown[]>('/rentals'),
    getMy: () => request<unknown[]>('/rentals/my'),
    create: (bookId: number, memberId: number, dueDate?: string) =>
      request<unknown>('/rentals', {
        method: 'POST',
        body: JSON.stringify({ bookId, memberId, dueDate }),
      }),
    return: (id: number) => request<unknown>(`/rentals/${id}/return`, { method: 'PUT' }),
    getQR: (id: number) =>
      request<{ rentalId: number; amount: number; description: string; qrUrl: string }>(
        `/rentals/${id}/qr`
      ),
  },

  requests: {
    getAll: () => request<unknown[]>('/requests'),
    getMy: () => request<unknown[]>('/requests/my'),
    create: (bookId: number, note?: string) =>
      request<unknown>('/requests', { method: 'POST', body: JSON.stringify({ bookId, note }) }),
    approve: (id: number) =>
      request<{ message: string }>(`/requests/${id}/approve`, { method: 'PUT' }),
    reject: (id: number) =>
      request<{ message: string }>(`/requests/${id}/reject`, { method: 'PUT' }),
  },

  extensions: {
    getAll: () => request<unknown[]>('/extensions'),
    getMy: () => request<unknown[]>('/extensions/my'),
    create: (rentalId: number, requestedDueDate: string, note?: string) =>
      request<unknown>('/extensions', {
        method: 'POST',
        body: JSON.stringify({ rentalId, requestedDueDate, note }),
      }),
    approve: (id: number) =>
      request<{ message: string }>(`/extensions/${id}/approve`, { method: 'PUT' }),
    reject: (id: number) =>
      request<{ message: string }>(`/extensions/${id}/reject`, { method: 'PUT' }),
  },

  stats: {
    get: () => request<unknown>('/stats'),
  },
}

export { getToken, setToken, clearToken }
