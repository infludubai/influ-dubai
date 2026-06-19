# System Architecture — Phase 1

Status: Draft for review
Companion to: [01-business-requirements.md](./01-business-requirements.md)

## 1. High-Level System Diagram (textual)

```
[Next.js 15 Frontend] ──REST/GraphQL(future)──▶ [NestJS API Gateway]
                                                       │
                       ┌───────────────────────────────┼───────────────────────────────┐
                       ▼                                ▼                               ▼
              [Auth Module]                    [Core Domain Modules]           [AI/Workers Module]
        (JWT, OAuth, sessions)        (Users, Profiles, Campaigns, Marketplace,   (BullMQ queues →
                                        Messaging, Analytics, Billing)             OpenAI/Anthropic,
                       │                                │                          Pinecone embeddings)
                       ▼                                ▼                               ▼
                 [PostgreSQL] ◀──cache──▶ [Redis]                              [Pinecone Vector DB]
                       │
                       ▼
              [Elasticsearch/OpenSearch] (marketplace search index)

[AWS S3] ◀── media uploads (profile images, media kits, deliverables) ── [NestJS API]
[CloudFront] ── CDN in front of S3 + static assets
[ClickHouse] (future, Phase 8+) ── analytics event store
```

Frontend deploys to **Vercel**; backend services deploy to **AWS** (ECS/Fargate or equivalent), with **RDS** for PostgreSQL and **S3 + CloudFront** for media.

## 2. Database Schema (Phase 1–4 core entities)

This is the foundational schema; later phases add tables (e.g. `fraud_scores` in Phase 10) without altering this core.

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | varchar, unique | |
| password_hash | varchar | null if OAuth-only |
| role | enum(creator, brand, agency, admin) | |
| status | enum(pending_verification, active, suspended) | |
| created_at / updated_at | timestamp | |

### profiles
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → users.id | 1:1 with users |
| display_name | varchar | |
| bio | text | |
| location_country / location_city | varchar | |
| languages | varchar[] | |
| categories | varchar[] | e.g. Beauty, Fitness |
| avatar_url / media_kit_url | varchar | S3 keys |
| rate_card | jsonb | per-platform/deliverable pricing |
| audience_size | int | aggregated follower count |
| verification_status | enum(unverified, pending, verified) | |

### social_accounts
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| profile_id | uuid FK → profiles.id | |
| platform | enum(instagram, tiktok, youtube, linkedin, x) | |
| handle | varchar | |
| follower_count | int | refreshed periodically |
| engagement_rate | numeric | |
| oauth_token | varchar, nullable | encrypted at rest |

### roles / permissions
| Table | Purpose |
|---|---|
| `roles` | id, name (creator/brand/agency/admin) |
| `permissions` | id, key (e.g. `campaign:create`), description |
| `role_permissions` | join table, role_id ↔ permission_id |

Modeled as RBAC rather than hardcoded role checks, so Agency sub-roles (Phase 4: client-manager, viewer) extend cleanly later without schema changes.

### campaigns
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| owner_id | uuid FK → users.id | brand/agency that created it |
| title | varchar | |
| type | enum(awareness, engagement, lead_generation, sales) | |
| status | enum(draft, live, paused, completed, cancelled) | |
| budget | numeric | |
| start_date / end_date | date | |
| target_audience | jsonb | demographics, geography, interests |
| brief | text | |

### campaign_creators (collaboration/offer record)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| campaign_id | uuid FK | |
| creator_id | uuid FK → profiles.id | |
| status | enum(invited, applied, negotiating, accepted, declined, in_progress, delivered, approved, paid) | |
| offer_amount | numeric | |
| deliverables | jsonb | |
| created_at / updated_at | timestamp | |

### messages
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| campaign_creator_id | uuid FK, nullable | scopes thread to a collaboration when applicable |
| sender_id / recipient_id | uuid FK → users.id | |
| body | text | |
| read_at | timestamp, nullable | |

