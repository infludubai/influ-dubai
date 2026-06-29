import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartAddon { id: number; name: string; price: number; billing_type: string }
interface CartPackage { id: number; name: string; slug: string; price: number; currency: string; delivery_days: number }

interface CartState {
  step: number
  package: CartPackage | null
  addons: CartAddon[]
  projectInfo: Record<string, string>
  paymentMethodId: number | null
  transactionId: string
  screenshotFile: File | null
  setStep: (s: number) => void
  setPackage: (p: CartPackage) => void
  toggleAddon: (a: CartAddon) => void
  setProjectInfo: (info: Record<string, string>) => void
  setPaymentMethod: (id: number) => void
  setTransactionId: (id: string) => void
  setScreenshot: (f: File | null) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      step: 1,
      package: null,
      addons: [],
      projectInfo: {},
      paymentMethodId: null,
      transactionId: '',
      screenshotFile: null,
      setStep: (s) => set({ step: s }),
      setPackage: (p) => set({ package: p, addons: [] }),
      toggleAddon: (a) => set((state) => ({
        addons: state.addons.find((x) => x.id === a.id)
          ? state.addons.filter((x) => x.id !== a.id)
          : [...state.addons, a],
      })),
      setProjectInfo: (info) => set({ projectInfo: info }),
      setPaymentMethod: (id) => set({ paymentMethodId: id }),
      setTransactionId: (id) => set({ transactionId: id }),
      setScreenshot: (f) => set({ screenshotFile: f }),
      clear: () => set({ step: 1, package: null, addons: [], projectInfo: {}, paymentMethodId: null, transactionId: '', screenshotFile: null }),
      total: () => {
        const s = get()
        return (s.package?.price ?? 0) + s.addons.reduce((sum, a) => sum + a.price, 0)
      },
    }),
    {
      name: 'cart-storage',
      partialize: (s) => ({ step: s.step, package: s.package, addons: s.addons, projectInfo: s.projectInfo, paymentMethodId: s.paymentMethodId, transactionId: s.transactionId }),
    }
  )
)
