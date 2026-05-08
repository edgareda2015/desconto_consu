import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge, getRowColorClass } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { Plus, FileText, Search, Hash, MapPin, Building2, GraduationCap, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Comercial() {
  const { user } = useUser();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [regionals, setRegionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const cursos = [
    'ADMINISTRAÇÃO', 'ANÁLISE E DESENVOLVIMENTO DE SISTEMAS', 
    'BIOMEDICINA', 'CIÊNCIA DA COMPUTAÇÃO', 'CIÊNCIAS CONTÁBEIS', 
    'DIREITO', 'DISCIPLINA ISOLADA', 'ENFERMAGEM', 'FARMÁCIA', 
    'FISIOTERAPIA', 'NUTRIÇÃO', 'ODONTOLOGIA', 'PEDAGOGIA', 
    'PSICOLOGIA', 'SERVIÇO SOCIAL', 'SISTEMAS DE INFORMAÇÃO', 
    'TERAPIA OCUPACIONAL'
  ];

  // Form state
  const [formData, setFormData] = useState({
    nome: '',
    inscricao: '',
    cpf: '',
    curso: '',
    mensalidade_atual: '',
    desc_percentual_atual: '',
    mensalidade_solicitada: '',
    desc_percentual_solicitado: '',
    numero_chamado: '',
    unidade: 'OLINDA',
    regional: 'Regional A'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [solRes, unitRes, regRes] = await Promise.all([
        supabase.from('solicitacoes').select('*').order('created_at', { ascending: false }),
        supabase.from('units').select('*'),
        supabase.from('regionals').select('*')
      ]);
      
      if (solRes.error) throw solRes.error;
      setSolicitacoes(solRes.data || []);
      setUnits(unitRes.data || []);
      setRegionals(regRes.data || []);
    } catch (err) {
      toast.error('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedUnit = units.find(u => u.name === formData.unidade);
      const selectedReg = regionals.find(r => r.name === formData.regional);

      const payload: any = {
        nome: formData.nome,
        inscricao: formData.inscricao,
        cpf: formData.cpf,
        curso: formData.curso,
        mensalidade_atual: formData.mensalidade_atual ? parseFloat(formData.mensalidade_atual) : null,
        desc_percentual_atual: formData.desc_percentual_atual ? parseFloat(formData.desc_percentual_atual) : 0,
        mensalidade_solicitada: formData.mensalidade_solicitada ? parseFloat(formData.mensalidade_solicitada) : null,
        desc_percentual_solicitado: formData.desc_percentual_solicitado ? parseFloat(formData.desc_percentual_solicitado) : 0,
        numero_chamado: formData.numero_chamado || null,
        unidade: formData.unidade,
        regional: formData.regional,
        unit_id: selectedUnit?.id,
        regional_id: selectedReg?.id,
        consultor: user?.fullName || 'Comercial',
        user_id: user?.id,
        status: 'Aguardando análise',
        motivo_indeferimento: null // Limpa o motivo ao reenviar
      };

      if (editingId) {
        payload.reprocessada = true;
        const { error } = await supabase.from('solicitacoes').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Solicitação corrigida e reenviada!');
      } else {
        payload.reprocessada = false;
        const { error } = await supabase.from('solicitacoes').insert([payload]);
        if (error) throw error;
        toast.success('Solicitação criada com sucesso!');
      }

      setIsModalOpen(false);
      setEditingId(null);
      setRejectionMessage(null);
      setFormData({ 
        nome: '', inscricao: '', cpf: '', curso: '', 
        mensalidade_atual: '', desc_percentual_atual: '', 
        mensalidade_solicitada: '', desc_percentual_solicitado: '', 
        numero_chamado: '', unidade: 'OLINDA', regional: 'Regional A' 
      });
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar solicitação.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (req: any) => {
    setEditingId(req.id);
    setRejectionMessage(req.motivo_indeferimento);
    setFormData({
      nome: req.nome,
      inscricao: req.inscricao,
      cpf: req.cpf,
      curso: req.curso,
      mensalidade_atual: req.mensalidade_atual?.toString() || '',
      desc_percentual_atual: req.desc_percentual_atual?.toString() || '',
      mensalidade_solicitada: req.mensalidade_solicitada?.toString() || '',
      desc_percentual_solicitado: req.desc_percentual_solicitado?.toString() || '',
      numero_chamado: req.numero_chamado || '',
      unidade: req.unidade || 'OLINDA',
      regional: req.regional || 'Regional A'
    });
    setIsModalOpen(true);
  };

  const filteredData = solicitacoes.filter(req => 
    req.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.cpf?.includes(searchTerm) || 
    req.inscricao?.includes(searchTerm)
  );

  return (
    <div className="section-gap animate-fade-in">
      <PageHeader 
        title="Minhas Solicitações" 
        description="Gerencie e acompanhe os pedidos de desconto acadêmico."
        action={
          <Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>
            Nova Solicitação
          </Button>
        }
      />

      {solicitacoes.filter(r => r.status === 'Indeferido').length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 p-5 rounded-2xl mb-8 flex items-start gap-4 animate-fade-in shadow-sm">
          <div className="bg-red-100 p-2 rounded-xl">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-red-900 font-black text-[16px] mb-1">Ações Necessárias: Solicitações Indeferidas</h3>
            <p className="text-red-700 text-[13px] font-bold leading-relaxed">
              As solicitações dos seguintes alunos foram recusadas e precisam ser corrigidas agora:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {solicitacoes.filter(r => r.status === 'Indeferido').map(r => (
                <span key={r.id} className="bg-white/80 border border-red-200 text-red-800 text-[11px] font-black px-3 py-1 rounded-full shadow-sm">
                  {r.nome?.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text"
          placeholder="Buscar por nome, CPF ou inscrição..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue shadow-sm transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Inscrição</Th>
            <Th>CPF/Matricula</Th>
            <Th>Nome</Th>
            <Th>Curso</Th>
            <Th>Mens. Atual</Th>
            <Th>Desc. % Atual</Th>
            <Th>Mens. Solicitada</Th>
            <Th>Desc. % Solicitado</Th>
            <Th>Data</Th>
             <Th>Consultor</Th>
             <Th>Chamado</Th>
             <Th>Status</Th>
             <Th align="right">Ações</Th>
           </Tr>
         </Thead>
         <Tbody>
           {loading ? (
             <Tr><Td colSpan={13} className="p-0"><TableSkeleton rows={6} cols={13} /></Td></Tr>
           ) : filteredData.length === 0 ? (
             <Tr>
               <Td colSpan={13} className="p-0">
                 <EmptyState 
                   icon={<FileText size={28} className="text-navy-400" />}
                   title="Nenhuma solicitação" 
                   description="Clique em 'Nova Solicitação' para começar."
                 />
               </Td>
             </Tr>
           ) : (
             filteredData.map((req) => (
               <Tr key={req.id} className={getRowColorClass(req.status, req.reprocessada)}>
                 <Td><span className="font-semibold text-navy-800 whitespace-nowrap">{req.inscricao}</span></Td>
                 <Td><span className="text-slate-600 font-medium whitespace-nowrap">{req.cpf}</span></Td>
                 <Td>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-900 whitespace-nowrap">{req.nome}</span>
                      {req.reprocessada && (
                        <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-amber-200">REENVIADO</span>
                      )}
                    </div>
                 </Td>
                 <Td><span className="text-slate-700 whitespace-nowrap">{req.curso}</span></Td>
                 <Td>
                   <span className="text-slate-600 whitespace-nowrap">
                     {req.mensalidade_atual ? `R$ ${req.mensalidade_atual.toFixed(2)}` : '—'}
                   </span>
                 </Td>
                 <Td align="center">
                   <span className="font-bold text-brand-red">{req.desc_percentual_atual}%</span>
                 </Td>
                 <Td>
                   <span className="text-slate-600 whitespace-nowrap">
                     {req.mensalidade_solicitada ? `R$ ${req.mensalidade_solicitada.toFixed(2)}` : '—'}
                   </span>
                 </Td>
                 <Td align="center">
                   <span className="font-bold text-brand-blue">{req.desc_percentual_solicitado}%</span>
                 </Td>
                 <Td className="text-navy-500 font-medium whitespace-nowrap">
                   {new Date(req.data_solicitacao).toLocaleDateString('pt-BR')}
                 </Td>
                 <Td><span className="text-[10px] text-navy-500 uppercase font-semibold whitespace-nowrap">{req.consultor}</span></Td>
                 <Td><span className="text-slate-500 font-medium whitespace-nowrap">{req.numero_chamado || '—'}</span></Td>
                 <Td><StatusBadge status={req.status} /></Td>
                 <Td align="right">
                    {req.status === 'Indeferido' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(req)}
                        className="h-8 border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        Editar
                      </Button>
                    )}
                 </Td>
               </Tr>
             ))
           )}
         </Tbody>
      </Table>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          if (!submitting) {
            setIsModalOpen(false);
            setEditingId(null);
            setRejectionMessage(null);
          }
        }} 
        title={editingId ? "Editar Solicitação" : "Nova Solicitação de Desconto"}
        description={editingId ? "Corrija os dados conforme o motivo do indeferimento." : "Preencha todos os campos obrigatórios para enviar a solicitação para análise."}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {rejectionMessage && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-[var(--radius-lg)] flex gap-3 animate-fade-in">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-[13px] font-bold text-red-900 mb-0.5">Motivo do Indeferimento</p>
                <p className="text-[12px] text-red-700 leading-relaxed font-medium">{rejectionMessage}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-navy-900 border-l-4 border-brand-red pl-3">Dados do Aluno</h4>
              <Input 
                label="Nome Completo" 
                required 
                name="nome" 
                value={formData.nome} 
                onChange={handleInputChange} 
                placeholder="Nome do aluno"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Inscrição" 
                  required 
                  name="inscricao" 
                  value={formData.inscricao} 
                  onChange={handleInputChange} 
                  placeholder="00000000"
                />
                <Input 
                  label="CPF/Matricula" 
                  required 
                  name="cpf" 
                  value={formData.cpf} 
                  onChange={handleInputChange} 
                  placeholder="000.000.000-00"
                />
              </div>
              <Select 
                label="Curso" 
                required 
                name="curso" 
                value={formData.curso} 
                onChange={handleInputChange} 
                options={cursos.map(c => ({ value: c, label: c }))}
                placeholder="Selecione o curso..."
                icon={<GraduationCap size={16} />}
              />
              <Input 
                label="Nº do Chamado" 
                name="numero_chamado" 
                value={formData.numero_chamado} 
                onChange={handleInputChange} 
                placeholder="CH-00000"
                icon={<Hash size={16} />}
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-navy-900 border-l-4 border-brand-blue pl-3">Localização e Mensalidades</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select 
                  label="Regional" 
                  required 
                  name="regional" 
                  value={formData.regional} 
                  onChange={handleInputChange} 
                  options={regionals.length > 0 ? regionals.map(r => ({ value: r.name, label: r.name })) : [{ value: 'Regional A', label: 'Regional A' }]}
                  disabled={regionals.length <= 1}
                />
                <Select 
                  label="Unidade" 
                  required 
                  name="unidade" 
                  value={formData.unidade} 
                  onChange={handleInputChange} 
                  options={units.length > 0 ? units.map(u => ({ value: u.name, label: u.name })) : [{ value: 'OLINDA', label: 'OLINDA' }]}
                  disabled={units.length <= 1}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Mensalidade Atual" 
                  type="number" 
                  name="mensalidade_atual" 
                  value={formData.mensalidade_atual} 
                  onChange={handleInputChange} 
                  placeholder="R$ 0,00"
                />
                <Input 
                  label="Desc. % Atual" 
                  required 
                  type="number" 
                  name="desc_percentual_atual" 
                  value={formData.desc_percentual_atual} 
                  onChange={handleInputChange} 
                  placeholder="%"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Mensalidade Solicitada" 
                  type="number" 
                  name="mensalidade_solicitada" 
                  value={formData.mensalidade_solicitada} 
                  onChange={handleInputChange} 
                  placeholder="R$ 0,00"
                />
                <Input 
                  label="Desc. % Solicitado" 
                  required 
                  type="number" 
                  name="desc_percentual_solicitado" 
                  value={formData.desc_percentual_solicitado} 
                  onChange={handleInputChange} 
                  placeholder="%"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={submitting} className="px-8 shadow-md">
              Enviar Solicitação
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
