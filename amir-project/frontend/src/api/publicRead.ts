import axios, { type AxiosRequestConfig } from 'axios'
import api from './client'

const publicBaseUrl = (import.meta.env.VITE_PUBLIC_API_URL as string | undefined)?.replace(/\/+$/, '')

const publicNodeApi = publicBaseUrl
  ? axios.create({
      baseURL: publicBaseUrl,
      withCredentials: false,
      headers: { Accept: 'application/json' },
      timeout: 5000,
    })
  : null

export function publicRead(path: string, config?: AxiosRequestConfig) {
  if (!publicNodeApi) return api.get(path, config)

  return publicNodeApi.get(path, config).catch((error) => {
    console.warn(`[public-api] Node failed for ${path}; falling back to Laravel.`, error)
    return api.get(path, config)
  })
}
