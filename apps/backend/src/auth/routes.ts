import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../db/prisma'
import { env } from '../config/env'

export const authRouter = Router()

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }
    if (user.status === 'Locked') {
      res.status(403).json({ error: 'Account is locked' })
      return
    }
    const token = jwt.sign({ sub: user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    } as jwt.SignOptions)
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        agency: user.agency,
        npn: user.npn,
        status: user.status,
      },
    })
  } catch (e) {
    next(e)
  }
})
