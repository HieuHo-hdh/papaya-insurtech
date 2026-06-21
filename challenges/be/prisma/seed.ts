import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import type { TenantConfig } from '../src/shared/types'

const prisma = new PrismaClient()

// Fixed IDs so downstream code can reference tenants by stable ID
const TENANT_IDS = {
  safeguard:   'tenant-safeguard',
  healthfirst: 'tenant-healthfirst',
  govhealth:   'tenant-govhealth',
}

async function seedAdminAndTenants() {
  const passwordHash = await bcrypt.hash('Admin@1234', 10)
  await prisma.user.upsert({
    where: { email: 'admin@papaya.dev' },
    update: {},
    create: { email: 'admin@papaya.dev', passwordHash },
  })

  const tenants = [
    { id: TENANT_IDS.safeguard,   name: 'SafeGuard'   },
    { id: TENANT_IDS.healthfirst, name: 'HealthFirst'  },
    { id: TENANT_IDS.govhealth,   name: 'GovHealth'    },
  ]

  for (const t of tenants) {
    await prisma.tenant.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: t,
    })
  }
}

async function seedSafeguard() {
  const config: TenantConfig = {
    branding: {
      companyName: 'SafeGuard',
      primaryColor: '#1a3c6e',
      secondaryColor: '#4a90d9',
    },
    claimTypes: {
      OUTPATIENT: { enabled: true,  requiredDocuments: ['Medical Report', 'Receipt'],                            optionalDocuments: ['Referral Letter'] },
      INPATIENT:  { enabled: true,  requiredDocuments: ['Admission Form', 'Discharge Summary', 'Receipt'],       optionalDocuments: ['Lab Results']     },
      DENTAL:     { enabled: true,  requiredDocuments: ['Dental Report', 'Receipt'],                             optionalDocuments: []                  },
      MATERNITY:  { enabled: false, requiredDocuments: [],                                                       optionalDocuments: []                  },
      OPTICAL:    { enabled: false, requiredDocuments: [],                                                       optionalDocuments: []                  },
    },
    approvalRules: {
      autoApprovalThreshold: 20000,
      approvalTiers: [
        { tier: 'assessor',  greaterThan: 20000,  smallerThan: 50000  },
        { tier: 'team_lead', greaterThan: 50000,  smallerThan: 100000 },
        { tier: 'director',  greaterThan: 100000, isPrimary: true     },
      ],
    },
    notifications: [
      { event: 'claim_submitted', channels: [{ channel: 'email' }] },
      { event: 'approved',        channels: [{ channel: 'email' }] },
      { event: 'rejected',        channels: [{ channel: 'email' }] },
      { event: 'payment_sent',    channels: [{ channel: 'email' }] },
    ],
    sla: {
      timezone: 'Asia/Ho_Chi_Minh',
      weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      holidays: [],
      perClaimType: { OUTPATIENT: 5, INPATIENT: 10, DENTAL: 5 },
      escalationContacts: ['sla@safeguard.com'],
    },
    customFields: [
      { name: 'employee_id', label: 'Employee ID', required: true, type: 'text', maxLength: 20 },
    ],
  }

  await prisma.tenantConfig.upsert({
    where:  { tenantId_version: { tenantId: TENANT_IDS.safeguard, version: 1 } },
    update: { config: config as object, isActive: true },
    create: { tenantId: TENANT_IDS.safeguard, version: 1, config: config as object, isActive: true },
  })
}

