import request from 'supertest'
import app from '@/app'

export const api = request(app)

export const ADMIN = { email: 'admin@papaya.dev', password: 'Admin@1234' }

export const TENANT_IDS = {
  safeguard: 'tenant-safeguard',
  healthfirst: 'tenant-healthfirst',
  govhealth: 'tenant-govhealth',
}

export async function getToken(): Promise<string> {
  const res = await api.post('/api/auth/login').send(ADMIN)
  return res.body.data.token
}

export const VALID_CONFIG = {
  branding: {
    companyName: 'Test Corp',
    primaryColor: '#123456',
    secondaryColor: '#654321',
  },
  claimTypes: {
    OUTPATIENT: { enabled: true, requiredDocuments: ['Receipt'], optionalDocuments: [] },
    INPATIENT: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    DENTAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    MATERNITY: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
    OPTICAL: { enabled: false, requiredDocuments: [], optionalDocuments: [] },
  },
  approvalRules: {
    autoApprovalThreshold: 1000,
    approvalTiers: [{ tier: 'manager', isPrimary: true }],
  },
  notifications: [{ event: 'claim_submitted', channels: [{ channel: 'email' }] }],
  sla: {
    timezone: 'Asia/Ho_Chi_Minh',
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    holidays: [],
    perClaimType: { OUTPATIENT: 5 },
    escalationContacts: [],
  },
  customFields: [],
} as const
