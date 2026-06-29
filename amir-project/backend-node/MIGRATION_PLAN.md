# Node Backend Migration Plan

## Phase 1: Scaffold

- Create `backend-node` beside Laravel.
- Add health/status routes.
- Keep Laravel untouched.
- Do not switch React yet.

## Phase 2: Database Layer

- Choose and install DB tooling after approval.
- Recommended: Prisma or mysql2 with a small repository layer.
- Start with read-only endpoints.

## Phase 3: API Groups

Migrate in this order:

1. Public settings and public packages.
2. Auth/session compatibility.
3. Client orders, files, invoices.
4. Admin users, orders, payments, invoices.
5. Chat/SMS and notifications.
6. Builder pages/settings.

## Phase 4: Switch Frontend

- Point `VITE_API_URL` to Node only after equivalent endpoints pass tests.
- Keep Laravel available as rollback.

## Phase 5: Retire Laravel

- Only after every production feature is verified on Node.
