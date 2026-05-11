import { Router } from 'express'
import { prisma } from '../db/prisma'
import { requireAuth, AuthRequest } from '../middleware/requireAuth'

export const usersRouter = Router()

usersRouter.use(requireAuth)

// GET /api/users — admin: list all users (omit passwordHash)
usersRouter.get('/', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        agency: true,
        npn: true,
        status: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch (e) {
    next(e)
  }
})

// GET /api/users/me — current user from JWT
usersRouter.get('/me', async (req, res, next) => {
  try {
    const userId = (req as AuthRequest).userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        agency: true,
        npn: true,
        status: true,
        createdAt: true,
      },
    })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(user)
  } catch (e) {
    next(e)
  }
})
