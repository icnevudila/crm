export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  companyId?: string
  Company?: {
    id: string
    name: string
  }
}

export interface User {
  id: string
  name: string
  email?: string
  role?: string
}

export interface Ticket {
  id: string
  subject: string
  description?: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  tags?: string[]
  customerId?: string
  assignedTo?: string
  Customer?: Customer
  User?: User
  createdAt: string
  updatedAt?: string
  activities?: any[]
}

export interface Invoice {
  id: string
  title: string
  status: 'DRAFT' | 'SENT' | 'SHIPPED' | 'RECEIVED' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  totalAmount?: number
  quoteId?: string
  companyId?: string
  Company?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt?: string
}
