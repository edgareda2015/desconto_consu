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
import { Plus, FileText, Search, GraduationCap, AlertCircle, HelpCircle } from 'lucide-react';
import { QuickGuide } from '../components/ui/QuickGuide';
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
  const [cursosPrecos, setCursosPrecos] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nome: '',
    inscricao: '',
    cpf: '',
    curso: '',
    turno: '',
    modalidade: 'VES/ENE',
    mensalidade_atual: '',
    mensalidade_bruta: '',
    desc_percentual_atual: '',
    mensalidade_solicitada: '',
    desc_percentual_solicitado: '',
    unidade: 'OLINDA',
    regional: 'Regional A'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [solRes, unitRes, regRes, cursosRes] = await Promise.all([
        supabase.from('solicitacoes').select('*').order('created_at', { ascending: false }),
        supabase.from('units').select('*'),
        supabase.from('regionals').select('*'),
        supabase.from('cursos_precos').select('*').order('curso', { ascending: true })
      ]);
      
      if (solRes.error) throw solRes.error;
      setSolicitacoes(solRes.data || []);
      setUnits(unitRes.data || []);
      setRegionals(regRes.data || []);
      setCursosPrecos(cursosRes.data || []);
    } catch (err) {
      toast.error('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: any) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const turnosDisponiveis = formData.curso 
    ? Array.from(new Set(cursosPrecos.filter(c => c.curso === formData.curso).map(c => c.turno))).map(t => ({ value: t, label: t }))
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'curso' || name === 'turno' || name === 'modalidade') {
      const updatedFormData = { ...formData, [name]: value };
      
      if (name === 'curso') updatedFormData.turno = '';

      const cursoSel = name === 'curso' ? value : updatedFormData.curso;
      const turnoSel = name === 'turno' ? value : updatedFormData.turno;
      const modalidadeSel = name === 'modalidade' ? value : updatedFormData.modalidade;

      const matching = cursosPrecos.find(c => c.curso === cursoSel && c.turno === turnoSel);

      if (matching && cursoSel && turnoSel) {
        const isVes = modalidadeSel === 'VES/ENE';
        const cheia = parseFloat(matching.mensalidade_bruta);
        const descAtual = isVes ? matching.desc_percentual_ves_ene : matching.desc_percentual_trf_pdd;
        
        const liquida = cheia * (1 - descAtual);
        
        updatedFormData.mensalidade_bruta = cheia.toString();
        updatedFormData.mensalidade_atual = liquida.toString();
        updatedFormData.desc_percentual_atual = (descAtual * 100).toFixed(0);
        
        if (updatedFormData.desc_percentual_solicitado) {
          const dSolicitado = parseFloat(updatedFormData.desc_percentual_solicitado);
          if (!isNaN(dSolicitado)) {
            updatedFormData.mensalidade_solicitada = (cheia * (1 - dSolicitado / 100)).toFixed(2);
          }
        }
      } else {
        updatedFormData.mensalidade_atual = '';
        updatedFormData.desc_percentual_atual = '';
      }
      setFormData(updatedFormData);
    } else if (name === 'desc_percentual_solicitado') {
      const descPercent = parseFloat(value);
      const cheia = parseFloat(formData.mensalidade_bruta);
      let solicitada = '';
      if (!isNaN(descPercent) && !isNaN(cheia)) {
        solicitada = (cheia * (1 - descPercent / 100)).toFixed(2);
      }
      setFormData(prev => ({ ...prev, [name]: value, mensalidade_solicitada: solicitada }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedUnit = units.find(u => u.name === formData.unidade);
      const selectedReg = regionals.find(r => r.name === formData.regional);
      const payload = {
        ...formData,
        mensalidade_atual: parseFloat(formData.mensalidade_atual) || 0,
        desc_percentual_atual: parseFloat(formData.desc_percentual_atual) || 0,
        mensalidade_solicitada: parseFloat(formData.mensalidade_solicitada) || 0,
        desc_percentual_solicitado: parseFloat(formData.desc_percentual_solicitado) || 0,
        unit_id: selectedUnit?.id,
        regional_id: selectedReg?.id,
        consultor: user?.fullName || 'Consultor',
        user_id: user?.id,
        status: 'Aguardando análise',
        reprocessada: !!editingId
      };
      const { error } = editingId 
        ? await supabase.from('solicitacoes').update(payload).eq('id', editingId)
        : await supabase.from('solicitacoes').insert([payload]);
      if (error) throw error;
      toast.success(editingId ? 'Atualizado!' : 'Criado!');
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ 
        nome: '', inscricao: '', cpf: '', curso: '', turno: '', modalidade: 'VES/ENE',
        mensalidade_atual: '', mensalidade_bruta: '', desc_percentual_atual: '', 
        mensalidade_solicitada: '', desc_percentual_solicitado: '', 
        unidade: 'OLINDA', regional: 'Regional A' 
      });
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (req: any) => {
    setEditingId(req.id);
    setRejectionMessage(req.motivo_indeferimento);
    setFormData({
      nome: req.nome || '',
      inscricao: req.inscricao || '',
      cpf: req.cpf || '',
      curso: req.curso || '',
      turno: req.turno || '',
      modalidade: req.modalidade || 'VES/ENE',
      mensalidade_atual: req.mensalidade_atual?.toString() || '',
      mensalidade_bruta: req.mensalidade_bruta?.toString() || '',
      desc_percentual_atual: req.desc_percentual_atual?.toString() || '',
      mensalidade_solicitada: req.mensalidade_solicitada?.toString() || '',
      desc_percentual_solicitado: req.desc_percentual_solicitado?.toString() || '',
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
        action={<Button onClick={() => setIsModalOpen(true)} icon={<Plus size={18} />}>Nova Solicitação</Button>}
      />

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" placeholder="Buscar..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Table>
        <Thead>
          <Tr>
            <Th>Inscrição</Th><Th>Nome</Th><Th>Curso</Th><Th>Mens. Atual</Th><Th>Desc. % Atual</Th>
            <Th>Mens. Solicitada</Th><Th>Desc. % Solicitado</Th><Th>Status</Th><Th align="right">Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? <Tr><Td colSpan={9}><TableSkeleton rows={5} cols={9} /></Td></Tr> : 
            filteredData.map((req) => (
              <Tr key={req.id} className={getRowColorClass(req.status, req.reprocessada)}>
                <Td>{req.inscricao}</Td><Td className="font-bold">{req.nome}</Td><Td>{req.curso}</Td>
                <Td>{formatCurrency(req.mensalidade_atual)}</Td><Td align="center">{req.desc_percentual_atual}%</Td>
                <Td className="font-bold text-brand-blue">{formatCurrency(req.mensalidade_solicitada)}</Td>
                <Td align="center">{req.desc_percentual_solicitado}%</Td><Td><StatusBadge status={req.status} /></Td>
                <Td align="right">
                  {req.status === 'Indeferido' && <Button size="sm" variant="outline" onClick={() => handleEdit(req)}>Editar</Button>}
                </Td>
              </Tr>
            ))
          }
        </Tbody>
      </Table>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Solicitação" : "Nova Solicitação de Desconto"} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-navy-900 border-l-4 border-brand-red pl-3">Dados do Aluno</h4>
              <Input label="Nome Completo" required name="nome" value={formData.nome} onChange={handleInputChange} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Inscrição" required name="inscricao" value={formData.inscricao} onChange={handleInputChange} />
                <Input label="CPF/Matricula" required name="cpf" value={formData.cpf} onChange={handleInputChange} />
              </div>
              <Select 
                label="Curso" required name="curso" value={formData.curso} onChange={handleInputChange} 
                options={Array.from(new Set(cursosPrecos.map(c => c.curso))).map(c => ({ value: c, label: c }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Turno" required name="turno" value={formData.turno} onChange={handleInputChange} options={turnosDisponiveis} disabled={!formData.curso} />
                <Select label="Modalidade Ingresso" required name="modalidade" value={formData.modalidade} onChange={handleInputChange} options={[{value:'VES/ENE', label:'VES/ENE'}, {value:'TRF/PDD', label:'TRF/PDD'}]} />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[14px] font-bold text-navy-900 border-l-4 border-brand-blue pl-3">Localização e Mensalidades</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Mensalidade Atual (Cheio - Desc)" value={formatCurrency(formData.mensalidade_atual)} readOnly className="bg-slate-50 font-bold" />
                <Input label="Desc. % Atual" value={(formData.desc_percentual_atual || '0') + '%'} readOnly className="bg-slate-50 font-bold" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Mensalidade Solicitada" value={formatCurrency(formData.mensalidade_solicitada)} readOnly className="bg-emerald-50 text-emerald-700 font-bold border-emerald-200" />
                <Input label="Desc. % Solicitado" required type="number" name="desc_percentual_solicitado" value={formData.desc_percentual_solicitado} onChange={handleInputChange} placeholder="Ex: 65" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={submitting}>Enviar Solicitação</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
