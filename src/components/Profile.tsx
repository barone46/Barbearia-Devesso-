import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { User, Appointment } from '../types';
import { User as UserIcon, Phone, Save, ArrowLeft, CheckCircle2, Calendar, Clock, Scissors, AlertCircle, Pencil, Check, Copy, Share2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface ProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onBack: () => void;
}

export default function Profile({ user, onUpdate, onBack }: ProfileProps) {
  const [nome, setNome] = useState(user.nome);
  const [telefone, setTelefone] = useState(user.telefone);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [isEditingNome, setIsEditingNome] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.id),
      orderBy('data', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      // Sort by data desc, then hora desc
      data.sort((a, b) => {
        if (a.data !== b.data) return b.data.localeCompare(a.data);
        return b.hora.localeCompare(a.hora);
      });
      setAppointments(data);
      setLoadingAppointments(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments', user.id);
      setLoadingAppointments(false);
    });

    return () => unsubscribe();
  }, [user.id]);

  const performSave = async () => {
    setLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.id);
      const updatedData = {
        nome,
        telefone,
      };

      await updateDoc(userRef, updatedData);
      
      const updatedUser = { ...user, ...updatedData };
      onUpdate(updatedUser);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
      setIsEditingNome(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`, user.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSave();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="mb-12">
        <h2 className="text-4xl font-bold tracking-tighter mb-4">
          MEU <span className="text-neon-blue">PERFIL</span>
        </h2>
        <p className="text-zinc-400">Mantenha seus dados atualizados para facilitar seus agendamentos.</p>
      </div>

      <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 barber-pattern relative overflow-hidden">
        <form onSubmit={handleSave} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Nome Completo
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  disabled={!isEditingNome}
                  className={`w-full bg-zinc-950 border rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-lg ${
                    isEditingNome ? 'border-neon-blue' : 'border-zinc-800 text-zinc-400 cursor-not-allowed'
                  }`}
                  placeholder="Seu nome"
                />
              </div>
              <button
                type="button"
                onClick={() => isEditingNome ? performSave() : setIsEditingNome(true)}
                className={`px-6 rounded-2xl border font-bold transition-all flex items-center justify-center shrink-0 h-[62px] ${
                  isEditingNome 
                    ? 'bg-neon-green/10 border-neon-green text-neon-green neon-glow-green' 
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-neon-blue hover:text-neon-blue'
                }`}
              >
                {isEditingNome ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    <span>SALVAR</span>
                  </div>
                ) : (
                  <Pencil className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400 uppercase tracking-widest ml-1">
              WhatsApp / Telefone
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:border-neon-blue outline-none transition-all text-lg font-mono"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || (nome === user.nome && telefone === user.telefone)}
              className="w-full py-4 rounded-2xl bg-neon-blue text-zinc-950 font-bold text-lg neon-glow-blue hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                  <Save className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Save className="w-5 h-5" /> SALVAR ALTERAÇÕES
                </>
              )}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-20"
            >
              <CheckCircle2 className="w-16 h-16 text-neon-green mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Perfil Atualizado!</h3>
              <p className="text-zinc-400">Suas alterações foram salvas com sucesso.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Informações da Conta</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-xs text-zinc-500 block mb-1">Telefone</span>
            <span className="font-medium text-zinc-300 font-mono">{user.telefone}</span>
          </div>
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
            <span className="text-xs text-zinc-500 block mb-1">Tipo de Conta</span>
            <span className="font-medium text-zinc-300 uppercase tracking-tighter">
              {user.tipo === 'admin' ? 'Administrador' : 'Cliente'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border border-zinc-800 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Share2 className="w-24 h-24 rotate-12" />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-2xl font-bold tracking-tighter mb-2 flex items-center gap-2">
            <ExternalLink className="w-6 h-6 text-neon-blue" /> INDIQUE E <span className="text-neon-blue">GANHE</span>
          </h3>
          <p className="text-zinc-400 mb-6 max-w-md">
            Compartilhe seu link exclusivo com seus amigos e ganhe descontos especiais em seus próximos cortes!
          </p>

          <div className="space-y-4">
            <div className="relative">
              <div className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-4 pl-4 pr-32 text-sm font-mono text-zinc-400 truncate">
                <a 
                  href={`${window.location.origin}/?ref=${user.referralCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-neon-blue transition-colors underline decoration-zinc-800 underline-offset-4"
                >
                  {window.location.origin}/?ref={user.referralCode}
                </a>
              </div>
              <button 
                onClick={handleCopyLink}
                className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  copied ? 'bg-neon-green text-zinc-950' : 'bg-neon-blue text-zinc-950 hover:scale-105'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" /> COPIADO!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> COPIAR
                  </>
                )}
              </button>
            </div>

            <button 
              onClick={() => {
                const message = `Ei! Conheça a Barbearia 💈 Devesso. Use meu link para agendar seu horário e ganhe um desconto especial: ${window.location.origin}/?ref=${user.referralCode}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
              }}
              className="w-full py-4 rounded-2xl bg-neon-green text-zinc-950 font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              <Share2 className="w-5 h-5" /> COMPARTILHAR NO WHATSAPP
            </button>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold tracking-tighter mb-6 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-neon-purple" /> MEUS <span className="text-neon-purple">AGENDAMENTOS</span>
        </h3>

        {loadingAppointments ? (
          <div className="flex justify-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Scissors className="w-8 h-8 text-zinc-700" />
            </motion.div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/30 border border-dashed border-zinc-800">
            <Calendar className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500">Você ainda não possui agendamentos.</p>
            <button onClick={onBack} className="mt-4 text-neon-blue hover:underline text-sm font-bold">
              Agendar agora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => {
              const appDate = parseISO(appointment.data);
              const isFuture = isAfter(appDate, startOfToday()) || 
                              (format(appDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'));
              
              return (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-5 rounded-2xl border transition-all ${
                    isFuture ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-950 border-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isFuture ? 'bg-neon-purple/10 text-neon-purple' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        <Scissors className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{appointment.serviceName}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(appDate, "dd 'de' MMMM", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                            <Clock className="w-3.5 h-3.5" />
                            {appointment.hora}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col justify-between items-end gap-2">
                      <span className="text-lg font-mono font-bold text-neon-green">
                        R$ {appointment.servicePrice}
                      </span>
                      <StatusBadge status={appointment.status} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const styles: any = {
    pendente: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmado: 'bg-neon-green/10 text-neon-green border-neon-green/20',
    cancelado: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  const labels: any = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    cancelado: 'Cancelado'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
