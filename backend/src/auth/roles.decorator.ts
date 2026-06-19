import { SetMetadata } from '@nestjs/common';
import { RoleName } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Route-level role gate, e.g. `@Roles('ADMIN')`.
 * Pairs with RolesGuard. For per-resource (`:own` vs `:any`) checks,
 * filter by owner_id in the query itself — see docs/02-architecture.md §4.
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
