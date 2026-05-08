import React, { useState, useEffect } from 'react';
import { useSignIn, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, ArrowRight, ArrowLeft, Mail, Lock, CheckCircle2, Hash, KeyRound, Loader2, ShieldCheck, Zap, Building2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

// Validation Schemas
const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
const forgotSchema = z.object({ email: z.string().email('Informe um e-mail válido') });
const codeSchema = z.object({ code: z.string().min(6, 'Informe o código de 6 dígitos') });
const newPasswordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: 'As senhas não coincidem', path: ['confirmPassword'] });

type Step = 'login' | 'forgot' | 'code' | 'new-password' | 'success';

const traduzir = (msg: string): string => {
  const t: [string, string][] = [
    ['Session already exists', 'Você já possui uma sessão ativa.'],
    ['Identifier is invalid', 'E-mail ou usuário inválido.'],
    ['Password is incorrect', 'Senha incorreta.'],
    ['Couldn\'t find your account', 'Conta não encontrada.'],
    ['Too many failed attempts', 'Muitas tentativas. Aguarde alguns minutos.'],
    ['Too many requests', 'Muitas tentativas. Tente mais tarde.'],
    ['is not allowed', 'Este e-mail não está autorizado.'],
    ['Incorrect code', 'Código incorreto. Tente novamente.'],
  ];
  for (const [k, v] of t) if (msg.includes(k)) return v;
  return msg;
};

// Premium Input Field
const PremiumInput = React.forwardRef<HTMLInputElement, any>(({ icon: Icon, label, error, right, ...props }, ref) => (
  <div className="w-full mb-5">
    <label className="block text-[13px] font-bold text-navy-800 mb-2">{label}</label>
    <div className={`relative flex items-center glass-input rounded-xl overflow-hidden ${error ? 'border-brand-red bg-red-50/30' : ''}`}>
      <div className="pl-4 text-navy-400 absolute left-0 flex items-center pointer-events-none">
        {Icon && <Icon size={18} strokeWidth={2.5} />}
      </div>
      <input
        ref={ref}
        className="w-full h-[52px] bg-transparent pl-11 pr-4 text-[15px] text-navy-900 font-medium outline-none placeholder:text-navy-300"
        {...props}
      />
      {right && <div className="absolute right-3 flex items-center">{right}</div>}
    </div>
    {error && (
      <p className="text-[12px] font-bold text-brand-red mt-1.5 flex items-center gap-1 animate-fade-in">
        <AlertCircle size={14} /> {error}
      </p>
    )}
  </div>
));
PremiumInput.displayName = 'PremiumInput';

