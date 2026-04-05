import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Phone, LogIn, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic phone number sanitization
      const sanitizedPhone = telefone.replace(/\D/g, '');
      if (sanitizedPhone.length < 10) {
        throw new Error('Por favor, insira um telefone válido com DDD.');
      }

      // Check if user exists by phone number
      const q = query(collection(db, 'users'), where('telefone', '==', sanitizedPhone));
      const querySnapshot = await getDocs(q);

      let user: User;

      if (!querySnapshot.empty) {
        // User exists
        user = querySnapshot.docs[0].data() as User;
      } else {
        // Create new user
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const referralCode = userId.slice(-6).toUpperCase();
        
        user = {
          id: userId,
          nome,
          telefone: sanitizedPhone,
          tipo: sanitizedPhone === '11999805125' ? 'admin' : 'cliente',
          createdAt: new Date().toISOString(),
          referralCode,
        };

        await setDoc(doc(db, 'users', userId), user);
      }

      // Persist in localStorage
      localStorage.setItem('barber_user_id', user.id);
      onLogin(user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-purple via-neon-blue to-neon-green" />
            
            <button
              onClick={onClose}
              className="absolute right-6 top-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-neon-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-8 h-8 text-neon-purple" />
              </div>
              <h2 className="text-3xl font-bold tracking-tighter">BEM-VINDO!</h2>
              <p className="text-zinc-400 mt-2">Acesse sua conta para agendar seu estilo.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  Seu Nome
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:border-neon-purple outline-none transition-all"
                    placeholder="Como podemos te chamar?"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  WhatsApp / Telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="tel"
                    required
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:border-neon-blue outline-none transition-all font-mono"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-neon-purple text-white font-bold text-lg neon-glow-purple hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? 'ACESSANDO...' : 'ENTRAR AGORA'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
