import { Router } from 'express'
import { prisma } from '../db/prisma'
import { requireAuth } from '../middleware/requireAuth'

export const claimsRouter = Router()

claimsRouter.use(requireAuth)

// GET /api/claims — list all, optional ?policyId=&status=
claimsRouter.get('/', async (req, res, next) => {
  try {
    const { policyId, status } = req.query as Record<string, string>
    const claims = await prisma.claim.findMany({
      where: {
        ...(policyId ? { policyId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { reported: 'desc' },
    })
    res.json(claims)
  } catch (e) {
    next(e)
  }
})

// GET /api/claims/:id
claimsRouter.get('/:id', async (req, res, next) => {
  try {
    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } })
    if (!claim) {
      res.status(404).json({ error: 'Claim not found' })
      return
    }
    res.json(claim)
  } catch (e) {
    next(e)
  }
})