export const LoginPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('login');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const loginForm = useForm({ resolver: zodResolver(loginSchema) });
  const forgotForm = useForm({ resolver: zodResolver(forgotSchema) });
  const codeForm = useForm({ resolver: zodResolver(codeSchema) });
  const newPwForm = useForm({ resolver: zodResolver(newPasswordSchema) });
  const watchPw = newPwForm.watch('password', '');

  useEffect(() => {
    if (isSignedIn) navigate('/', { replace: true });
  }, [isSignedIn, navigate]);

  const handleLogin = async (data: any) => {
    if (!isLoaded || !signIn) return;
    setBusy(true); 
    setError('');
    
    try {
      let r = await signIn.create({ 
        identifier: data.email, 
        password: data.password 
      });

      // DIAGNÓSTICO: Se ainda pedir fator, vamos ver o que ele quer
      if (r.status === 'needs_second_factor' || r.status === 'needs_first_factor') {
        const userId = (r as any).userData?.id || r.user?.id || (r as any).userId;
        console.log("Tentando bypass para ID:", userId);

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-clerk-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || ''
          },
          body: JSON.stringify({ action: 'get_token', userId, email: data.email })
        });
        
        const dataToken = await response.json();
        if (dataToken.token) {
          r = await signIn.create({ strategy: 'ticket', ticket: dataToken.token });
        }
      }

      if (r.status === 'complete') {
        await setActive({ session: r.createdSessionId });
        navigate('/comercial', { replace: true });
      } else {
        // MOSTRAR TUDO NA TELA PARA DIAGNÓSTICO
        const factors = JSON.stringify(r.firstFactors || r.secondFactors || []);
        setError(`Status: ${r.status} | Fatores: ${factors}`);
      }
    } catch (e: any) {
      console.error("ERRO COMPLETO DO LOGIN:", e);
      const msg = e.errors?.[0]?.longMessage || e.errors?.[0]?.message || 'Falha ao entrar.';
      setError(`Erro: ${msg}`);
    } finally { setBusy(false); }
  };

  const handleForgot = async (data: any) => {
    if (!isLoaded || !signIn) return;
    setBusy(true); setError(''); setEmail(data.email);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: data.email });
      goTo('code');
    } catch (e: any) {
      setError(traduzir(e.errors?.[0]?.longMessage || 'Erro ao enviar código.'));
    } finally { setBusy(false); }
  };

  const handleCode = async (data: any) => { setVerificationCode(data.code); goTo('new-password'); };

  const handleNewPassword = async (data: any) => {
    if (!isLoaded || !signIn) return;
    setBusy(true); setError('');
    try {
      const r = await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code: verificationCode, password: data.password });
      if (r.status === 'complete') goTo('success');
    } catch (e: any) {
      setError(traduzir(e.errors?.[0]?.longMessage || 'Erro ao redefinir senha.'));
    } finally { setBusy(false); }
  };

  const goTo = (s: Step) => { setStep(s); setError(''); };

  if (isSignedIn) return null;

  const anim = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeOut' as any }
  };

  return (
    <div className="min-h-screen w-full flex bg-bg font-sans overflow-hidden">
      
      {/* ═══ LEFT SIDE: PREMIUM BRANDING ═══ */}
      <div className="hidden lg:flex w-[45%] bg-slate-50 relative flex-col justify-between p-14 2xl:p-20 overflow-hidden z-10 border-r border-slate-200 shadow-sm">
        <div className="absolute inset-0 bg-[url('https://www.uninassau.edu.br/sites/all/themes/uninassau/images/bg-home.jpg')] opacity-[0.04] mix-blend-overlay bg-cover bg-center pointer-events-none" />
        
        {/* Decorative Blur Orbs */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center">
          <div className="mb-8 drop-shadow-2xl">
             <img src="/logo.png" alt="UNINASSAU" className="h-44 object-contain" />
          </div>

          <h1 className="text-3xl xl:text-4xl font-black text-navy-900 leading-tight tracking-tighter max-w-md">
            DESCONTO CONSU<br />
            <span className="text-slate-500 text-2xl xl:text-3xl font-bold">
              UNINASSAU OLINDA
            </span>
          </h1>
        </div>

        <div className="relative z-20 mt-auto flex justify-center">
          <p className="text-navy-300/80 text-[12px] font-bold tracking-widest uppercase flex items-center gap-2">
            <Building2 size={14} /> Ser Educacional
          </p>
        </div>
      </div>

      {/* ═══ RIGHT SIDE: LOGIN FORM ═══ */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />
        
        <div className="w-full max-w-[420px] relative z-10">
          
          {/* Logo on Mobile */}
          <div className="lg:hidden mb-10 flex flex-col items-center justify-center drop-shadow-md">
            <img src="/logo.png" alt="UNINASSAU" className="h-24 object-contain mb-4" />
            <h1 className="text-xl font-black text-navy-900 text-center uppercase tracking-tighter">
              Desconto Consu<br/>
              <span className="text-slate-500 text-[14px] font-bold">Uninassau Olinda</span>
            </h1>
          </div>

          <div className="glass-panel rounded-[24px] p-8 sm:p-10">
            <AnimatePresence mode="wait">

              {/* TELA 1 — LOGIN */}
              {step === 'login' && (
                <motion.div key="login" {...anim}>
                  <div className="mb-8 text-center sm:text-left">
                    <h2 className="text-[26px] font-extrabold text-navy-900 tracking-tight">Acesse o portal</h2>
                    <p className="text-[14px] text-navy-500 mt-2 font-medium">Faça login com suas credenciais corporativas.</p>
                  </div>

                  {error && (
                    <div className="mb-6 bg-red-50 text-brand-red text-[13px] font-bold p-4 rounded-xl border border-brand-red/20 flex items-start gap-3 animate-shake">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <form onSubmit={loginForm.handleSubmit(handleLogin)}>
                    <PremiumInput
                      {...loginForm.register('email')}
                      icon={Mail}
                      label="E-mail Corporativo"
                      placeholder="nome@sereducacional.com"
                      error={loginForm.formState.errors.email?.message as string}
                    />

                    <PremiumInput
                      {...loginForm.register('password')}
                      icon={Lock}
                      label="Senha"
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      error={loginForm.formState.errors.password?.message as string}
                      right={
                        <button type="button" onClick={() => setShowPw(!showPw)} className="text-navy-400 hover:text-navy-700 transition-colors p-1">
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    <div className="flex justify-end mb-6 -mt-2">
                      <button type="button" onClick={() => goTo('forgot')} className="text-[13px] font-bold text-navy-500 hover:text-navy-800 transition-colors">
                        Recuperar senha
                      </button>
                    </div>

                    <Button type="submit" isLoading={busy} className="w-full h-12 text-[15px] shadow-button">
                      Entrar na plataforma
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* TELA 2 — ESQUECI A SENHA */}
              {step === 'forgot' && (
                <motion.div key="forgot" {...anim}>
                  <button onClick={() => goTo('login')} className="flex items-center gap-1 text-[13px] font-bold text-navy-500 hover:text-navy-800 transition-colors mb-6 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                  </button>
                  <div className="mb-8">
                    <h2 className="text-[24px] font-extrabold text-navy-900 tracking-tight">Esqueci minha senha</h2>
                    <p className="text-[14px] text-navy-500 mt-2 font-medium">Enviaremos um código de recuperação para o seu e-mail.</p>
                  </div>
                  {error && (
                    <div className="mb-6 bg-red-50 text-brand-red text-[13px] font-bold p-3 rounded-xl border border-brand-red/20 flex gap-2">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  <form onSubmit={forgotForm.handleSubmit(handleForgot)}>
                    <PremiumInput
                      {...forgotForm.register('email')}
                      icon={Mail}
                      label="E-mail cadastrado"
                      placeholder="seu@email.com"
                      error={forgotForm.formState.errors.email?.message as string}
                    />
                    <Button type="submit" isLoading={busy} className="w-full h-12 mt-2">
                      Receber código
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* TELA 3 — CÓDIGO */}
              {step === 'code' && (
                <motion.div key="code" {...anim}>
                  <button onClick={() => goTo('forgot')} className="flex items-center gap-1 text-[13px] font-bold text-navy-500 hover:text-navy-800 transition-colors mb-6 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Voltar
                  </button>
                  <div className="mb-8">
                    <h2 className="text-[24px] font-extrabold text-navy-900 tracking-tight">Verificar código</h2>
                    <p className="text-[14px] text-navy-500 mt-2 font-medium">Insira o código de 6 dígitos que enviamos para <b className="text-navy-900">{email}</b>.</p>
                  </div>
                  {error && (
                    <div className="mb-6 bg-red-50 text-brand-red text-[13px] font-bold p-3 rounded-xl border border-brand-red/20 flex gap-2">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  <form onSubmit={codeForm.handleSubmit(handleCode)}>
                    <PremiumInput
                      {...codeForm.register('code')}
                      icon={Hash}
                      label="Código de 6 dígitos"
                      placeholder="000000"
                      maxLength={6}
                      error={codeForm.formState.errors.code?.message as string}
                    />
                    <Button type="submit" className="w-full h-12 mt-2">
                      Validar código
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* TELA 4 — NOVA SENHA */}
              {step === 'new-password' && (
                <motion.div key="newpw" {...anim}>
                  <div className="mb-8">
                    <h2 className="text-[24px] font-extrabold text-navy-900 tracking-tight">Criar nova senha</h2>
                    <p className="text-[14px] text-navy-500 mt-2 font-medium">Defina uma senha segura para proteger sua conta corporativa.</p>
                  </div>
                  {error && (
                    <div className="mb-6 bg-red-50 text-brand-red text-[13px] font-bold p-3 rounded-xl border border-brand-red/20 flex gap-2">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  <form onSubmit={newPwForm.handleSubmit(handleNewPassword)}>
                    <PremiumInput
                      {...newPwForm.register('password')}
                      icon={KeyRound}
                      type="password"
                      label="Nova Senha"
                      placeholder="Digite a nova senha"
                      error={newPwForm.formState.errors.password?.message as string}
                    />
                    <PremiumInput
                      {...newPwForm.register('confirmPassword')}
                      icon={Lock}
                      type="password"
                      label="Confirme a Senha"
                      placeholder="Repita a nova senha"
                      error={newPwForm.formState.errors.confirmPassword?.message as string}
                    />
                    <Button type="submit" isLoading={busy} className="w-full h-12 mt-2">
                      Redefinir e Acessar
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* TELA 5 — SUCESSO */}
              {step === 'success' && (
                <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-8">
                  <div className="w-20 h-20 bg-green-50 text-brand-green rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100">
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 className="text-[24px] font-extrabold text-navy-900 tracking-tight mb-2">Tudo pronto!</h2>
                  <p className="text-[14px] text-navy-500 font-medium mb-8">Sua senha foi redefinida com sucesso. Bem-vindo de volta.</p>
                  <Button onClick={() => goTo('login')} className="w-full h-12">
                    Ir para Login
                  </Button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
          
          <div className="text-center mt-8 space-y-1">
            <p className="text-[12px] font-semibold text-slate-400">
              © 2026 UNINASSAU. Todos os direitos reservados.
            </p>
            <p className="text-[11px] font-bold text-navy-400">
              Desenvolvido por <span className="text-navy-600">Edgar Tavares</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
