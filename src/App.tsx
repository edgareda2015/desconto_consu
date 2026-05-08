import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { AuthProvider, useAppAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/Login';

// Carregamento Preguiçoso (Lazy Loading) para performance
const Comercial = lazy(() => import('./pages/Comercial'));
const Diretor = lazy(() => import('./pages/Diretor'));
const DiretorReabertura = lazy(() => import('./pages/DiretorReabertura'));
const Coordenador = lazy(() => import('./pages/Coordenador'));
const Admin = lazy(() => import('./pages/Admin'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

const LoadingPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-bg relative overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://www.uninassau.edu.br/sites/all/themes/uninassau/images/bg-home.jpg')] bg-cover bg-center opacity-[0.03] grayscale mix-blend-multiply" />
    <div className="relative flex flex-col items-center gap-6">
      <div className="w-24 h-24 rounded-[var(--radius-xl)] bg-white shadow-[var(--shadow-elevated)] flex items-center justify-center overflow-hidden animate-fade-in relative border border-slate-100">
        <div className="absolute inset-0 border-[3px] border-transparent border-t-gold-500 rounded-[var(--radius-xl)] animate-spin opacity-50" />
        <img src="/logo.png" alt="UNINASSAU" className="w-16 h-16 object-contain relative z-10" />
      </div>
      <div className="text-center">
        <p className="text-navy-900 font-black text-[18px] tracking-tight uppercase">Desconto Consu</p>
        <p className="text-gold-600 font-bold text-[10px] tracking-[0.3em] uppercase mt-1 animate-pulse">Carregando sistema...</p>
      </div>
    </div>
  </div>
);

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { perfil, loading } = useAppAuth();
  
  if (loading) return <LoadingPage />;
  
  const userRole = perfil?.perfil;
  
  if (userRole === 'admin') return <>{children}</>;
  if (userRole && allowedRoles.includes(userRole)) return <>{children}</>;
  
  return <Navigate to="/unauthorized" replace />;
};

const IndexRedirect = () => {
  const { perfil, loading } = useAppAuth();
  
  if (loading) return <LoadingPage />;
  
  const userRole = perfil?.perfil;

  if (userRole) {
    return <Navigate to="/comercial" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6 relative">
      <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-brand-red via-gold-500 to-navy-900" />
      <div className="max-w-md w-full bg-surface p-10 rounded-[var(--radius-2xl)] shadow-[var(--shadow-modal)] text-center animate-fade-in border border-border">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-brand-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-navy-900 mb-3 tracking-tight">Acesso Restrito</h2>
        <p className="text-[14px] text-navy-500 mb-8 leading-relaxed">
          Seu usuário não possui um perfil vinculado ou o acesso foi negado.
          Contate o administrador para liberar seu acesso à plataforma.
        </p>
        <div className="text-[12px] text-navy-400 font-medium bg-navy-50 p-4 rounded-[var(--radius-md)] border border-border inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-dot" />
          Perfil atual: <span className="text-navy-900 font-bold font-mono">{perfil?.perfil || 'Não identificado'}</span>
        </div>
      </div>
    </div>
  );
};

// Componente que decide se mostra login ou o app protegido
const AppRoutes = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return <LoadingPage />;

  return (
    <Routes>
      {/* Rota de Login - sempre acessível, o componente faz o redirect se já logado */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas Protegidas */}
      {isSignedIn ? (
        <Route path="*" element={
          <AuthProvider>
            <Suspense fallback={<LoadingPage />}>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<IndexRedirect />} />
                  
                  <Route path="dashboard" element={
                    <ProtectedRoute allowedRoles={['diretor_unidade', 'admin']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="comercial" element={
                    <ProtectedRoute allowedRoles={['comercial', 'diretor_unidade', 'coordenador']}>
                      <Comercial />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="diretor" element={
                    <ProtectedRoute allowedRoles={['diretor_unidade']}>
                      <Diretor />
                    </ProtectedRoute>
                  } />

                  <Route path="diretor/reabertura" element={
                    <ProtectedRoute allowedRoles={['diretor_unidade']}>
                      <DiretorReabertura />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="coordenador" element={
                    <ProtectedRoute allowedRoles={['coordenador']}>
                      <Coordenador />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <Admin />
                    </ProtectedRoute>
                  } />

                  <Route path="unauthorized" element={<IndexRedirect />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        } />
      ) : (
        // Se não está logado, qualquer rota redireciona para /login
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
