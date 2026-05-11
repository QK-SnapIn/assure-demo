export type UserRole =
  | 'AGENCY_ADMIN'
  | 'PRODUCER'
  | 'CSR'
  | 'UNDERWRITER'
  | 'ADJUSTER'
  | 'POLICYHOLDER'
  | 'READ_ONLY'

export interface User {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  agency: string
  npn?: string | null
  status: string
  createdAt?: string
}

export interface Policy {
  id: string
  insured: string
  dba?: string | null
  line: string
  form: string
  state: string
  city: string
  effective?: string | null
  expiration?: string | null
  premium: string       // Decimal comes as string from Prisma
  occLimit: number
  aggLimit: number
  abuseOccLimit?: number | null
  abuseAggLimit?: number | null
  retroDate?: string | null
  headcount?: number | null
  bedCount?: number | null
  payroll?: string | null
  status: string
  agentUserId?: string | null
}

export interface Claim {
  id: string
  policyId: string
  insured: string
  dol: string
  reported: string
  cause: string
  lossType: string
  status: string
  reserve: string       // Decimal as string
  paid: string
  adjusterUserId?: string | null
  severity: string
  counsel?: string | null
}

export interface Invoice {
  id: string
  policyId: string
  insured: string
  issued: string
  due: string
  amount: string        // Decimal as string
  balance: string
  status: string
}

export interface Referral {
  id: string
  quoteId: string
  insured: string
  line: string
  state: string
  premium: string       // Decimal as string
  reason: string
  submitted: string
  agentUserId?: string | null
  priority: string
  status: string
}

export interface Commission {
  id: number
  lineGroup: string
  newBizPct: string     // Decimal as string
  renewalPct: string
}

export interface Permission {
  id: number
  feature: string
  agencyAdmin: boolean
  producer: boolean
  csr: boolean
  uw: boolean
  adjuster: boolean
  readonly: boolean
}
