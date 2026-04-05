import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Appointment, Service, User } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { 
  TrendingUp, Users, Calendar, DollarSign, CheckCircle, XCircle, Clock, 
  Search, Filter, ChevronRight, MoreVertical, Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'appointments' | 'services'>('appointments');
  const [filter, setFilter] = useState<'all' | 'pendente' | 'confirmado' | 'cancelado'>('all');
  const [search, setSearch] = useState('');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('all');
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    const qAppointments = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubscribeAppointments = onSnapshot(qAppointments, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
      setLoading(false);
    });

    const qServices = query(collection(db, 'services'), orderBy('categoria', 'asc'));
    const unsubscribeServices = onSnapshot(qServices, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
      setServices(data);
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeServices();
    };
  }, []);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
      console.error('Update status error:', error);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    try {
      await updateDoc(doc(db, 'services', editingService.id), {
        nome: editingService.nome,
        preco: editingService.preco,
        ativo: editingService.ativo
      });
      setEditingService(null);
    } catch (error) {
      console.error('Update service error:', error);
    }
  };

  // Financial Stats
  const totalRevenue = appointments
    .filter(a => a.status === 'confirmado')
    .reduce((sum: number, a) => sum + (a.servicePrice || 0), 0);

  const pendingRevenue = appointments
    .filter(a => a.status === 'pendente')
    .reduce((sum: number, a) => sum + (a.servicePrice || 0), 0);

  // Chart Data: Revenue by Day (Current Week)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const revenueByDay = days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const revenue = appointments
      .filter(a => a.data === dayStr && a.status === 'confirmado')
      .reduce((sum: number, a) => sum + (a.servicePrice || 0), 0);
    return {
      name: format(day, 'EEE', { locale: ptBR }),
      revenue
    };
  });

  // Chart Data: Most Popular Services
  const serviceCounts = appointments.reduce((acc, a) => {
    acc[a.serviceName] = (acc[a.serviceName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const popularServices = Object.entries(serviceCounts)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const COLORS = ['#bc13fe', '#00f3ff', '#39ff14', '#ff0000', '#ffbb28'];

  const filteredAppointments = appointments.filter(a => {
    const matchesFilter = filter === 'all' || a.status === filter;
    const matchesSearch = a.userName.toLowerCase().includes(search.toLowerCase()) || 
                         a.serviceName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredServices = services.filter(s => {
    return serviceCategoryFilter === 'all' || s.categoria === serviceCategoryFilter;
  });

  const uniqueCategories = Array.from(new Set(services.map(s => s.categoria)));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            activeTab === 'appointments'
              ? 'bg-neon-purple text-white neon-glow-purple'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Agendamentos
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`px-6 py-2 rounded-full font-bold transition-all ${
            activeTab === 'services'
              ? 'bg-neon-blue text-white neon-glow-blue'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Serviços
        </button>
      </div>

      {activeTab === 'appointments' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Faturamento Total" 
              value={`R$ ${totalRevenue}`} 
              icon={<DollarSign className="text-neon-green" />} 
              trend="+12%" 
              color="green"
            />
            <StatCard 
              title="Agendamentos" 
              value={appointments.length} 
              icon={<Calendar className="text-neon-purple" />} 
              trend="+5%" 
              color="purple"
            />
            <StatCard 
              title="Novos Clientes" 
              value={new Set(appointments.map(a => a.userId)).size} 
              icon={<Users className="text-neon-blue" />} 
              trend="+8%" 
              color="blue"
            />
            <StatCard 
              title="Pendente" 
              value={`R$ ${pendingRevenue}`} 
              icon={<Clock className="text-zinc-500" />} 
              trend="Aguardando" 
              color="zinc"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-purple" /> FATURAMENTO <span className="text-neon-purple">SEMANAL</span>
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                      itemStyle={{ color: '#bc13fe' }}
                    />
                    <Bar dataKey="revenue" fill="#bc13fe" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Popular Services Chart */}
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-neon-blue" /> SERVIÇOS <span className="text-neon-blue">POPULARES</span>
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={popularServices}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {popularServices.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-neon-green" /> AGENDAMENTOS <span className="text-neon-green">RECENTES</span>
              </h3>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Buscar..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-neon-purple outline-none w-full"
                  />
                </div>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-4 text-sm focus:border-neon-purple outline-none"
                >
                  <option value="all">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-500 text-xs uppercase tracking-widest border-b border-zinc-800">
                    <th className="pb-4 font-semibold">Cliente</th>
                    <th className="pb-4 font-semibold">Serviço</th>
                    <th className="pb-4 font-semibold">Data/Hora</th>
                    <th className="pb-4 font-semibold">Valor</th>
                    <th className="pb-4 font-semibold">Status</th>
                    <th className="pb-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="group hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">
                            {appointment.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{appointment.userName}</div>
                            <div className="text-xs text-zinc-500">{appointment.userPhone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-medium">{appointment.serviceName}</span>
                      </td>
                      <td className="py-4">
                        <div className="text-sm font-bold">{format(parseISO(appointment.data), 'dd/MM')}</div>
                        <div className="text-xs text-zinc-500">{appointment.hora}</div>
                      </td>
                      <td className="py-4">
                        <span className="text-sm font-mono text-neon-green">R$ {appointment.servicePrice}</span>
                      </td>
                      <td className="py-4">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {appointment.status === 'pendente' && (
                            <>
                              <button 
                                onClick={() => updateStatus(appointment.id, 'confirmado')}
                                className="p-2 rounded-lg bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => updateStatus(appointment.id, 'cancelado')}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAppointments.length === 0 && (
                <div className="py-12 text-center text-zinc-500">
                  Nenhum agendamento encontrado.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Scissors className="w-5 h-5 text-neon-blue" /> GERENCIAR <span className="text-neon-blue">SERVIÇOS</span>
            </h3>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select 
                  value={serviceCategoryFilter}
                  onChange={(e) => setServiceCategoryFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-neon-blue outline-none w-full appearance-none cursor-pointer"
                >
                  <option value="all">Todas as Categorias</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <div 
                key={service.id} 
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex justify-between items-center group"
              >
                <div>
                  <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">{service.categoria}</div>
                  <div className="font-bold text-lg">{service.nome}</div>
                  <div className="text-neon-green font-mono">R$ {service.preco}</div>
                </div>
                <button 
                  onClick={() => setEditingService(service)}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-neon-blue text-zinc-400 hover:text-neon-blue transition-all"
                >
                  <Scissors className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <AnimatePresence>
            {editingService && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 relative"
                >
                  <button 
                    onClick={() => setEditingService(null)}
                    className="absolute right-6 top-6 text-zinc-500 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                  
                  <h4 className="text-2xl font-bold mb-6">Editar Serviço</h4>
                  
                  <form onSubmit={handleUpdateService} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Serviço</label>
                      <input 
                        type="text"
                        value={editingService.nome}
                        onChange={(e) => setEditingService({...editingService, nome: e.target.value})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:border-neon-blue outline-none"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço (R$)</label>
                      <input 
                        type="number"
                        value={editingService.preco}
                        onChange={(e) => setEditingService({...editingService, preco: Number(e.target.value)})}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 focus:border-neon-blue outline-none"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="ativo"
                        checked={editingService.ativo}
                        onChange={(e) => setEditingService({...editingService, ativo: e.target.checked})}
                        className="w-5 h-5 rounded border-zinc-800 bg-zinc-950 text-neon-blue focus:ring-neon-blue"
                      />
                      <label htmlFor="ativo" className="text-sm font-bold text-zinc-300">Serviço Ativo</label>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-4 rounded-2xl bg-neon-blue text-zinc-950 font-bold neon-glow-blue hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      SALVAR ALTERAÇÕES
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const colorMap: any = {
    green: 'border-neon-green/20 bg-neon-green/5',
    purple: 'border-neon-purple/20 bg-neon-purple/5',
    blue: 'border-neon-blue/20 bg-neon-blue/5',
    zinc: 'border-zinc-800 bg-zinc-900/50'
  };

  return (
    <div className={`p-6 rounded-3xl border ${colorMap[color]} backdrop-blur-sm`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800">
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${color === 'zinc' ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-950 text-neon-green'}`}>
          {trend}
        </span>
      </div>
      <div className="text-zinc-400 text-sm font-medium mb-1">{title}</div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: Appointment['status'] }) {
  const styles: any = {
    pendente: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    confirmado: 'bg-neon-green/10 text-neon-green border-neon-green/20',
    cancelado: 'bg-red-500/10 text-red-500 border-red-500/20'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${styles[status]}`}>
      {status}
    </span>
  );
}
