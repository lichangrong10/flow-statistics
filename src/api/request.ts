import axios from 'axios'
import type { ApiResponse } from '@/types'
import { clearToken, getToken } from '@/utils/auth'

const baseURL = import.meta.env.VITE_API_BASE || '/api/v1'

export class BizError extends Error {
  code: number
  data?: unknown
  traceId?: string

  constructor(code: number, message: string, data?: unknown, traceId?: string) {
    super(message)
    this.name = 'BizError'
    this.code = code
    this.data = data
    this.traceId = traceId
  }
}

let unauthorizedHandler: (() => void) | null = null

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

function notifyUnauthorized(): void {
  unauthorizedHandler?.()
}

function traceId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
}

const http = axios.create({ baseURL, timeout: 30_000 })

http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Trace-Id'] = traceId()
  // 后端要求写接口必须携带 JSON body（即使是空对象）
  const method = (config.method ?? 'get').toUpperCase()
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && config.data === undefined) {
    config.data = {}
  }
  return config
})

export interface RequestOptions {
  params?: Record<string, unknown>
  data?: unknown
  timeout?: number
  responseType?: 'json' | 'blob'
  headers?: Record<string, string>
}

function handleUnauthorized(code?: number, status?: number): void {
  if (code === 1002 || status === 401) {
    clearToken()
    notifyUnauthorized()
  }
}

export async function request<T>(
  method: string,
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  try {
    const response = await http.request<ApiResponse<T>>({
      method,
      url,
      params: options.params,
      data: options.data,
      timeout: options.timeout,
      responseType: options.responseType ?? 'json',
      headers: options.headers,
    })
    const payload = response.data as ApiResponse<T> & { details?: unknown }
    if (payload.code !== 0) {
      handleUnauthorized(payload.code, response.status)
      throw new BizError(
        payload.code,
        payload.message || '请求失败',
        payload.data ?? (payload.details ? { details: payload.details } : undefined),
        payload.traceId,
      )
    }
    return payload.data
  } catch (error) {
    if (error instanceof BizError) throw error
    const response = (
      error as {
        response?: {
          status?: number
          data?: ApiResponse<unknown> & { details?: unknown }
        }
      }
    ).response
    const status = response?.status
    const payload = response?.data
    if (payload && typeof payload === 'object' && 'code' in payload) {
      handleUnauthorized(payload.code, status)
      throw new BizError(
        payload.code,
        payload.message || '请求失败',
        payload.data ?? (payload.details ? { details: payload.details } : undefined),
        payload.traceId,
      )
    }
    handleUnauthorized(undefined, status)
    const message =
      status === 403
        ? '无权限执行该操作'
        : status === 404
          ? '资源不存在或无权访问'
          : status
            ? `请求失败（HTTP ${status}），请稍后重试`
            : '网络异常，请检查内网连接后重试'
    throw new BizError(5000, message)
  }
}

/** 下载二进制文件 */
export async function requestBlob(
  method: string,
  url: string,
  options: RequestOptions = {},
): Promise<{ blob: Blob; fileName?: string }> {
  const response = await http.request<Blob>({
    method,
    url,
    params: options.params,
    data: options.data,
    responseType: 'blob',
    timeout: options.timeout ?? 120_000,
    headers: options.headers,
  })
  return {
    blob: response.data,
    fileName: response.headers['content-disposition'] as string | undefined,
  }
}

export type { ApiResponse }
