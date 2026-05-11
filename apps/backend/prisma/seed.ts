import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SeedData } from './seedData'

const prisma = new PrismaClient()

async function hashPw(pw: string) {
  return bcrypt.hash(pw, 10)
}

async function main() {
  const DEMO_PW = await hashPw('Demo123!')

  // ── Users ──────────────────────────────────────────────────────────────
  const mwalters = await prisma.user.upsert({
    where: { username: 'mwalters' },
    update: {},
    create: {
      username: 'mwalters',
      email: 'mwalters@waltersrisk.com',
      name: 'Megan Walters',
      passwordHash: DEMO_PW,
      role: UserRole.AGENCY_ADMIN,
      agency: 'Walters Risk Advisors',
      npn: '17823901',
      status: 'Active',
    },
  })

  const dchen = await prisma.user.upsert({
    where: { username: 'dchen' },
    update: {},
    create: {
      username: 'dchen',
      email: 'dchen@pmuw-demo.com',
      name: 'David Chen',
      passwordHash: DEMO_PW,
      role: UserRole.UNDERWRITER,
      agency: 'Internal',
      status: 'Active',
    },
  })

  const lpark = await prisma.user.upsert({
    where: { username: 'lpark' },
    update: {},
    create: {
      username: 'lpark',
      email: 'lpark@pmuw-demo.com',
      name: 'Linda Park',
      passwordHash: DEMO_PW,
      role: UserRole.ADJUSTER,
      agency: 'Internal',
      status: 'Active',
    },
  })

  await prisma.user.upsert({
    where: { username: 'riverside' },
    update: {},
    create: {
      username: 'riverside',
      email: 'riverside@pmuw-demo.com',
      name: 'Riverside Community Pharmacy',
      passwordHash: DEMO_PW,
      role: UserRole.POLICYHOLDER,
      agency: '',
      status: 'Active',
    },
  })

  // SeedData.users extras
  await prisma.user.upsert({
    where: { username: 'treyes' },
    update: {},
    create: {
      username: 'treyes',
      email: 'treyes@waltersrisk.com',
      name: 'Tom Reyes',
      passwordHash: DEMO_PW,
      role: UserRole.PRODUCER,
      agency: 'Walters Risk Advisors',
      npn: '20114455',
      status: 'Active',
    },
  })

  await prisma.user.upsert({
    where: { username: 'sklein' },
    update: {},
    create: {
      username: 'sklein',
      email: 'sklein@waltersrisk.com',
      name: 'Sara Klein',
      passwordHash: DEMO_PW,
      role: UserRole.CSR,
      agency: 'Walters Risk Advisors',
      status: 'Active',
    },
  })

  await prisma.user.upsert({
    where: { username: 'bholt' },
    update: {},
    create: {
      username: 'bholt',
      email: 'bholt@waltersrisk.com',
      name: 'Brian Holt',
      passwordHash: DEMO_PW,
      role: UserRole.PRODUCER,
      agency: 'Walters Risk Advisors',
      npn: '19887701',
      status: 'Locked',
    },
  })

  await prisma.user.upsert({
    where: { username: 'klopez' },
    update: {},
    create: {
      username: 'klopez',
      email: 'klopez@waltersrisk.com',
      name: 'Karen Lopez',
      passwordHash: DEMO_PW,
      role: UserRole.READ_ONLY,
      agency: 'Walters Risk Advisors',
      status: 'Inactive',
    },
  })

  console.log('✓ Users seeded')

  // ── Policies ────────────────────────────────────────────────────────────
  for (const p of SeedData.policies) {
    await prisma.policy.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        insured: p.insured,
        dba: 'dba' in p ? p.dba : null,
        line: p.line,
        form: p.form,
        state: p.state,
        city: p.city,
        effective: p.effective ? new Date(p.effective) : null,
        expiration: p.expiration ? new Date(p.expiration) : null,
        premium: p.premium,
        occLimit: p.limits.occ,
        aggLimit: p.limits.agg,
        abuseOccLimit: 'abuseOcc' in p.limits ? (p.limits as { occ: number; agg: number; abuseOcc?: number }).abuseOcc ?? null : null,
        abuseAggLimit: 'abuseAgg' in p.limits ? (p.limits as { occ: number; agg: number; abuseAgg?: number }).abuseAgg ?? null : null,
        retroDate: p.retroDate ? new Date(p.retroDate) : null,
        headcount: 'headcount' in p ? (p as { headcount?: number }).headcount ?? null : null,
        bedCount: 'bedCount' in p ? (p as { bedCount?: number }).bedCount ?? null : null,
        payroll: p.payroll,
        status: p.status,
        agentUserId: p.agent === 'mwalters' ? mwalters.id : null,
      },
    })
  }

  console.log('✓ Policies seeded')

  // ── Claims ──────────────────────────────────────────────────────────────
  for (const c of SeedData.claims) {
    await prisma.claim.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        policyId: c.policyId,
        insured: c.insured,
        dol: new Date(c.dol),
        reported: new Date(c.reported),
        cause: c.cause,
        lossType: c.lossType,
        status: c.status,
        reserve: c.reserve,
        paid: c.paid,
        adjusterUserId: c.adjuster === 'lpark' ? lpark.id : null,
        severity: c.severity,
        counsel: c.counsel,
      },
    })
  }

  console.log('✓ Claims seeded')

  // ── Invoices ─────────────────────────────────────────────────────────────
  for (const inv of SeedData.invoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        id: inv.id,
        policyId: inv.policyId,
        insured: inv.insured,
        issued: new Date(inv.issued),
        due: new Date(inv.due),
        amount: inv.amount,
        balance: inv.balance,
        status: inv.status,
      },
    })
  }

  console.log('✓ Invoices seeded')

  // ── Referrals ────────────────────────────────────────────────────────────
  for (const r of SeedData.referrals) {
    await prisma.referral.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        quoteId: r.quoteId,
        insured: r.insured,
        line: r.line,
        state: r.state,
        premium: r.premium,
        reason: r.reason,
        submitted: new Date(r.submitted),
        agentUserId: r.agent === 'mwalters' ? mwalters.id : null,
        priority: r.priority,
        status: 'Pending',
      },
    })
  }

  console.log('✓ Referrals seeded')

  // ── Commissions ──────────────────────────────────────────────────────────
  for (const comm of SeedData.commissions) {
    await prisma.commission.upsert({
      where: { lineGroup: comm.lineGroup },
      update: {},
      create: {
        lineGroup: comm.lineGroup,
        newBizPct: comm.newBiz,
        renewalPct: comm.renewal,
      },
    })
  }

  console.log('✓ Commissions seeded')

  // ── Permissions ──────────────────────────────────────────────────────────
  for (const perm of SeedData.permissions) {
    const existing = await prisma.permission.findFirst({ where: { feature: perm.feature } })
    if (!existing) {
      await prisma.permission.create({
        data: {
          feature: perm.feature,
          agencyAdmin: perm.agencyAdmin,
          producer: perm.producer,
          csr: perm.csr,
          uw: perm.uw,
          adjuster: perm.adjuster,
          readonly: perm.readonly,
        },
      })
    }
  }

  console.log('✓ Permissions seeded')

  console.log('\n✅ Seed complete. Demo credentials: any username above / Demo123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
