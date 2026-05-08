import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  perfil: any | null; // Objeto com perfil e curso
  loading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: clerkLoaded, user } = useUser();
  const [perfil, setPerfil] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserRole() {
      if (!clerkLoaded) return;
      
      if (user) {
        try {
          const { data, error } = await supabase
            .from('usuarios_perfis')
            .select('*')
            .eq('clerk_user_id', user.id)
            .single();
            
          if (data && data.perfil) {
            setPerfil(data);
          } else {
            // Usuário não existe na tabela de perfis. Vamos auto-cadastrar.
            const email = user.primaryEmailAddress?.emailAddress;
            const isOwner = email === 'edgareda2015@gmail.com';
            const defaultRole = isOwner ? 'admin' : 'novo_usuario'; // admin para o dono, aguardando acesso para outros
            
            const { error: insertError } = await supabase
              .from('usuarios_perfis')
              .insert([{
                clerk_user_id: user.id,
                email: email,
                nome: user.fullName,
                perfil: defaultRole
              }]);
              
            if (!insertError) {
              setPerfil({ perfil: defaultRole, curso: [] });
            } else {
              console.error("Erro ao auto-cadastrar usuário:", insertError);
              setPerfil(null);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar perfil:", err);
          setPerfil(null);
        }
      } else {
        setPerfil(null);
      }
      setLoading(false);
    }

    loadUserRole();
  }, [user, clerkLoaded]);

  return (
    <AuthContext.Provider value={{ perfil, loading: loading || !clerkLoaded, user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
