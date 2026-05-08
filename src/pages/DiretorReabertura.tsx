import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiretorReabertura() {
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reopening, setReopening] = useState<string | null>(null);

  useEffect(() => {
    fetchIndeferidas();
  }, []);

  const fetchIndeferidas = async () => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('status', 'Indeferido')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setSolicitacoes(data || []);
    } catch (err) {
      toast.error('Erro ao carregar solicitações indeferidas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReabrir = async (id: string) => {
    setReopening(id);
    try {
      const { error } = await supabase
        .from('solicitacoes')
        .update({ 
          status: 'Aguardando análise',
          motivo_indeferimento: null,
          numero_chamado: null,
          deferimento_anexo: false,
          pdf_url: null
        })
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('Fluxo reaberto! A solicitação voltou para Aguardando Análise.');
      fetchIndeferidas();
    } catch(err) {
      toast.error('Erro ao reabrir fluxo.');
      console.error(err);
    } finally {
      setReopening(null);
    }
  };

  return (
    <div className="section-gap animate-fade-in">
      <PageHeader 
        title="Solicitações Indeferidas" 
        description="Analise os motivos e reabra o fluxo se for necessário."
      />

      <Table>
        <Thead>
          <Tr>
            <Th>Aluno</Th>
            <Th>Desconto</Th>
            <Th>Motivo da Recusa</Th>
            <Th align="right">Ações</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr><Td colSpan={4} className="p-0"><TableSkeleton rows={3} cols={4} /></Td></Tr>
          ) : solicitacoes.length === 0 ? (
            <Tr>
              <Td colSpan={4} className="p-0">
                <EmptyState 
                  icon={<AlertCircle size={28} className="text-navy-400" />}
                  title="Nenhuma solicitação indeferida" 
                  description="No momento, não há solicitações com status Indeferido para reanálise."
                />
              </Td>
            </Tr>
          ) : (
            solicitacoes.map((s) => (
              <Tr key={s.id} className="bg-amber-50/20 hover:bg-amber-50/50">
                <Td>
                  <p className="font-bold text-navy-900">{s.nome}</p>
                  <p className="text-[12px] text-navy-500 font-medium">{s.curso}</p>
                </Td>
                <Td>
                  <p className="font-bold text-navy-900">{s.desc_percentual_solicitado}%</p>
                </Td>
                <Td>
                  <StatusBadge status="Indeferido" />
                  <p className="text-[13px] text-brand-red font-medium mt-2 max-w-md">
                    {s.motivo_indeferimento || 'Sem motivo registrado.'}
                  </p>
                </Td>
                <Td align="right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleReabrir(s.id)}
                    isLoading={reopening === s.id}
                    icon={<RefreshCcw size={14} />}
                    className="border-navy-200 text-navy-600 hover:bg-white"
                  >
                    Reabrir Fluxo
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
    </div>
  );
}
