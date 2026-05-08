import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAppAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  CheckSquare,
  Users,
  Menu,
  X,
  ChevronLeft,
  GraduationCap,
  LogOut,
  Bell,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/cn';

export const MainLayout = () => {
  const { user } = useUser();
  const { perfil, loading } = useAppAuth();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileOpen, setProfileOpen] = useState(false);
  const location = useLocation();

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg gap-5">
      <img src="/logo.png" alt="UNINASSAU" className="h-24 w-auto" />
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-navy-200 border-t-navy-700" />
      <p className="text-navy-500 text-[13px] font-medium">Carregando sistema...</p>
    </div>
  );

  const userRole = perfil?.perfil;
  const navItems: { label: string; path: string; icon: any }[] = [];

  if (userRole === 'diretor_unidade' || userRole === 'admin') {
    navItems.push({ label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard });
  }

  if (userRole === 'comercial' || userRole === 'diretor_unidade' || userRole === 'coordenador' || userRole === 'admin') {
    navItems.push({ label: 'Solicitações', path: '/comercial', icon: FileText });
  }
  if (userRole === 'diretor_unidade' || userRole === 'admin') {
    navItems.push({ label: 'Painel do Diretor', path: '/diretor', icon: CheckSquare });
  }
  if (userRole === 'coordenador' || userRole === 'admin') {
    navItems.push({ label: 'Coordenação', path: '/coordenador', icon: GraduationCap });
  }
  if (userRole === 'admin') {
    navItems.push({ label: 'Usuários', path: '/admin', icon: Users });
  }

  const roleLabels: Record<string, string> = {
    novo_usuario: 'Aguardando Acesso',
    comercial: 'Comercial',
    diretor_unidade: 'Diretor de Unidade',
    coordenador: 'Coordenador',
    admin: 'Administrador',
  };

  return (
    <div className="flex flex-col h-screen bg-bg overflow-hidden font-sans">
      
      {/* ═══ TOP NAVBAR ═══ */}
      <header className="h-16 bg-white border-b border-slate-200 w-full shrink-0 z-40 shadow-sm">
        <div className="layout-container h-full flex items-center justify-between">
        
        {/* Esquerda: Menu Mobile e Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-full text-slate-500 hover:bg-slate-50 lg:hidden"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="shrink-0">
              <img src="/logo.png" alt="UNINASSAU" className="h-10 w-auto object-contain" />
            </div>
            <div className="hidden sm:block">
              <p className="text-[16px] font-black text-navy-900 tracking-tighter leading-tight uppercase">Desconto Consu</p>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] leading-none mt-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-700 bg-clip-text text-transparent drop-shadow-sm">Olinda</p>
            </div>
          </div>
        </div>

        {/* Centro: Nav Desktop */}
        <nav className="hidden lg:flex flex-1 items-center justify-center mx-6">
          <ul className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 group relative whitespace-nowrap",
                      isActive
                        ? 'bg-navy-50 text-navy-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-navy-600'
                    )}
                  >
                    <item.icon size={18} className={cn(isActive ? 'text-navy-600' : 'text-slate-400 group-hover:text-navy-500')} />
                    <span className={cn("text-[13px]", isActive ? "font-bold" : "font-semibold")}>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Direita: Perfil do Usuário */}
        <div className="flex items-center justify-end gap-4 shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[13px] font-semibold text-slate-600 whitespace-nowrap">
              Olá, <span className="text-navy-900 font-bold">{user?.fullName?.split(' ')[0]}</span>
            </p>
          </div>
          <div className="relative shrink-0">
            <button
              onClick={() => setProfileOpen(!isProfileOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-navy-600 text-white font-bold hover:bg-navy-700 transition-colors shadow-sm ring-2 ring-white hover:ring-navy-100"
            >
              {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white rounded-xl shadow-2xl border border-navy-100 overflow-hidden z-50 origin-top-right"
                  >
                    <div className="p-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-[13px] font-bold text-navy-900 truncate">{user?.fullName}</p>
                      <p className="text-[11px] font-medium text-slate-500 truncate">{roleLabels[perfil?.perfil || ''] || perfil?.perfil}</p>
                    </div>
                    <div className="p-1.5">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center justify-start gap-3 px-3 py-2.5 text-[13px] font-bold text-brand-red hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <LogOut size={16} className="shrink-0" />
                        <span>Sair da plataforma</span>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>
      </header>

      {/* ═══ MOBILE SIDEBAR OVERLAY (Para telas pequenas) ═══ */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 h-full w-[280px] bg-white border-r border-slate-200 z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="h-[72px] flex items-center justify-between px-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-navy-600 flex items-center justify-center shadow-md">
                    <img src="/logo.png" alt="UNINASSAU" className="w-6 h-6 object-contain mix-blend-screen brightness-200 contrast-125" />
                  </div>
                  <div>
                    <p className="text-[15px] font-extrabold text-navy-900">Gestão</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Descontos</p>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-navy-600 hover:bg-slate-50 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-5 px-3">
                <ul className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200",
                            isActive
                              ? 'bg-navy-50 text-navy-700 font-bold'
                              : 'text-slate-500 font-semibold hover:bg-slate-50 hover:text-navy-600'
                          )}
                        >
                          <item.icon size={20} className={isActive ? "text-navy-600" : "text-slate-400"} />
                          <span className="text-[14px]">{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-bg">
        <div className="layout-container page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
