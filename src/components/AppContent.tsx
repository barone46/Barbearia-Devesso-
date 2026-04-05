import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { User } from '../types';
import { Scissors, LogIn, LogOut, LayoutDashboard, Calendar, AlertCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Booking from './Booking';
import AdminDashboard from './AdminDashboard';
import Profile from './Profile';
import LoginModal from './LoginModal';
import { INITIAL_SERVICES } from '../constants';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  state = { hasError: false, error: null };

  constructor(props: { children: ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      try {
        const parsed = JSON.parse(error?.message || "");
        if (parsed.error) errorMessage = `Erro de Permissão: ${parsed.operationType} em ${parsed.path}`;
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
          <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900 border border-red-500/30 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-white">Ops! Algo deu errado</h2>
            <p className="text-zinc-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'booking' | 'admin' | 'profile'>('booking');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const initServices = async () => {
      const servicesSnap = await getDocs(collection(db, 'services'));
      if (servicesSnap.empty) {
        const batch = writeBatch(db);
        INITIAL_SERVICES.forEach((s) => {
          const newDoc = doc(collection(db, 'services'));
          batch.set(newDoc, { ...s, id: newDoc.id, ativo: true });
        });
        await batch.commit();
      }
    };

    const checkSession = async () => {
      const savedUserId = localStorage.getItem('barber_user_id');
      if (savedUserId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', savedUserId));
          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            localStorage.removeItem('barber_user_id');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      await initServices();
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('barber_user_id');
    setUser(null);
    setView('booking');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Scissors className="w-12 h-12 text-neon-purple" />
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col">
        <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('booking')}>
              <div className="p-2 bg-neon-purple/10 rounded-lg">
                <Scissors className="w-6 h-6 text-neon-purple" />
              </div>
              <h1 className="text-xl font-bold tracking-tighter neon-text-purple">
                BARBEARIA <span className="text-neon-blue">DEVESSO</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    {user.tipo === 'admin' && (
                      <button
                        onClick={() => setView(view === 'admin' ? 'booking' : 'admin')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                          view === 'admin' 
                            ? 'bg-neon-purple/10 border-neon-purple text-neon-purple' 
                            : 'bg-zinc-900 border-zinc-800 hover:border-neon-purple'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4" /> 
                        <span className="hidden sm:inline">Painel</span>
                      </button>
                    )}
                    <button
                      onClick={() => setView(view === 'profile' ? 'booking' : 'profile')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                        view === 'profile' 
                          ? 'bg-neon-blue/10 border-neon-blue text-neon-blue' 
                          : 'bg-zinc-900 border-zinc-800 hover:border-neon-blue'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Perfil</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleLogout}
                      className="p-2 rounded-full bg-zinc-900 border border-zinc-800 hover:border-red-500 transition-all text-red-500"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-neon-purple text-white font-semibold neon-glow-purple hover:scale-105 transition-all"
                >
                  <LogIn className="w-4 h-4" /> Entrar
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <AnimatePresence mode="wait">
            {view === 'booking' && (
              <motion.div
                key="booking"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Booking user={user} onLogin={handleLogin} />
              </motion.div>
            )}
            {view === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <AdminDashboard />
              </motion.div>
            )}
            {view === 'profile' && user && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Profile 
                  user={user} 
                  onUpdate={(updatedUser) => setUser(updatedUser)} 
                  onBack={() => setView('booking')} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="py-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
          <p>&copy; 2026 Barbearia 💈 Devesso. Todos os direitos reservados.</p>
        </footer>

        <LoginModal 
          isOpen={isLoginModalOpen} 
          onClose={() => setIsLoginModalOpen(false)} 
          onLogin={(u) => setUser(u)} 
        />
      </div>
    </ErrorBoundary>
  );
}
