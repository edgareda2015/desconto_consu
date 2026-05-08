import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Input';
import { Save, Users, AlertCircle, Settings2, Check, X, Plus, UserPlus, Trash2, Edit2, HelpCircle } from 'lucide-react';
import { QuickGuide } from '../components/ui/QuickGuide';
import toast from 'react-hot-toast';

export default function Admin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [courseSelectionUser, setCourseSelectionUser] = useState<any | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingNew, setSubmittingNew] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    perfil: 'comercial'
  });

  const cursos = [
    'ADMINISTRAÇÃO', 'ANÁLISE E DESENVOLVIMENTO DE SISTEMAS', 
    'BIOMEDICINA', 'CIÊNCIA DA COMPUTAÇÃO', 'CIÊNCIAS CONTÁBEIS', 
    'DIREITO', 'DISCIPLINA ISOLADA', 'ENFERMAGEM', 'FARMÁCIA', 
    'FISIOTERAPIA', 'NUTRIÇÃO', 'ODONTOLOGIA', 'PEDAGOGIA', 
    'PSICOLOGIA', 'SERVIÇO SOCIAL', 'SISTEMAS DE INFORMAÇÃO', 
    'TERAPIA OCUPACIONAL'
  ];

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios_perfis')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsuarios(data || []);
    } catch (err) {
      toast.error('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmittingNew(true);
    try {
      // 1. Cria no Clerk via Edge Function
      const { data: clerkData, error: clerkError } = await supabase.functions.invoke('manage-clerk-user', {
        body: { 
          action: 'create', 
          userData: newUser
        }
      });

      if (clerkError || clerkData?.error) {
        throw new Error(clerkData?.error || 'Erro ao criar usuário no Clerk');
      }

      const clerk_user_id = clerkData.clerk_user_id;

      // 2. Salva no nosso banco
      const { error } = await supabase
        .from('usuarios_perfis')
        .insert([{
          nome: newUser.nome,
          email: newUser.email,
          perfil: newUser.perfil,
          clerk_user_id,
          curso: []
        }]);
      
      if (error) throw error;
      toast.success('Usuário e conta Clerk criados com sucesso!');
      setIsNewUserModalOpen(false);
      setNewUser({ nome: '', email: '', password: '', perfil: 'comercial' });
      fetchUsuarios();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar usuário.');
    } finally {
      setSubmittingNew(false);
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('usuarios_perfis')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Usuário atualizado!');
      
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch(err) {
      toast.error('Erro ao atualizar.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setSubmittingEdit(true);
    try {
      // 1. Atualiza no Clerk se houver Clerk ID
      if (editingUser.clerk_user_id) {
        await supabase.functions.invoke('manage-clerk-user', {
          body: { 
            action: 'update', 
            userId: editingUser.clerk_user_id,
            userData: { nome: editingUser.nome }
          }
        });
      }

      // 2. Atualiza no Supabase
      const { error } = await supabase
        .from('usuarios_perfis')
        .update({
          nome: editingUser.nome,
          email: editingUser.email,
          clerk_user_id: editingUser.clerk_user_id
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;

      toast.success('Usuário editado com sucesso!');
      setIsEditModalOpen(false);
      fetchUsuarios();
    } catch (err: any) {
      toast.error('Erro ao editar usuário.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteUser = async (id: string, clerkId?: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    setDeletingId(id);
    try {
      // 1. Deleta no Clerk via Edge Function
      if (clerkId) {
        await supabase.functions.invoke('manage-clerk-user', {
          body: { action: 'delete', userId: clerkId }
        });
      }

      // 2. Deleta no Supabase
      const { error } = await supabase
        .from('usuarios_perfis')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      toast.success('Usuário removido com sucesso!');
      setUsuarios(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      toast.error('Erro ao excluir usuário.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="section-gap animate-fade-in">
      <PageHeader 
        title="Gerenciamento de Usuários" 
        description="Atribua perfis de acesso aos usuários do sistema."
        action={
          <Button onClick={() => setIsNewUserModalOpen(true)} icon={<UserPlus size={18} />}>
            Novo Usuário
          </Button>
        }
      />

      <QuickGuide 
        storageKey="admin"
        title="Gestão de Usuários"
        icon={<Users className="text-brand-blue" size={24} />}
        steps={[
          { text: 'Use <strong>"Novo Usuário"</strong> para criar contas e definir o primeiro acesso.' },
          { text: 'Altere o <strong>Perfil Atual</strong> para definir o que o usuário pode ver no sistema.' },
          { text: 'Para <strong>Coordenadores</strong>, clique no botão de engrenagem para vincular seus cursos.' }
        ]}
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="text-[14px] font-bold text-amber-800">Dica de Administração</h4>
          <p className="text-[13px] text-amber-700 mt-1">
            Usuários devem fazer login no sistema pela primeira vez para aparecerem nesta lista caso você implemente um webhook do Clerk. 
            Como estamos em modo simples, você pode precisar inserir o <code>clerk_user_id</code> manualmente no banco para novos usuários se não houver trigger.
          </p>
        </div>
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>ID Clerk</Th>
            <Th>Usuário</Th>
            <Th>Perfil Atual</Th>
            <Th>Vínculo de Curso</Th>
            <Th align="right">Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr><Td colSpan={5} className="p-0"><TableSkeleton rows={4} cols={5} /></Td></Tr>
          ) : usuarios.length === 0 ? (
            <Tr>
              <Td colSpan={5} className="p-0">
                <EmptyState 
                  icon={<Users size={28} className="text-navy-400" />}
                  title="Nenhum usuário cadastrado" 
                  description="Não há usuários cadastrados na tabela usuarios_perfis."
                />
              </Td>
            </Tr>
          ) : (
            usuarios.map((u) => (
              <Tr key={u.id}>
                <Td>
                  <span className="font-mono text-[11px] bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">
                    {u.clerk_user_id}
                  </span>
                </Td>
                <Td>
                  <p className="font-bold text-navy-900">{u.nome || 'Não informado'}</p>
                  <p className="text-[12px] text-navy-500 font-medium">{u.email || 'Não informado'}</p>
                </Td>
                <Td>
                  <div className="w-48">
                    <Select 
                      options={[
                        { value: 'novo_usuario', label: 'Novo (Sem Acesso)' },
                        { value: 'comercial', label: 'Comercial' },
                        { value: 'diretor_unidade', label: 'Diretor de Unidade' },
                        { value: 'coordenador', label: 'Coordenador' },
                        { value: 'admin', label: 'Administrador' },
                      ]}
                      value={u.perfil}
                      onChange={(e) => handleUpdateUser(u.id, { perfil: e.target.value })}
                      disabled={updatingId === u.id}
                      className="h-10 text-[13px]"
                    />
                  </div>
                </Td>
                <Td>
                  {u.perfil === 'coordenador' ? (
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 px-3 border-navy-200 text-navy-600 hover:bg-navy-50"
                        onClick={() => { setCourseSelectionUser(u); setIsCourseModalOpen(true); }}
                      >
                        <Settings2 size={14} className="mr-2" />
                        {u.curso?.length || 0} cursos
                      </Button>
                      <div className="flex -space-x-2 overflow-hidden">
                        {u.curso?.slice(0, 2).map((c: string, i: number) => (
                          <div key={i} title={c} className="h-6 w-6 rounded-full bg-navy-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-navy-600 shrink-0 uppercase">
                            {c.substring(0, 2)}
                          </div>
                        ))}
                        {u.curso?.length > 2 && (
                          <div className="h-6 w-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500 shrink-0">
                            +{u.curso.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[12px] text-slate-400 italic px-3">Livre (Acesso Geral)</span>
                  )}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-navy-400 hover:text-navy-600 hover:bg-navy-50"
                      onClick={() => { setEditingUser(u); setIsEditModalOpen(true); }}
                      disabled={updatingId === u.id || deletingId === u.id}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteUser(u.id, u.clerk_user_id)}
                      disabled={updatingId === u.id || deletingId === u.id}
                    >
                      {deletingId === u.id ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {/* Modal de Seleção de Cursos */}
      <Modal
        isOpen={isCourseModalOpen}
        onClose={() => setIsCourseModalOpen(false)}
        title={`Vincular Cursos: ${courseSelectionUser?.nome || 'Coordenador'}`}
        description="Selecione todos os cursos que este coordenador poderá visualizar."
        size="lg"
      >
        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-1">
            {cursos.map(curso => {
              const isSelected = courseSelectionUser?.curso?.includes(curso);
              return (
                <button
                  key={curso}
                  onClick={() => {
                    const currentCourses = courseSelectionUser?.curso || [];
                    const newCourses = isSelected
                      ? currentCourses.filter((c: string) => c !== curso)
                      : [...currentCourses, curso];
                    setCourseSelectionUser({ ...courseSelectionUser, curso: newCourses });
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-sm' 
                      : 'border-slate-100 hover:border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-[12px] font-bold uppercase tracking-tight leading-tight pr-2">{curso}</span>
                  {isSelected ? <Check size={16} strokeWidth={3} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsCourseModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 bg-navy-900" 
              onClick={() => {
                handleUpdateUser(courseSelectionUser.id, { curso: courseSelectionUser.curso });
                setIsCourseModalOpen(false);
              }}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Novo Usuário */}
      <Modal
        isOpen={isNewUserModalOpen}
        onClose={() => !submittingNew && setIsNewUserModalOpen(false)}
        title="Cadastrar Novo Usuário"
        description="Adicione um usuário manualmente vinculando o ID do Clerk."
      >
        <form onSubmit={handleCreateUser} className="space-y-4 mt-2">
          <Input 
            label="Nome Completo"
            required
            value={newUser.nome}
            onChange={(e) => setNewUser({...newUser, nome: e.target.value})}
            placeholder="Ex: João Silva"
          />
          <Input 
            label="E-mail"
            type="email"
            required
            value={newUser.email}
            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            placeholder="joao@email.com"
          />
          <Input 
            label="Senha de Acesso"
            type="password"
            required
            value={newUser.password}
            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            placeholder="Mínimo 8 caracteres"
          />
          <Select 
            label="Perfil de Acesso"
            required
            value={newUser.perfil}
            onChange={(e) => setNewUser({...newUser, perfil: e.target.value})}
            options={[
              { value: 'comercial', label: 'Comercial' },
              { value: 'diretor_unidade', label: 'Diretor de Unidade' },
              { value: 'coordenador', label: 'Coordenador' },
              { value: 'admin', label: 'Administrador' },
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsNewUserModalOpen(false)} disabled={submittingNew}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" className="flex-1 bg-navy-900" isLoading={submittingNew}>
              Cadastrar
            </Button>
          </div>
        </form>
      </Modal>
      {/* Modal Editar Usuário */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => !submittingEdit && setIsEditModalOpen(false)}
        title="Editar Usuário"
        description="Atualize as informações cadastrais do usuário."
      >
        <form onSubmit={handleEditUser} className="space-y-4 mt-2">
          <Input 
            label="Nome Completo"
            required
            value={editingUser?.nome || ''}
            onChange={(e) => setEditingUser({...editingUser, nome: e.target.value})}
          />
          <Input 
            label="E-mail"
            type="email"
            required
            value={editingUser?.email || ''}
            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
          />
          <Input 
            label="ID do Clerk"
            value={editingUser?.clerk_user_id || ''}
            onChange={(e) => setEditingUser({...editingUser, clerk_user_id: e.target.value})}
            placeholder="user_..."
            description="Opcional. Vincule manualmente se necessário."
          />

          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsEditModalOpen(false)} disabled={submittingEdit}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" className="flex-1 bg-navy-900" isLoading={submittingEdit}>
              Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
