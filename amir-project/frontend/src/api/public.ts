import api from './client'
import { publicRead } from './publicRead'

export const publicApi = {
  portfolio: (category?: string) => publicRead('/portfolio', { params: category ? { category } : {} }),
  portfolioItem: (slug: string) => publicRead(`/portfolio/${slug}`),
  blog: (params?: Record<string, string>) => publicRead('/blog', { params }),
  blogPost: (slug: string) => publicRead(`/blog/${slug}`),
  blogCategories: () => publicRead('/blog/categories'),
  page: (slug: string) => publicRead(`/pages/${slug}`),
  settings: () => publicRead('/settings/public'),
  contact: (data: Record<string, string>) => api.post('/contact', data),
  aiChat: (message: string, chat_id?: number) => api.post('/ai/chat', { message, chat_id }),
}
