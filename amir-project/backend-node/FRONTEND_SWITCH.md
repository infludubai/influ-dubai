# Safe Frontend Public API Switch

React is still using Laravel by default.

The frontend now supports an optional read-only public API override:

```env
VITE_PUBLIC_API_URL=http://localhost:8080/api
```

When this is set, these migrated GET endpoints try Node first:

- `/settings/public`
- `/packages`
- `/packages/:slug`
- `/addons`
- `/portfolio`
- `/portfolio/:slug`
- `/blog`
- `/blog/:slug`
- `/blog/categories`
- `/pages/:slug`
- `/checkout/payment-methods`

If Node fails, the request falls back to Laravel through `VITE_API_URL`.

Not switched:

- auth
- checkout/order writes
- contact form
- AI chat
- invoices
- admin APIs
- client APIs

Before enabling this on production, run:

```powershell
npm run parity
```

from `backend-node`.
