-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('AGENCY_ADMIN', 'PRODUCER', 'CSR', 'UNDERWRITER', 'ADJUSTER', 'POLICYHOLDER', 'READ_ONLY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "agency" TEXT NOT NULL DEFAULT '',
    "npn" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "insured" TEXT NOT NULL,
    "dba" TEXT,
    "line" TEXT NOT NULL,
    "form" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "effective" TIMESTAMP(3),
    "expiration" TIMESTAMP(3),
    "premium" DECIMAL(12,2) NOT NULL,
    "occ_limit" INTEGER NOT NULL,
    "agg_limit" INTEGER NOT NULL,
    "abuse_occ_limit" INTEGER,
    "abuse_agg_limit" INTEGER,
    "retro_date" TIMESTAMP(3),
    "headcount" INTEGER,
    "bed_count" INTEGER,
    "payroll" DECIMAL(14,2),
    "status" TEXT NOT NULL,
    "agent_user_id" TEXT,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "insured" TEXT NOT NULL,
    "dol" TIMESTAMP(3) NOT NULL,
    "reported" TIMESTAMP(3) NOT NULL,
    "cause" TEXT NOT NULL,
    "loss_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reserve" DECIMAL(12,2) NOT NULL,
    "paid" DECIMAL(12,2) NOT NULL,
    "adjuster_user_id" TEXT,
    "severity" TEXT NOT NULL,
    "counsel" TEXT,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "insured" TEXT NOT NULL,
    "issued" TIMESTAMP(3) NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "insured" TEXT NOT NULL,
    "line" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "premium" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "submitted" TIMESTAMP(3) NOT NULL,
    "agent_user_id" TEXT,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "line_group" TEXT NOT NULL,
    "new_biz_pct" DECIMAL(5,2) NOT NULL,
    "renewal_pct" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "feature" TEXT NOT NULL,
    "agency_admin" BOOLEAN NOT NULL,
    "producer" BOOLEAN NOT NULL,
    "csr" BOOLEAN NOT NULL,
    "uw" BOOLEAN NOT NULL,
    "adjuster" BOOLEAN NOT NULL,
    "readonly" BOOLEAN NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "commissions_line_group_key" ON "commissions"("line_group");

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_agent_user_id_fkey" FOREIGN KEY ("agent_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_adjuster_user_id_fkey" FOREIGN KEY ("adjuster_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_agent_user_id_fkey" FOREIGN KEY ("agent_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
