
export enum PlanType {
  MENSAL = 'Mensal',
  TESTE = 'Teste',
  VITALICIO = 'Vitalício'
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  commissionRate: number;
  description: string;
}

export type UserStatus = 'active' | 'pending' | 'blocked' | 'trial';

export interface Reseller {
  id: string;
  name: string;
  email: string;
  password?: string;
  whatsapp?: string;
  planId?: string;
  plan: string; // Pode ser o nome do plano ou string livre
  commissionRate?: number;
  expiryDate: string;
  isActive: boolean;
  status: UserStatus;
  clientsCount: number;
  balance: number;
  usageDays?: number;
  pixKey?: string;
  parentId?: string;
  paymentConfig?: {
    pixKey?: string;
    pixQrCode?: string;
    paymentLink?: string;
  };
  paymentLinks?: {
    monthly: string;
    semiAnnual: string;
    annual: string;
  };
}

export interface OrganStatus {
  serasa: boolean;
  boaVista: boolean;
  spc: boolean;
  cenprotNacional: boolean;
  cenprotSP: boolean;
}

export interface CreditList {
  id: string;
  resellerId: string;
  clientDocument?: string;
  clientName?: string;
  startDate: string;
  manualConclusion: boolean;
  organs: OrganStatus;
  status: 'processing' | 'completed';
}

export interface Transaction {
  id: string;
  resellerId: string;
  resellerName?: string;
  type: 'deposit' | 'debit' | 'plan_payment';
  amount: number;
  description: string;
  date: string;
  status: 'pending' | 'completed';
  details?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  document?: string;
  whatsapp?: string;
  role: 'admin' | 'reseller' | 'client';
  status: UserStatus;
  resellerId?: string;
  parentId?: string;
  planId?: string;
  pixKey?: string;
  balance?: number;
  plan?: string;
  expiryDate?: string;
}

export interface ServiceCard {
  id: string;
  resellerId?: string; // Se vazio, é global (master)
  title: string;
  description: string;
  price: number;
  icon: string;
  isActive: boolean;
}

export interface CreativeMaterial {
  id: string;
  name: string;
  category: string;
  type: 'image' | 'pdf' | 'video';
  url: string;
  thumbnail?: string;
  createdAt: string;
}

export interface CommissionPayout {
  id: string;
  resellerId: string;
  amount: number;
  period: string;
  paidAt: string;
  receiptBase64?: string;
  status: string;
}
