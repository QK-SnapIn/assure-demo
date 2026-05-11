import { Router } from 'express'
import { prisma } from '../db/prisma'
import { requireAuth } from '../middleware/requireAuth'

export const lookupsRouter = Router()

lookupsRouter.use(requireAuth)

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']

const LINES = [
  'Pharmacist Professional Liability',
  'Pharmacy Technician Professional Liability',
  'Pharmacy Owner — VISTA Package',
  'Dentist Professional Liability',
  'Dental Practice Professional Liability',
  'Dental Hygienist Professional Liability',
  'Veterinary Practice Professional Liability',
  'Veterinarian Individual PL',
  'Home Health Care & Hospice',
  'Home Medical Equipment',
  'Senior Living / SNF',
  "Workers' Compensation",
  'Commercial Auto',
  'Commercial Umbrella',
]

const LOSS_TYPES = [
  'Medication Dispensing Error',
  'Wrong Dosage / Strength',
  'Adverse Drug Reaction',
  'Wrong-Site / Wrong-Tooth Procedure',
  'Anesthesia Complication',
  'Animal Bite — Third-Party',
  'Surgical / Procedural Error',
  'HIPAA / PHI Data Breach',
  'Abuse / Molestation Allegation',
  'Resident Fall (Witnessed)',
  'Resident Fall (Unwitnessed)',
  'Elopement (Senior Living)',
  'Slip & Fall — Visitor / Premises',
]

const ENDORSEMENT_REASONS = [
  'Increase Per-Occurrence Limit',
  'Increase Aggregate Limit',
  'Add Scheduled Employee (W-2)',
  'Add Scheduled Contractor (1099)',
  'Change Retroactive Date',
  'Add Cyber Liability Endorsement',
  'Add Sexual Misconduct (Senior Living) Sublimit',
  'Add Location / Practice Site',
  'Change Insured Name (DBA)',
  'Add Additional Insured',
]

lookupsRouter.get('/states', (_req, res) => res.json(STATES))
lookupsRouter.get('/lines', (_req, res) => res.json(LINES))
lookupsRouter.get('/loss-types', (_req, res) => res.json(LOSS_TYPES))
lookupsRouter.get('/endorsement-reasons', (_req, res) => res.json(ENDORSEMENT_REASONS))

lookupsRouter.get('/commissions', async (_req, res, next) => {
  try {
    const commissions = await prisma.commission.findMany({ orderBy: { lineGroup: 'asc' } })
    res.json(commissions)
  } catch (e) {
    next(e)
  }
})

lookupsRouter.get('/permissions', async (_req, res, next) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: { id: 'asc' } })
    res.json(permissions)
  } catch (e) {
    next(e)
  }
})
