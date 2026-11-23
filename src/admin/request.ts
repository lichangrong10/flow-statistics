import { BizError, request } from '@/api/request'

export class ApiError extends BizError {
  constructor(message: string, code = 5000) {
    super(code, message)
    this.name = 'ApiError'
  }
}

export function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return request<T>('GET', url, { params })
}

export function post<T>(url: string, data?: unknown): Promise<T> {
  return request<T>('POST', url, { data })
}

export function put<T>(url: string, data?: unknown): Promise<T> {
  return request<T>('PUT', url, { data })
}

export function del<T>(url: string, data?: unknown): Promise<T> {
  return request<T>('DELETE', url, { data })
}
