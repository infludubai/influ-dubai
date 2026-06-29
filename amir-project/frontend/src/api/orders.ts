import api from './client'

export const ordersApi = {
  list: (page = 1) => api.get(`/client/orders?page=${page}`),
  get: (id: number) => api.get(`/client/orders/${id}`),
  files: (id: number) => api.get(`/client/orders/${id}/files`),
  uploadFile: (id: number, file: File, type: string) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    return api.post(`/client/orders/${id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}

export const checkoutApi = {
  place: (data: Record<string, unknown>) => api.post('/checkout/place', data),
  uploadScreenshot: (order_id: number, file: File) => {
    const fd = new FormData()
    fd.append('order_id', String(order_id))
    fd.append('screenshot', file)
    return api.post('/checkout/upload-screenshot', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
}
