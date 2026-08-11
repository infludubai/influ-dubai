import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';
import { SettingsService } from '../settings/settings.service';

/** Higher number = more authority. Used for "at least this role" checks. */
const ROLE_RANK: Record<WorkspaceRole, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

/** Seats included per plan; -1 means unlimited. Owner counts as a seat. */
const PLAN_SEATS: Record<string, number> = {
  FREE: 1,
  PROFESSIONAL: 5,
  ENTERPRISE: -1,
};

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Prisma `where` fragment matching every brand account a user may act on:
   * the ones they own, plus the ones they've been added to as an active member.
   *
   * Every brand-scoped query in the app composes this instead of comparing
   * `userId` directly — that's what makes team access work uniformly rather
   * than being re-derived (and mis-derived) per feature.
   */
  static accessFilter(userId: string): Prisma.BrandProfileWhereInput {
    return {
      OR: [
        { userId },
        { members: { some: { userId, status: 'ACTIVE' } } },
      ],
    };
  }

  /** The brand account the user is currently acting as. */
  async resolveActive(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { activeBrandProfileId: true },
    });

    if (user?.activeBrandProfileId) {
      const active = await this.prisma.brandProfile.findFirst({
        where: {
          id: user.activeBrandProfileId,
          ...WorkspacesService.accessFilter(userId),
        },
      });
      // Falls through if access was revoked since it was selected.
      if (active) return active;
    }

    return this.prisma.brandProfile.findFirst({
      where: WorkspacesService.accessFilter(userId),
      orderBy: { createdAt: 'asc' },
    });
  }

  async requireActive(userId: string) {
    const active = await this.resolveActive(userId);
    if (!active) throw new ForbiddenException('Brand profile required');
    return active;
  }

  async assertAccess(
    userId: string,
    brandProfileId: string,
    minRole: WorkspaceRole = 'VIEWER',
  ) {
    const brand = await this.prisma.brandProfile.findUnique({
      where: { id: brandProfileId },
      include: { members: { where: { userId } } },
    });
    if (!brand) throw new NotFoundException('Workspace not found');

    const role: WorkspaceRole =
      brand.userId === userId ? 'OWNER' : (brand.members[0]?.status === 'ACTIVE'
        ? brand.members[0].role
        : (null as never));

    if (!role) throw new ForbiddenException('You do not have access to this workspace');
    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
      throw new ForbiddenException(
        `This action requires the ${minRole.toLowerCase()} role or higher.`,
      );
    }
    return { brand, role };
  }

  // ── Workspaces ────────────────────────────────────────────────────────────

  async listMine(userId: string) {
    const [owned, memberships, user] = await Promise.all([
      this.prisma.brandProfile.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.workspaceMember.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { brandProfile: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { activeBrandProfileId: true },
      }),
    ]);

    const active = await this.resolveActive(userId);

    return {
      activeId: active?.id ?? user?.activeBrandProfileId ?? null,
      workspaces: [
        ...owned.map((b) => ({
          id: b.id,
          companyName: b.companyName,
          logoUrl: b.logoUrl,
          role: 'OWNER' as WorkspaceRole,
        })),
        ...memberships.map((m) => ({
          id: m.brandProfile.id,
          companyName: m.brandProfile.companyName,
          logoUrl: m.brandProfile.logoUrl,
          role: m.role,
        })),
      ],
    };
  }

  /** Agencies create one workspace per client. */
  async create(userId: string, companyName: string, industry?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.role.name !== 'AGENCY') {
      const owned = await this.prisma.brandProfile.count({ where: { userId } });
      if (owned >= 1) {
        throw new BadRequestException(
          'Only agency accounts can manage multiple client workspaces. Switch your account type to Agency to add clients.',
        );
      }
    }

    const brand = await this.prisma.brandProfile.create({
      data: { userId, companyName, industry },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeBrandProfileId: brand.id },
    });

    return brand;
  }

  async switchActive(userId: string, brandProfileId: string) {
    await this.assertAccess(userId, brandProfileId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { activeBrandProfileId: brandProfileId },
    });
    return { activeId: brandProfileId };
  }

  // ── Members ───────────────────────────────────────────────────────────────

  async listMembers(userId: string, brandProfileId: string) {
    const { brand } = await this.assertAccess(userId, brandProfileId);

    const [owner, members] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: brand.userId },
        select: { id: true, email: true, profile: { select: { displayName: true } } },
      }),
      this.prisma.workspaceMember.findMany({
        where: { brandProfileId, status: { not: 'REVOKED' } },
        include: {
          user: {
            select: { id: true, email: true, profile: { select: { displayName: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const seatLimit = await this.seatLimit(brand.userId);
    const used = 1 + members.filter((m) => m.status !== 'REVOKED').length;

    return {
      owner: {
        userId: owner?.id,
        email: owner?.email,
        displayName: owner?.profile?.displayName ?? null,
        role: 'OWNER' as WorkspaceRole,
        status: 'ACTIVE',
      },
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user?.email ?? m.invitedEmail,
        displayName: m.user?.profile?.displayName ?? null,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
      })),
      seats: { used, limit: seatLimit },
    };
  }

  private async seatLimit(ownerUserId: string): Promise<number> {
    const sub = await this.prisma.subscription.findUnique({
      where: { userId: ownerUserId },
      select: { plan: true, status: true },
    });
    const plan = sub?.status === 'ACTIVE' ? sub.plan : 'FREE';
    return PLAN_SEATS[plan] ?? 1;
  }

  async invite(
    userId: string,
    brandProfileId: string,
    email: string,
    role: WorkspaceRole,
  ) {
    const { brand } = await this.assertAccess(userId, brandProfileId, 'ADMIN');

    if (role === 'OWNER') {
      throw new BadRequestException('A workspace can only have one owner.');
    }

    const normalised = email.trim().toLowerCase();

    const ownerEmail = await this.prisma.user.findUnique({
      where: { id: brand.userId },
      select: { email: true },
    });
    if (ownerEmail?.email.toLowerCase() === normalised) {
      throw new BadRequestException('That person already owns this workspace.');
    }

    const limit = await this.seatLimit(brand.userId);
    if (limit !== -1) {
      const used =
        1 +
        (await this.prisma.workspaceMember.count({
          where: { brandProfileId, status: { not: 'REVOKED' } },
        }));
      if (used >= limit) {
        throw new BadRequestException(
          `Your plan includes ${limit} seat${limit === 1 ? '' : 's'}. Upgrade to invite more team members.`,
        );
      }
    }

    // Link immediately if they already have an account, so access works on
    // their next request rather than needing a separate accept step.
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalised },
      select: { id: true },
    });

    const member = await this.prisma.workspaceMember.upsert({
      where: { brandProfileId_invitedEmail: { brandProfileId, invitedEmail: normalised } },
      create: {
        brandProfileId,
        invitedEmail: normalised,
        userId: existingUser?.id,
        role,
        status: existingUser ? 'ACTIVE' : 'INVITED',
        invitedById: userId,
        acceptedAt: existingUser ? new Date() : null,
      },
      update: {
        role,
        status: existingUser ? 'ACTIVE' : 'INVITED',
        userId: existingUser?.id,
      },
    });

    if (existingUser) {
      await this.notifications.create(existingUser.id, {
        type: 'WORKSPACE',
        title: `You were added to ${brand.companyName}`,
        body: `You now have ${role.toLowerCase()} access to this workspace.`,
        link: '/dashboard/brand/team',
      });
    } else {
      const base = this.settings.get('FRONTEND_URL') ?? 'https://www.infludubai.com';
      await this.mail.sendVerificationEmail(
        normalised,
        `${base}/register?email=${encodeURIComponent(normalised)}&role=BRAND`,
      );
    }

    return member;
  }

  async updateRole(
    userId: string,
    brandProfileId: string,
    memberId: string,
    role: WorkspaceRole,
  ) {
    await this.assertAccess(userId, brandProfileId, 'ADMIN');
    if (role === 'OWNER') {
      throw new BadRequestException('Ownership cannot be reassigned here.');
    }
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, brandProfileId },
    });
    if (!member) throw new NotFoundException('Member not found');

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  async removeMember(userId: string, brandProfileId: string, memberId: string) {
    await this.assertAccess(userId, brandProfileId, 'ADMIN');
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, brandProfileId },
    });
    if (!member) throw new NotFoundException('Member not found');

    // Revoked rather than deleted so the audit trail survives, and so an
    // ACTIVE-only access filter immediately stops granting access.
    await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { status: 'REVOKED', userId: null },
    });

    // Anyone acting as this workspace must fall back to one they still hold.
    if (member.userId) {
      await this.prisma.user.updateMany({
        where: { id: member.userId, activeBrandProfileId: brandProfileId },
        data: { activeBrandProfileId: null },
      });
    }

    return { removed: true };
  }

  /**
   * Claims any invitations addressed to this email. Called after signup so a
   * person invited before they had an account lands straight in the workspace.
   */
  async claimInvitations(userId: string, email: string) {
    const pending = await this.prisma.workspaceMember.findMany({
      where: { invitedEmail: email.toLowerCase(), status: 'INVITED', userId: null },
    });
    if (pending.length === 0) return 0;

    await this.prisma.workspaceMember.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: { userId, status: 'ACTIVE', acceptedAt: new Date() },
    });
    return pending.length;
  }
}
