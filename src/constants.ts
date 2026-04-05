import { Service } from './types';

export const INITIAL_SERVICES: Omit<Service, 'id' | 'ativo'>[] = [
  // CORTES
  { nome: 'Corte Social', categoria: 'CORTES', preco: 30 },
  { nome: 'Degradê', categoria: 'CORTES', preco: 40 },
  { nome: 'Americano', categoria: 'CORTES', preco: 35 },
  { nome: 'Militar', categoria: 'CORTES', preco: 25 },
  { nome: 'Tesoura', categoria: 'CORTES', preco: 45 },
  { nome: 'Máquina', categoria: 'CORTES', preco: 20 },
  { nome: 'Corte Surfista', categoria: 'CORTES', preco: 40 },
  { nome: 'Corte Texturizado', categoria: 'CORTES', preco: 45 },
  { nome: 'Corte Moderno', categoria: 'CORTES', preco: 40 },
  { nome: 'Corte Acionado', categoria: 'CORTES', preco: 35 },
  { nome: 'Fio a Fio', categoria: 'CORTES', preco: 50 },
  { nome: 'Sociazinho', categoria: 'CORTES', preco: 30 },
  { nome: 'Cachorro de Madame', categoria: 'CORTES', preco: 50 },
  { nome: 'Corte com Desenho', categoria: 'CORTES', preco: 50 },
  { nome: 'Corte com Freestyle', categoria: 'CORTES', preco: 60 },
  // BARBA
  { nome: 'Barba completa', categoria: 'BARBA', preco: 30 },
  { nome: 'Barba desenhada', categoria: 'BARBA', preco: 25 },
  { nome: 'Barba com máquina', categoria: 'BARBA', preco: 20 },
  { nome: 'Terapia de barba', categoria: 'BARBA', preco: 40 },
  { nome: 'Alinhamento', categoria: 'BARBA', preco: 15 },
  { nome: 'Hidratação', categoria: 'BARBA', preco: 20 },
  // DESIGN
  { nome: 'Desenho de barba', categoria: 'DESIGN', preco: 15 },
  { nome: 'Hair design', categoria: 'DESIGN', preco: 20 },
  { nome: 'Acabamento com navalha', categoria: 'DESIGN', preco: 10 },
  // SOBRANCELHA
  { nome: 'Designer de sobrancelha', categoria: 'SOBRANCELHA', preco: 20 },
  { nome: 'Limpeza', categoria: 'SOBRANCELHA', preco: 15 },
  { nome: 'Design masculino', categoria: 'SOBRANCELHA', preco: 20 },
  // ESTÉTICA
  { nome: 'Pigmentação', categoria: 'ESTÉTICA', preco: 30 },
  { nome: 'Camuflagem', categoria: 'ESTÉTICA', preco: 40 },
  { nome: 'Coloração', categoria: 'ESTÉTICA', preco: 35 },
  // QUÍMICA
  { nome: 'Progressiva', categoria: 'QUÍMICA', preco: 80 },
  { nome: 'Alisamento', categoria: 'QUÍMICA', preco: 60 },
  { nome: 'Relaxamento', categoria: 'QUÍMICA', preco: 50 },
  { nome: 'Botox capilar', categoria: 'QUÍMICA', preco: 70 },
];

export const BUSINESS_HOURS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];
