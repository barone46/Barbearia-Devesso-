export type UserRole = 'cliente' | 'admin';

export interface User {
  id: string;
  nome: string;
  telefone: string;
  tipo: UserRole;
  createdAt: string;
  referralCode?: string;
  referredBy?: string;
}

export type ServiceCategory = 'CORTES' | 'BARBA' | 'DESIGN' | 'SOBRANCELHA' | 'ESTÉTICA' | 'QUÍMICA';

export interface Service {
  id: string;
  nome: string;
  categoria: ServiceCategory;
  preco: number;
  ativo: boolean;
}

export type AppointmentStatus = 'pendente' | 'confirmado' | 'cancelado';

export interface Appointment {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  status: AppointmentStatus;
  createdAt: string;
}
