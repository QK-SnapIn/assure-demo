import { Router } from 'express'
import { prisma } from '../db/prisma'
import { requireAuth } from '../middleware/requireAuth'

export const referralsRouter = Router()

referralsRouter.use(requireAuth)

// GET /api/referrals — list all, optional ?priority=&status=
referralsRouter.get('/', async (req, res, next) => {
  try {
    const { priority, status } = req.query as Record<string, string>
    const referrals = await prisma.referral.findMany({
      where: {
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { submitted: 'desc' },
    })
    res.json(referrals)
  } catch (e) {
    next(e)
  }
})

// GET /api/referrals/:id
referralsRouter.get('/:id', async (req, res, next) => {
  try {
    const referral = await prisma.referral.findUnique({ where: { id: req.params.id } })
    if (!referral) {
      res.status(404).json({ error: 'Referral not found' })
      return
    }
    res.json(referral)
  } catch (e) {
    next(e)
  }
})

// POST /api/referrals/:id/approve
referralsRouter.post('/:id/approve', async (req, res, next) => {
  try {
    const referral = await prisma.referral.findUnique({ where: { id: req.params.id } })
    if (!referral) {
      res.status(404).json({ error: 'Referral not found' })
      return
    }
    const updated = await prisma.referral.update({
      where: { id: req.params.id },
      data: { status: 'Approved' },
    })
    res.json(updated)
  } catch (e) {
    next(e)
  }
})

// POST /api/referrals/:id/decline
referralsRouter.post('/:id/decline', async (req, res, next) => {
  try {
    const referral = await prisma.referral.findUnique({ where: { id: req.params.id } })
    if (!referral) {
      res.status(404).json({ error: 'Referral not found' })
      return
    }
    const updated = await prisma.referral.update({
      where: { id: req.params.id },
      data: { status: 'Declined' },
    })
    res.json(updated)
  } catch (e) {
    next(e)
  }
})