### subscriptions / billing (Phase 12, modeled now to avoid later migration pain)
| Table | Purpose |
|---|---|
| `subscriptions` | user_id, plan (free/professional/enterprise), status, renewal_date, stripe_customer_id |
| `invoices` | subscription_id, amount, status, period |

### Indexing notes
- `profiles`: composite index on (`location_country`, `categories`) for marketplace filters; full profile documents mirrored into Elasticsearch for free-text + filtered search.
- `campaign_creators`: index on (`campaign_id`, `status`) and (`creator_id`, `status`) for dashboard queries.

## 3. API Architecture

- **Style**: REST as the primary contract for MVP (per stack decision); GraphQL deferred and optional, introduced only if a specific cross-entity query pattern justifies it (e.g. analytics aggregation).
- **Versioning**: `/api/v1/...` path-based versioning from day one.
- **Module boundaries** (NestJS modules, mirroring domain boundaries above): `auth`, `users`, `profiles`, `campaigns`, `marketplace`, `messaging`, `analytics`, `billing`, `admin`, `ai`.
- **Async work**: BullMQ queues for anything not required synchronously in the request path — social stats refresh, AI scoring jobs, email/push notifications, report generation.
- **File uploads**: client requests a pre-signed S3 URL from the API, uploads directly to S3, then confirms the object key back to the API — avoids proxying large files through the NestJS app.
- **Webhooks**: inbound from Stripe (billing events) and OAuth providers (token refresh/revocation), each with signature verification.

## 4. Permission Structure

RBAC with four base roles (Creator, Brand, Agency, Admin), enforced via a NestJS guard that checks the requesting user's role + permission set against the route's required permission key (e.g. `campaign:update:own`).

Key principles:
- **Ownership scoping**: most permissions are scoped to "own" resources (`campaign:update:own`) vs. admin-level (`campaign:update:any`), enforced at the query layer (filter by `owner_id`), not just the route guard.
- **Agency delegation** (Phase 4+): Agency accounts get a `client_access` join table (agency_user_id ↔ brand_account_id ↔ permission level) so an agency teammate can be scoped to specific clients without inheriting full Brand role.
- **Admin** bypasses ownership scoping but every bypass is written to an `audit_logs` table (Phase 14 requirement, designed for from Phase 1).

## 5. Scalability Plan

| Concern | Phase 1 approach | Scale-out path |
|---|---|---|
| Read load (marketplace search) | PostgreSQL with composite indexes | Elasticsearch/OpenSearch index, kept in sync via change-data-capture or write-through on profile update |
| Hot data (sessions, rate limits) | Redis | Redis Cluster if/when single-node throughput becomes limiting |
| Background work | BullMQ on Redis | Horizontally scale worker processes independently of API processes |
| Media | S3 + CloudFront | No change needed; scales natively |
| Analytics events | Logged into Postgres initially | Migrate high-volume event writes to ClickHouse once Phase 8 lands |
| API tier | Single NestJS service, modular monolith | Split into separate deployable services (e.g. `ai-service`, `messaging-service`) only if a module's load/deploy cadence diverges — avoid premature microservices |
| AI workloads | Queued jobs, rate-limited against OpenAI/Anthropic | Cache embeddings in Pinecone; batch where possible to control cost |

Guiding principle: stay a modular monolith through MVP; the module boundaries above are chosen so any module can be extracted into its own service later without a rewrite, but we don't pay that complexity cost until there's a measured reason to.

## 6. Open Items for Sign-off

- [ ] Confirm REST-only for MVP (no GraphQL) — re-confirm before Phase 5/6 if marketplace query complexity grows.
- [ ] Confirm take-rate vs. subscription-only revenue model (affects `invoices`/`subscriptions` schema).
- [ ] Confirm OAuth scope requirements per platform (Instagram/TikTok/YouTube APIs have different approval processes — may affect Phase 3 timeline).