async function seedHealthfirst() {
  const config: TenantConfig = {
    branding: {
      companyName: 'HealthFirst',
      primaryColor: '#27ae60',
      secondaryColor: '#82e0aa',
    },
    claimTypes: {
      OUTPATIENT: { enabled: true, requiredDocuments: ['Medical Receipt', 'Doctor Note'],             optionalDocuments: []             },
      INPATIENT:  { enabled: true, requiredDocuments: ['Hospital Bill', 'Discharge Summary'],         optionalDocuments: ['Lab Results'] },
      DENTAL:     { enabled: true, requiredDocuments: ['Dental Receipt'],                             optionalDocuments: ['X-Ray']       },
      MATERNITY:  { enabled: true, requiredDocuments: ['Birth Certificate', 'Hospital Bill'],         optionalDocuments: ['Prenatal Records'] },
      OPTICAL:    { enabled: true, requiredDocuments: ['Optical Receipt', 'Prescription'],            optionalDocuments: []             },
    },
    approvalRules: {
      autoApprovalThreshold: 5000,
      approvalTiers: [
        { tier: 'assessor', greaterThan: 5000,  smallerThan: 50000 },
        { tier: 'manager',  greaterThan: 50000, isPrimary: true    },
      ],
    },
    notifications: [
      { event: 'claim_submitted', channels: [{ channel: 'email' }, { channel: 'sms' }] },
      { event: 'approved',        channels: [{ channel: 'email' }, { channel: 'sms' }] },
      { event: 'rejected',        channels: [{ channel: 'email' }, { channel: 'sms' }] },
      { event: 'payment_sent',    channels: [{ channel: 'email' }, { channel: 'sms' }] },
    ],
    sla: {
      timezone: 'Asia/Ho_Chi_Minh',
      weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      holidays: [],
      perClaimType: { OUTPATIENT: 7, INPATIENT: 7, DENTAL: 7, MATERNITY: 7, OPTICAL: 7 },
      escalationContacts: ['sla@healthfirst.com'],
    },
    customFields: [],
  }

  await prisma.tenantConfig.upsert({
    where:  { tenantId_version: { tenantId: TENANT_IDS.healthfirst, version: 1 } },
    update: { config: config as object, isActive: true },
    create: { tenantId: TENANT_IDS.healthfirst, version: 1, config: config as object, isActive: true },
  })
}

async function seedGovhealth() {
  const config: TenantConfig = {
    branding: {
      companyName: 'GovHealth',
      primaryColor: '#c0392b',
      secondaryColor: '#e74c3c',
    },
    claimTypes: {
      OUTPATIENT: { enabled: true,  requiredDocuments: ['Medical Report', 'Government ID', 'Receipt'],                       optionalDocuments: []          },
      INPATIENT:  { enabled: true,  requiredDocuments: ['Admission Form', 'Government ID', 'Discharge Summary', 'Receipt'],  optionalDocuments: ['Lab Results'] },
      DENTAL:     { enabled: false, requiredDocuments: [], optionalDocuments: [] },
      MATERNITY:  { enabled: false, requiredDocuments: [], optionalDocuments: [] },
      OPTICAL:    { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    },
    approvalRules: {
      autoApprovalThreshold: 0,
      approvalTiers: [
        { tier: 'committee', isPrimary: true },
      ],
    },
    notifications: [
      { event: 'claim_submitted', channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/claim-submitted' }] },
      { event: 'approved',        channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/approved'         }] },
      { event: 'rejected',        channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/rejected'         }] },
      { event: 'payment_sent',    channels: [{ channel: 'email' }, { channel: 'webhook', template: 'https://gov.webhook/payment-sent'     }] },
    ],
    sla: {
      timezone: 'Asia/Ho_Chi_Minh',
      weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      holidays: [],
      perClaimType: { OUTPATIENT: 15, INPATIENT: 15 },
      escalationContacts: ['sla@govhealth.gov.vn', 'director@govhealth.gov.vn'],
    },
    customFields: [
      { name: 'department',  label: 'Department',  required: true, type: 'text', maxLength: 100 },
      { name: 'budget_code', label: 'Budget Code', required: true, type: 'text', maxLength: 20  },
    ],
  }

  await prisma.tenantConfig.upsert({
    where:  { tenantId_version: { tenantId: TENANT_IDS.govhealth, version: 1 } },
    update: { config: config as object, isActive: true },
    create: { tenantId: TENANT_IDS.govhealth, version: 1, config: config as object, isActive: true },
  })
}

async function main() {
  console.log('Seeding...')
  await seedAdminAndTenants()
  console.log('✓ Admin user + tenant rows')
  await seedSafeguard()
  console.log('✓ SafeGuard config (v1)')
  await seedHealthfirst()
  console.log('✓ HealthFirst config (v1)')
  await seedGovhealth()
  console.log('✓ GovHealth config (v1)')
  console.log('Done.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
