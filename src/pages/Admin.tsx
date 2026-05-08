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
import { Card } from '../components/ui/Card';
import { 
  Save, Users, AlertCircle, Settings2, Check, X, Plus, 
  UserPlus, Trash2, Edit2, HelpCircle, Upload, Database, 
  Loader2, GraduationCap, FileText
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { QuickGuide } from '../components/ui/QuickGuide';
import toast from 'react-hot-toast';
import { cn } from '../lib/cn';

export default function Admin() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'cursos' | 'precos'>('usuarios');
  const [isImporting, setIsImporting] = useState(false);
  const [importStats, setImportStats] = useState<{ total: number; success: number } | null>(null);
  const [pendingData, setPendingData] = useState<any[] | null>(null);

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

  const cursos_lista_fixa = [
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Lendo planilha...');
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const bstr = e.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error('Planilha vazia ou inválida.', { id: toastId });
          return;
        }

        // Mapear dados
        const mapped = data.map((row: any) => ({
          marca: row['Marca'],
          unidade: row['Unidade'],
          curso: row['Curso'],
          semestres: row['Semestres'],
          turno: row['Turno'],
          mensalidade_bruta: row[' Mensalidade\r\ndia 30 (R$) '] || row['Mensalidade dia 30 (R$)'],
          desc_percentual_ves_ene: row['Desc. %\r\nVES/ENE'] || row['Desc. % VES/ENE'],
          mensalidade_ves_ene: row[' Demais Mens. (R$)\r\nVES/ENE '] || row['Demais Mens. (R$) VES/ENE'],
          desc_percentual_trf_pdd: row['Desc.%\r\nTRF/PDD'] || row['Desc.% TRF/PDD'],
          mensalidade_trf_pdd: row[' Demais Mens. (R$)\r\nTRF/PDD '] || row['Demais Mens. (R$) TRF/PDD'],
          updated_at: new Date().toISOString()
        }));

        setPendingData(mapped);
        toast.success(`Planilha pronta! ${mapped.length} cursos detectados.`, { id: toastId });
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      toast.error('Erro ao ler arquivo.', { id: toastId });
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingData) return;
    setIsImporting(true);
    setImportStats(null);
    const toastId = toast.loading('Limpando banco e enviando novos dados...');

    try {
      // 1. Limpar a tabela antes de inserir os novos (Refresh Total)
      const { error: deleteError } = await supabase
        .from('cursos_precos')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo

      if (deleteError) throw deleteError;

      // 2. Inserir os novos dados
      const { error: insertError } = await supabase
        .from('cursos_precos')
        .insert(pendingData);

      if (insertError) throw insertError;

      setImportStats({ total: pendingData.length, success: pendingData.length });
      setPendingData(null);
      toast.success(`Sucesso! ${pendingData.length} cursos atualizados.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar banco de dados.', { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingNew(true);
    try {
      const { data: clerkData, error: clerkError } = await supabase.functions.invoke('manage-clerk-user', {
        body: { action: 'create', userData: newUser }
      });

      if (clerkError || clerkData?.error) throw new Error(clerkData?.error || 'Erro no Clerk');

      const { error } = await supabase
        .from('usuarios_perfis')
        .insert([{
          nome: newUser.nome,
          email: newUser.email,
          perfil: newUser.perfil,
          clerk_user_id: clerkData.clerk_user_id,
          curso: []
        }]);
      
      if (error) throw error;
      toast.success('Usuário criado!');
      setIsNewUserModalOpen(false);
      setNewUser({ nome: '', email: '', password: '', perfil: 'comercial' });
      fetchUsuarios();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cadastrar.');
    } finally {
      setSubmittingNew(false);
    }
  };

  const handleUpdateUser = async (id: string, updates: any) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase.from('usuarios_perfis').update(updates).eq('id', id);
      if (error) throw error;
      toast.success('Atualizado!');
      setUsuarios(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    } catch(err) {
      toast.error('Erro ao atualizar.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (id: string, clerkId?: string) => {
    if (!confirm('Excluir usuário permanentemente?')) return;
    setDeletingId(id);
    try {
      if (clerkId) await supabase.functions.invoke('manage-clerk-user', { body: { action: 'delete', userId: clerkId } });
      const { error } = await supabase.from('usuarios_perfis').delete().eq('id', id);
      if (error) throw error;
      toast.success('Removido!');
      setUsuarios(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      toast.error('Erro ao excluir.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="section-gap animate-fade-in">
      <PageHeader 
        title="Painel Administrativo" 
        description="Gestão de acesso e atualização de tabelas de preços."
        action={
          <Button onClick={() => setIsNewUserModalOpen(true)} icon={<UserPlus size={18} />}>
            Novo Usuário
          </Button>
        }
      />

      <div className="mb-8">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-full w-fit">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold transition-all",
              activeTab === 'usuarios' ? "bg-navy-900 text-white shadow-md" : "text-navy-500 hover:bg-navy-50"
            )}
          >
            <Users size={18} /> Usuários
          </button>
          <button
            onClick={() => setActiveTab('precos')}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-full text-[14px] font-bold transition-all",
              activeTab === 'precos' ? "bg-navy-900 text-white shadow-md" : "text-navy-500 hover:bg-navy-50"
            )}
          >
            <Database size={18} /> Importar Preços
          </button>
        </div>
      </div>

      {activeTab === 'precos' ? (
        <Card padding="lg" className="animate-fade-in">
          <div className="flex flex-col items-center text-center py-12 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-navy-50 rounded-3xl flex items-center justify-center text-navy-600 mb-6 shadow-sm border border-navy-100">
              <Database size={40} />
            </div>
            <h2 className="text-[24px] font-black text-navy-900 mb-3 uppercase tracking-tight">Atualização de Preços Mensal</h2>
            <p className="text-[15px] text-navy-500 mb-10 leading-relaxed font-medium">
              Suba a planilha oficial do mês para atualizar automaticamente os valores de mensalidade da UNINASSAU Olinda.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-10">
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-left">
                <div className="flex items-center gap-3 mb-2 text-navy-900 font-bold text-[14px]">
                  <Check size={18} className="text-brand-blue" /> Colunas Aceitas
                </div>
                <p className="text-[12px] text-slate-500 font-medium">
                  Marca, Unidade, Curso, Turno, Mensalidade dia 30, Desc. % VES/ENE, Desc.% TRF/PDD.
                </p>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm text-left">
                <div className="flex items-center gap-3 mb-2 text-navy-900 font-bold text-[14px]">
                  <AlertCircle size={18} className="text-amber-500" /> Formato do Arquivo
                </div>
                <p className="text-[12px] text-slate-500 font-medium">
                  Apenas <strong>.XLSX</strong> ou <strong>.XLS</strong>. O sistema faz a limpeza total antes de inserir.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
              {!pendingData ? (
                <label className="relative cursor-pointer group w-full">
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileSelect} />
                  <div className="flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black text-[16px] transition-all shadow-xl bg-white border-2 border-dashed border-navy-200 text-navy-600 hover:border-navy-900 hover:text-navy-900">
                    <Upload size={24} />
                    SELECIONAR ARQUIVO EXCEL
                  </div>
                </label>
              ) : (
                <div className="w-full space-y-4 animate-fade-in">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-blue-900 font-bold text-[14px]">
                      <FileText size={20} />
                      {pendingData.length} cursos detectados na planilha
                    </div>
                    <button onClick={() => setPendingData(null)} className="text-blue-500 hover:text-blue-700">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <Button 
                    onClick={handleConfirmImport} 
                    isLoading={isImporting} 
                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[18px] shadow-2xl"
                  >
                    {!isImporting && <Save size={24} className="mr-2" />}
                    ENVIAR E ATUALIZAR PLANILHA AGORA
                  </Button>
                  
                  <p className="text-[11px] text-red-500 font-bold uppercase tracking-widest">
                    ⚠️ Atenção: Ao clicar, os preços antigos serão apagados.
                  </p>
                </div>
              )}
            </div>

            {importStats && (
              <div className="mt-8 text-[14px] font-bold text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-bounce">
                ✓ {importStats.success} registros processados!
              </div>
            )}
          </div>
        </Card>
      ) : (
        <>
          <QuickGuide 
            storageKey="admin"
            title="Gestão de Usuários"
            icon={<Users className="text-brand-blue" size={24} />}
            steps={[
              { text: 'Gerencie os perfis de acesso (Comercial, Diretor, Coordenador).' },
              { text: 'Vincule cursos específicos para cada Coordenador.' }
            ]}
          />

          <Table>
            <Thead><Tr><Th>Usuário</Th><Th>Perfil</Th><Th>Cursos Vinculados</Th><Th align="right">Ações</Th></Tr></Thead>
            <Tbody>
              {loading ? <Tr><Td colSpan={4}><TableSkeleton rows={3} cols={4} /></Td></Tr> : 
                usuarios.map(u => (
                  <Tr key={u.id}>
                    <Td>
                      <p className="font-bold text-navy-900">{u.nome}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                    </Td>
                    <Td>
                      <Select 
                        options={[
                          { value: 'comercial', label: 'Comercial' },
                          { value: 'diretor_unidade', label: 'Diretor' },
                          { value: 'coordenador', label: 'Coordenador' },
                          { value: 'admin', label: 'Admin' }
                        ]}
                        value={u.perfil}
                        onChange={(e) => handleUpdateUser(u.id, { perfil: e.target.value })}
                        className="h-9 text-[12px]"
                      />
                    </Td>
                    <Td>
                      {u.perfil === 'coordenador' ? (
                        <Button variant="outline" size="sm" onClick={() => { setCourseSelectionUser(u); setIsCourseModalOpen(true); }}>
                          <Settings2 size={14} className="mr-2" /> {u.curso?.length || 0} cursos
                        </Button>
                      ) : <span className="text-slate-300 text-[11px]">Acesso Geral</span>}
                    </Td>
                    <Td align="right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingUser(u); setIsEditModalOpen(true); }}><Edit2 size={14} /></Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDeleteUser(u.id, u.clerk_user_id)}><Trash2 size={14} /></Button>
                      </div>
                    </Td>
                  </Tr>
                ))
              }
            </Tbody>
          </Table>
        </>
      )}

      {/* MODALS */}
      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title="Vincular Cursos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto p-1 mt-4">
          {cursos_lista_fixa.map(c => {
            const isSel = courseSelectionUser?.curso?.includes(c);
            return (
              <button key={c} onClick={() => {
                const list = isSel ? courseSelectionUser.curso.filter((i:any) => i !== c) : [...(courseSelectionUser.curso || []), c];
                setCourseSelectionUser({...courseSelectionUser, curso: list});
              }} className={cn("text-left p-3 rounded-xl border-2 text-[11px] font-bold", isSel ? "border-brand-blue bg-blue-50 text-brand-blue" : "border-slate-100")}>
                {c}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-6">
          <Button className="flex-1" onClick={() => { handleUpdateUser(courseSelectionUser.id, { curso: courseSelectionUser.curso }); setIsCourseModalOpen(false); }}>Salvar</Button>
        </div>
      </Modal>

      <Modal isOpen={isNewUserModalOpen} onClose={() => setIsNewUserModalOpen(false)} title="Novo Usuário">
        <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
          <Input label="Nome" required value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} />
          <Input label="E-mail" type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
          <Input label="Senha" type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
          <Button type="submit" isLoading={submittingNew} className="w-full">Criar Conta</Button>
        </form>
      </Modal>
    </div>
  );
}
