import { Router } from 'express'
import { prisma } from '../db/prisma'
import { requireAuth } from '../middleware/requireAuth'

export const invoicesRouter = Router()

invoicesRouter.use(requireAuth)

// GET /api/invoices — list all, optional ?policyId=&status=
invoicesRouter.get('/', async (req, res, next) => {
  try {
    const { policyId, status } = req.query as Record<string, string>
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(policyId ? { policyId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { due: 'desc' },
    })
    res.json(invoices)
  } catch (e) {
    next(e)
  }
})

// GET /api/invoices/:id
invoicesRouter.get('/:id', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } })
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }
    res.json(invoice)
  } catch (e) {
    next(e)
  }
})

// POST /api/invoices/:id/pay — mock: zero out balance, mark Paid
invoicesRouter.post('/:id/pay', async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } })
    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' })
      return
    }
    const updated = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { balance: 0, status: 'Paid' },
    })
    res.json(updated)
  } catch (e) {
    next(e)
  }
})
