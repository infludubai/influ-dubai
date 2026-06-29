import api from './client'
import { publicRead } from './publicRead'

export const packagesApi = {
  list: () => publicRead('/packages'),
  get: (slug: string) => publicRead(`/packages/${slug}`),
  addons: () => publicRead('/addons'),
  paymentMethods: () => publicRead('/checkout/payment-methods'),
}
