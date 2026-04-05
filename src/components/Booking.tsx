import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { Service, Appointment, User, ServiceCategory } from '../types';
import { INITIAL_SERVICES, BUSINESS_HOURS } from '../constants';
import { format, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Calendar as CalendarIcon, Clock, Scissors, Phone, User as UserIcon, Send } from 'lucide-react';
import { motion } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface BookingProps {
  user: User | null;
  onLogin: () => void;
}

export default function Booking({ user, onLogin }: BookingProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>('CORTES');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const categories: ServiceCategory[] = ['CORTES', 'BARBA', 'DESIGN', 'SOBRANCELHA', 'ESTÉTICA', 'QUÍMICA'];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'services'));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'services');
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchBookedTimes = async () => {
      if (!user) {
        setBookedTimes([]);
        return;
      }
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const path = 'appointments';
      try {
        const q = query(
          collection(db, path),
          where('data', '==', dateStr),
          where('status', '!=', 'cancelado')
        );
        const snapshot = await getDocs(q);
        const times = snapshot.docs.map(doc => (doc.data() as Appointment).hora);
        setBookedTimes(times);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path, user.id);
      }
    };

    fetchBookedTimes();
  }, [selectedDate, user]);

  const handleBooking = async () => {
    if (!user && (!name || !phone)) return;
    if (!selectedService || !selectedTime) return;

    setLoading(true);
    const path = 'appointments';
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const q = query(
        collection(db, path),
        where('data', '==', dateStr),
        where('hora', '==', selectedTime),
        where('status', '!=', 'cancelado')
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        alert('Este horário acabou de ser preenchido. Por favor, escolha outro.');
        setLoading(false);
        return;
      }

      const appointmentData: Omit<Appointment, 'id'> = {
        userId: user?.id || 'guest',
        userName: user?.nome || name,
        userPhone: user?.telefone || phone,
        serviceId: selectedService.id,
        serviceName: selectedService.nome,
        servicePrice: selectedService.preco,
        data: dateStr,
        hora: selectedTime,
        status: 'pendente',
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, path), appointmentData);
      
      setSuccess(true);
      
      const message = `Olá, quero confirmar meu agendamento na Barbearia 💈 Devesso:\n\nServiço: ${selectedService.nome}\nData: ${format(selectedDate, 'dd/MM/yyyy')}\nHorário: ${selectedTime}\nCliente: ${user?.nome || name}`;
      const whatsappUrl = `https://wa.me/5511999805125?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, user?.id);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-neon-green" />
        </motion.div>
        <h2 className="text-3xl font-bold mb-4 neon-text-green">Agendamento Realizado!</h2>
        <p className="text-zinc-400 mb-8">
          Seu horário foi reservado com sucesso. Enviamos os detalhes para o seu WhatsApp.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 rounded-full bg-zinc-900 border border-zinc-800 hover:border-neon-purple transition-all"
        >
          Fazer novo agendamento
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold tracking-tighter mb-4">
          RESERVE SEU <span className="text-neon-purple">ESTILO</span>
        </h2>
        <p className="text-zinc-400">Escolha o serviço, a data e o horário ideal para você.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Service Selection */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-neon-purple" /> 1. Escolha o Serviço
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap border transition-all ${
                    selectedCategory === cat
                      ? 'bg-neon-purple border-neon-purple text-white neon-glow-purple'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {services
                .filter(s => s.categoria === selectedCategory)
                .map(service => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={`p-4 rounded-xl border text-left transition-all group ${
                      selectedService?.id === service.id
                        ? 'bg-neon-purple/10 border-neon-purple neon-glow-purple'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-lg group-hover:text-neon-purple transition-colors">
                        {service.nome}
                      </span>
                      <span className="text-neon-green font-mono">R$ {service.preco}</span>
                    </div>
                    <span className="text-xs text-zinc-500 uppercase tracking-widest">{service.categoria}</span>
                  </button>
                ))}
            </div>
          </section>

          {selectedService && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-neon-blue" /> 2. Escolha a Data
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {[...Array(14)].map((_, i) => {
                  const date = addDays(new Date(), i);
                  const isSelected = isSameDay(date, selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center min-w-[80px] p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-neon-blue/10 border-neon-blue neon-glow-blue'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs uppercase font-bold mb-1">
                        {format(date, 'EEE', { locale: ptBR })}
                      </span>
                      <span className="text-2xl font-bold">{format(date, 'dd')}</span>
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}

          {selectedService && selectedDate && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-neon-green" /> 3. Escolha o Horário
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {BUSINESS_HOURS.map(time => {
                  const isBooked = bookedTimes.includes(time);
                  
                  // Check if time is in the past for today
                  const isPast = (() => {
                    if (!isSameDay(selectedDate, new Date())) return false;
                    const [hours, minutes] = time.split(':').map(Number);
                    const now = new Date();
                    if (hours < now.getHours()) return true;
                    if (hours === now.getHours() && minutes <= now.getMinutes()) return true;
                    return false;
                  })();

                  const isDisabled = isBooked || isPast;
                  const isSelected = selectedTime === time;
                  
                  return (
                    <button
                      key={time}
                      disabled={isDisabled}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-lg border text-sm font-bold transition-all ${
                        isDisabled
                          ? 'bg-zinc-950 border-zinc-900 text-zinc-800 cursor-not-allowed opacity-40'
                          : isSelected
                          ? 'bg-neon-green/10 border-neon-green text-neon-green neon-glow-green'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-neon-green'
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </motion.section>
          )}
        </div>

        {/* Summary & Final Step */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 barber-pattern">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                RESUMO DO <span className="text-neon-purple">PEDIDO</span>
              </h3>
              
              <div className="space-y-4 mb-8">
                {selectedService && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Serviço</span>
                    <span className="font-bold">{selectedService.nome}</span>
                  </div>
                )}
                {selectedDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Data</span>
                    <span className="font-bold">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400 text-sm">Horário</span>
                    <span className="font-bold">{selectedTime}</span>
                  </div>
                )}
                {selectedService && (
                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-neon-green neon-text-green">R$ {selectedService.preco}</span>
                  </div>
                )}
              </div>

              {!user && selectedService && selectedTime && (
                <div className="space-y-4 mb-6">
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Seu Nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:border-neon-purple outline-none transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="tel"
                      placeholder="Seu WhatsApp"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:border-neon-purple outline-none transition-all"
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-xs text-zinc-500">Ou</span>
                    <button onClick={onLogin} className="block w-full mt-2 text-sm text-neon-blue hover:underline">
                      Entrar com Google
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={!selectedService || !selectedTime || (!user && (!name || !phone)) || loading}
                onClick={handleBooking}
                className="w-full py-4 rounded-2xl bg-neon-purple text-white font-bold text-lg neon-glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                    <Scissors className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <><Send className="w-5 h-5" /> CONFIRMAR AGORA</>
                )}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
              <p className="text-xs text-zinc-500">
                Ao confirmar, você receberá uma mensagem automática para finalizar o agendamento no WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
