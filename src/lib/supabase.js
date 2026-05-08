import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas. O banco não funcionará.")
}

// Cria o cliente Supabase sem a key global se houver um token específico vindo do Clerk (faremos via JWT do Clerk ou via client padrão se apenas usando Row Level Security com o header auth.jwt)
// Para simplificar a integração frontend sem custom JWT, usaremos o padrão e passaremos o token de sessão do Clerk no request, mas como Supabase + Clerk requer custom JWT integration e o usuário pediu algo rápido sem backend, usaremos a autenticação integrada.
// Assumiremos que o AuthContext configura o JWT correto.

export const supabase = createClient(supabaseUrl || 'https://dummy.supabase.co', supabaseAnonKey || 'dummy_key')
