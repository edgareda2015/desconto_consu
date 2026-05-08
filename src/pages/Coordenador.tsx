import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { StatusBadge, getRowColorClass } from '../components/ui/Badge';
import { useAppAuth } from '../contexts/AuthContext';
import { Modal } from '../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { FileText, CheckCircle, XCircle, Send, AlertCircle, Ticket } from 'lucide-react';
import { QuickGuide } from '../components/ui/QuickGuide';
import toast from 'react-hot-toast';

export default function Coordenador() {
  const { perfil: userProfile } = useAppAuth();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [motivos, setMotivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de ação
  const [actionId, setActionId] = useState<string | null>(null);
  const [chamadoModalOpen, setChamadoModalOpen] = useState(false);
  const [tempChamado, setTempChamado] = useState('');
  
  // Modal de PDF
  const [isPdfModalOpen, setPdfModalOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);

  // Modal de Indeferimento
  const [isIndefModalOpen, setIndefModalOpen] = useState(false);
  const [selectedMotivoId, setSelectedMotivoId] = useState('');
  const [outroMotivo, setOutroMotivo] = useState('');
  const [submittingIndef, setSubmittingIndef] = useState(false);

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    try {
      // Busca solicitações Liberadas ou em Chamado Aberto
      let query = supabase
        .from('solicitacoes')
        .select('*')
        .in('status', ['Liberado para coordenação', 'Chamado aberto']);
      
      // Filtro de segurança para coordenadores
      if (userProfile?.perfil === 'coordenador') {
        if (Array.isArray(userProfile?.curso) && userProfile.curso.length > 0) {
          query = query.in('curso', userProfile.curso);
        } else {
          // Se for coordenador mas não tiver curso vinculado, não deve ver nada
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data: solData, error: solError } = await query.order('updated_at', { ascending: false });
      
      if (solError) throw solError;
      setSolicitacoes(solData || []);

      // Busca motivos de indeferimento
      const { data: motData, error: motError } = await supabase
        .from('motivos_indeferimento')
        .select('*')
        .eq('ativo', true);
      
      if (motError) throw motError;
      setMotivos(motData || []);
    } catch (err) {
      toast.error('Erro ao carregar dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChamadoChange = (id: string, value: string) => {
    setChamadoInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleAbrirChamado = async () => {
    if (!tempChamado) {
      toast.error('Informe o número do chamado.');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'Chamado aberto', numero_chamado: tempChamado })
        .eq('id', actionId);
      
      if (error) throw error;
      toast.success('Chamado aberto com sucesso!');
      setChamadoModalOpen(false);
      setTempChamado('');
      setActionId(null);
      fetchDados();
    } catch (err) {
      toast.error('Erro ao abrir chamado.');
    }
  };

  const handleDeferir = async (id: string) => {
    setActionId(id);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'Deferido' })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Solicitação Deferida com sucesso!');
      fetchDados();
    } catch (err) {
      toast.error('Erro ao deferir.');
    } finally {
      setActionId(null);
    }
  };

  const handleIndeferirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMotivoId && !outroMotivo) {
      toast.error('Selecione ou digite um motivo.');
      return;
    }

    setSubmittingIndef(true);
    try {
      let textoMotivo = '';
      if (selectedMotivoId) {
        const m = motivos.find(x => x.id === selectedMotivoId);
        textoMotivo = m?.motivo || '';
        if (textoMotivo.includes('Outro') && outroMotivo) {
          textoMotivo = outroMotivo;
        }
      } else {
        textoMotivo = outroMotivo;
      }

      const { error } = await supabase
        .from('solicitacoes')
        .update({ status: 'Indeferido', motivo_indeferimento: textoMotivo })
        .eq('id', actionId);
      
      if (error) throw error;
      
      toast.success('Solicitação Indeferida.');
      setIndefModalOpen(false);
      setActionId(null);
      fetchDados();
    } catch (err) {
      toast.error('Erro ao indeferir.');
    } finally {
      setSubmittingIndef(false);
    }
  };

  return (
    <div className="section-gap animate-fade-in">
      <PageHeader 
        title="Aprovação da Coordenação" 
        description="Analise os pareceres recebidos e tome a decisão final para o fluxo de descontos."
      />

      <QuickGuide 
        storageKey="coordenador"
        title="Instruções da Coordenação"
        icon={<Ticket className="text-brand-blue" size={24} />}
        steps={[
          { text: 'Clique em <strong>"Ver PDF"</strong> e depois no ícone de <strong>disquete (Salvar)</strong> para baixar o parecer do professor.' },
          { text: 'Com o PDF em mãos, abra o chamado no sistema e depois clique em <strong>"Abrir Chamado"</strong> aqui para registrar o número.' },
          { text: 'Após registrar o chamado, finalize a solicitação decidindo pelo <strong>Deferimento</strong> ou <strong>Indeferimento</strong>.' }
        ]}
      />

      <Table>
        <Thead>
          <Tr>
            <Th>Aluno</Th>
            <Th>Status</Th>
            <Th>Parecer / Chamado</Th>
            <Th align="right">Ações Finais</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr><Td colSpan={4} className="p-0"><TableSkeleton rows={4} cols={4} /></Td></Tr>
          ) : solicitacoes.length === 0 ? (
            <Tr>
              <Td colSpan={4} className="p-0">
                <EmptyState 
                  icon={<CheckCircle size={28} className="text-navy-400" />}
                  title="Tudo limpo por aqui" 
                  description="Nenhuma solicitação pendente de aprovação ou com chamado aberto no momento."
                />
              </Td>
            </Tr>
          ) : (
            solicitacoes.map((s) => (
              <Tr key={s.id} className={getRowColorClass(s.status, s.reprocessada)}>
                <Td>
                  <p className="font-bold text-navy-900">{s.nome}</p>
                  <p className="text-[12px] text-navy-500 font-medium">{s.curso} | Desc: {s.desc_percentual_solicitado}%</p>
                </Td>
                <Td>
                  <StatusBadge status={s.status} />
                </Td>
                <Td>
                  <div className="flex flex-col gap-3">
                    {s.pdf_url && (
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="w-fit"
                        onClick={() => { setActivePdfUrl(s.pdf_url); setPdfModalOpen(true); }}
                        icon={<FileText size={14} />}
                      >
                        Ver PDF
                      </Button>
                    )}
                    
                    {s.status === 'Liberado para coordenação' && (
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Button 
                          size="sm" 
                          variant="primary"
                          className="bg-navy-900 text-white"
                          onClick={() => { setActionId(s.id); setChamadoModalOpen(true); }}
                        >
                          <Ticket size={14} className="mr-1.5" /> Abrir Chamado
                        </Button>
                      </div>
                    )}
                    {s.status === 'Chamado aberto' && (
                      <span className="text-[13px] font-bold text-navy-700 bg-navy-50 px-3 py-1 rounded-full border border-slate-200 inline-block w-fit">
                        Chamado: {s.numero_chamado}
                      </span>
                    )}
                  </div>
                </Td>
                <Td align="right">
                  {s.status === 'Chamado aberto' && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => handleDeferir(s.id)}
                        isLoading={actionId === s.id}
                        icon={<CheckCircle size={16} />}
                      >
                        Deferir
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => { setActionId(s.id); setIndefModalOpen(true); }}
                        disabled={actionId === s.id}
                        icon={<XCircle size={16} />}
                      >
                        Indeferir
                      </Button>
                    </div>
                  )}
                  {s.status !== 'Chamado aberto' && (
                    <span className="text-[12px] text-navy-400 font-medium">
                      Aguardando chamado
                    </span>
                  )}
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {/* Modal PDF */}
      <Modal 
        isOpen={isPdfModalOpen} 
        onClose={() => setPdfModalOpen(false)} 
        title="Parecer do Professor" 
        size="full"
      >
        <div className="w-full h-[75vh] mt-2 border border-slate-200 rounded-2xl overflow-hidden bg-navy-50">
          {activePdfUrl ? (
            <iframe src={activePdfUrl} className="w-full h-full border-0" title="PDF viewer" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-navy-500">
              <AlertCircle size={32} className="mb-2 text-navy-400" />
              <p>Arquivo PDF não disponível ou link quebrado.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Abrir Chamado */}
      <Modal 
        isOpen={chamadoModalOpen} 
        onClose={() => setChamadoModalOpen(false)} 
        title="Número do Chamado"
        description="Informe o número do chamado aberto no sistema para esta solicitação."
      >
        <div className="space-y-5 mt-2">
          <div>
            <label className="block text-[13px] font-semibold text-navy-900 mb-2">Número do Chamado *</label>
            <Input 
              autoFocus
              placeholder="Ex: 123456" 
              value={tempChamado}
              onChange={(e) => setTempChamado(e.target.value)}
              className="h-11"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setChamadoModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" className="flex-1 bg-navy-900" onClick={handleAbrirChamado}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Indeferir */}
      <Modal 
        isOpen={isIndefModalOpen} 
        onClose={() => !submittingIndef && setIndefModalOpen(false)} 
        title="Motivo do Indeferimento"
        description="Explique por que esta solicitação foi recusada. O aluno poderá ver este motivo."
      >
        <form onSubmit={handleIndeferirSubmit} className="space-y-5 mt-2">
          <Select 
            label="Selecione o Motivo"
            required
            value={selectedMotivoId}
            onChange={(e) => setSelectedMotivoId(e.target.value)}
            options={motivos.map(m => ({ value: m.id, label: m.motivo }))}
            placeholder="-- Escolha uma opção --"
          />

          {(motivos.find(m => m.id === selectedMotivoId)?.motivo.includes('Outro') || !selectedMotivoId) && (
            <Textarea 
              label="Especifique o motivo detalhadamente"
              value={outroMotivo}
              onChange={(e) => setOutroMotivo(e.target.value)}
              required={motivos.find(m => m.id === selectedMotivoId)?.motivo.includes('Outro')}
              placeholder="Digite aqui a justificativa completa..."
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button type="button" variant="ghost" onClick={() => setIndefModalOpen(false)} disabled={submittingIndef}>
              Cancelar
            </Button>
            <Button type="submit" variant="danger" isLoading={submittingIndef} icon={<XCircle size={18} />}>
              Confirmar Indeferimento
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
