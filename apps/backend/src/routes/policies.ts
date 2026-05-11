import { Router } from 'express'
import { prisma } from '../db/prisma'
import { requireAuth } from '../middleware/requireAuth'

export const policiesRouter = Router()

policiesRouter.use(requireAuth)

// GET /api/policies — list all, optional ?line=&state=&status=
policiesRouter.get('/', async (req, res, next) => {
  try {
    const { line, state, status } = req.query as Record<string, string>
    const policies = await prisma.policy.findMany({
      where: {
        ...(line ? { line: { contains: line, mode: 'insensitive' } } : {}),
        ...(state ? { state } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { effective: 'desc' },
    })
    res.json(policies)
  } catch (e) {
    next(e)
  }
})

// GET /api/policies/:id
policiesRouter.get('/:id', async (req, res, next) => {
  try {
    const policy = await prisma.policy.findUnique({ where: { id: req.params.id } })
    if (!policy) {
      res.status(404).json({ error: 'Policy not found' })
      return
    }
    res.json(policy)
  } catch (e) {
    next(e)
  }
})
