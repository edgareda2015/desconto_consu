import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { StatusBadge, getRowColorClass } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton, Skeleton } from '../components/ui/Skeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Download, Upload, Plus, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Diretor() {
  const { user } = useUser();
  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [blocos, setBlocos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal Criar Bloco
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [tipoBloco, setTipoBloco] = useState('ate65'); // 'ate65' ou 'acima65'
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Modal Upload
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isSuccessModalOpen, setSuccessModalOpen] = useState(false);
  const [activeBloco, setActiveBloco] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Pega solicitacoes "Aguardando análise"
      const { data: solData, error: solError } = await supabase
        .from('solicitacoes')
        .select('*')
        .eq('status', 'Aguardando análise')
        .order('created_at', { ascending: false });
      
      if (solError) throw solError;
      setSolicitacoes(solData || []);

      // Pega blocos abertos ou recém finalizados
      const { data: blocoData, error: blocoError } = await supabase
        .from('blocos_semanais')
        .select('*, bloco_solicitacoes(solicitacoes(*))')
        .neq('status', 'Finalizado')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (blocoError) throw blocoError;
      setBlocos(blocoData || []);
      
    } catch (err) {
      toast.error('Erro ao carregar dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const solicitacoesAte65 = solicitacoes.filter(s => parseFloat(s.desc_percentual_solicitado) <= 65);
  const solicitacoesAcima65 = solicitacoes.filter(s => parseFloat(s.desc_percentual_solicitado) > 65);

  const handleCreateBloco = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma solicitação.');
      return;
    }
    setCreating(true);
    try {
      // Gera código
      const year = new Date().getFullYear();
      const seqData = await supabase.from('blocos_semanais').select('id').eq('tipo', tipoBloco).gte('created_at', `${year}-01-01T00:00:00Z`);
      const seq = (seqData.data?.length || 0) + 1;
      const seqStr = seq.toString().padStart(3, '0');
      const suf = tipoBloco === 'ate65' ? 'AT65' : 'ACIMA65';
      const codigoBloco = `BLOCO-${year}-${seqStr}-${suf}`;

      // Insere Bloco
      const { data: novoBloco, error: blocoError } = await supabase
        .from('blocos_semanais')
        .insert([{
          codigo_bloco: codigoBloco,
          semana_inicio: new Date().toISOString(),
          semana_fim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          tipo: tipoBloco,
          status: 'Aguardando envio',
          user_id: user?.id
        }])
        .select()
        .single();
      
      if (blocoError) throw blocoError;

      // Associa as solicitações
      const blocoSols = selectedIds.map(sid => ({
        bloco_id: novoBloco.id,
        solicitacao_id: sid
      }));

      const { error: relError } = await supabase.from('bloco_solicitacoes').insert(blocoSols);
      if (relError) throw relError;

      toast.success(`Bloco ${codigoBloco} criado!`);
      setCreateModalOpen(false);
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      toast.error('Erro ao criar bloco.');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const exportToExcel = async (bloco: any) => {
    try {
      const { data, error } = await supabase
        .from('bloco_solicitacoes')
        .select('solicitacoes(*)')
        .eq('bloco_id', bloco.id);
      
      if (error) throw error;

      const sols = data.map(d => d.solicitacoes);
      
      const wsData = sols.map((s: any) => ({
        'Inscrição': s.inscricao,
        'CPF/Matricula': s.cpf,
        'Nome': s.nome,
        'Curso': s.curso,
        'Mens. Atual': s.mensalidade_atual ? `R$ ${s.mensalidade_atual.toFixed(2)}` : '-',
        'Desc. % Atual': `${s.desc_percentual_atual}%`,
        'Mens. Solicitada': s.mensalidade_solicitada ? `R$ ${s.mensalidade_solicitada.toFixed(2)}` : '-',
        'Desc. % Solicitado': `${s.desc_percentual_solicitado}%`,
        'Data': new Date(s.data_solicitacao).toLocaleDateString('pt-BR'),
        'Consultor': s.consultor
      }));

      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Solicitacoes");
      
      XLSX.writeFile(wb, `${bloco.codigo_bloco}.xlsx`);

      if (bloco.status === 'Aguardando envio') {
        await supabase.from('blocos_semanais').update({ status: 'Enviado' }).eq('id', bloco.id);
        fetchData();
      }
      toast.success('Excel gerado com sucesso!');
    } catch(err) {
      toast.error('Erro ao gerar Excel');
      console.error(err);
    }
  };

  const exportToPDF = async (bloco: any) => {
    try {
      const { data, error } = await supabase
        .from('bloco_solicitacoes')
        .select('solicitacoes(*)')
        .eq('bloco_id', bloco.id);
      
      if (error) throw error;

      const sols = data.map(d => d.solicitacoes);
      const doc = new jsPDF('landscape');

      doc.setFontSize(16);
      doc.text(`Relatório de Bloco: ${bloco.codigo_bloco}`, 14, 15);
      doc.setFontSize(10);
      doc.text(`Data de Geração: ${new Date().toLocaleString('pt-BR')}`, 14, 22);

      const tableData = sols.map((s: any) => [
        s.inscricao || '-',
        s.cpf || '-',
        s.nome || '-',
        s.curso || '-',
        s.mensalidade_atual ? `R$ ${Number(s.mensalidade_atual).toFixed(2)}` : '-',
        `${s.desc_percentual_atual || 0}%`,
        s.mensalidade_solicitada ? `R$ ${Number(s.mensalidade_solicitada).toFixed(2)}` : '-',
        `${s.desc_percentual_solicitado || 0}%`,
        s.data_solicitacao ? new Date(s.data_solicitacao).toLocaleDateString('pt-BR') : '-',
        s.consultor || '-'
      ]);

      autoTable(doc, {
        head: [['Inscrição', 'CPF/Matric.', 'Nome', 'Curso', 'M. Atual', 'D. % At.', 'M. Solic.', 'D. % Sol.', 'Data', 'Consultor']],
        body: tableData,
        startY: 28,
        theme: 'striped',
        headStyles: { 
          fillColor: [15, 23, 42], 
          textColor: [255, 255, 255],
          fontSize: 9, 
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4, 
          textColor: [51, 65, 85], // slate-700
          valign: 'middle'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 }, // Inscricao
          1: { halign: 'center', cellWidth: 25 }, // CPF
          2: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 50 }, // Nome (Negrito e mais largo)
          3: { cellWidth: 45 }, // Curso
          4: { halign: 'right' }, // M. Atual
          5: { halign: 'center' }, // D. % At.
          6: { halign: 'right' }, // M. Solic.
          7: { halign: 'center', fontStyle: 'bold', textColor: [37, 99, 235] }, // D. % Sol. (Azul)
          8: { halign: 'center' }, // Data
          9: { fontSize: 8 } // Consultor
        }
      });

      doc.save(`${bloco.codigo_bloco}.pdf`);

      if (bloco.status === 'Aguardando envio') {
        await supabase.from('blocos_semanais').update({ status: 'Enviado' }).eq('id', bloco.id);
        fetchData();
      }
      toast.success('PDF gerado com sucesso!');
    } catch(err) {
      toast.error('Erro ao gerar PDF');
      console.error(err);
    }
  };

  const handleUploadRetorno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Selecione um arquivo PDF.');
      return;
    }

    if (!uploadFile.name.includes(activeBloco.codigo_bloco)) {
      toast.error('Código do bloco não corresponde. Verifique o arquivo.');
      return;
    }

    setUploading(true);
    try {
      const fileName = `${activeBloco.codigo_bloco}-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs_retorno')
        .upload(fileName, uploadFile);
      
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('pdfs_retorno').getPublicUrl(fileName);
      const pdfUrl = publicUrlData.publicUrl;

      const rels = activeBloco.bloco_solicitacoes || [];
      const solIds = rels.map((r: any) => r.solicitacoes.id);

      if (solIds.length > 0) {
        const { error: updateSolError } = await supabase
          .from('solicitacoes')
          .update({ 
            status: 'Liberado para coordenação',
            deferimento_anexo: true,
            pdf_url: pdfUrl
          })
          .in('id', solIds);
        
        if (updateSolError) throw updateSolError;
      }

      const { error: endBlocoError } = await supabase
        .from('blocos_semanais')
        .update({ status: 'Finalizado' })
        .eq('id', activeBloco.id);
      
      if (endBlocoError) throw endBlocoError;

      toast.success('Retorno confirmado!');
      setUploadModalOpen(false);
      setUploadFile(null);
      setSuccessModalOpen(true);
      fetchData();
    } catch (err) {
      toast.error('Erro ao processar o retorno.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="section-gap animate-fade-in">
      <PageHeader 
        title="Área do Diretor" 
        description="Gestão de blocos de solicitações e retornos dos professores avaliadores."
        action={
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-3 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Fila Até 65%</span>
                <span className="text-[16px] sm:text-[18px] font-black text-navy-900 leading-none">{solicitacoesAte65.length}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center text-navy-600">
                <FileText size={16} />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-3 shadow-sm">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Fila Acima 65%</span>
                <span className="text-[16px] sm:text-[18px] font-black text-amber-600 leading-none">{solicitacoesAcima65.length}</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertCircle size={16} />
              </div>
            </div>
          </div>
        }
      />

      {/* Blocos Recentes */}
      <Card padding="md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-[18px] font-bold text-navy-900">Blocos Semanais</h2>
          <Button onClick={() => setCreateModalOpen(true)} icon={<Plus size={18} />}>
            Criar Novo Bloco
          </Button>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton variant="rect" className="h-32" />
            <Skeleton variant="rect" className="h-32" />
            <Skeleton variant="rect" className="h-32" />
          </div>
        ) : blocos.length === 0 ? (
          <EmptyState 
            icon={<FileText size={28} className="text-navy-400" />}
            title="Nenhum bloco" 
            description="Você ainda não gerou blocos recentes."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {blocos.map(b => (
              <div key={b.id} className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between group min-w-0">
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                    <span className="font-mono text-[12px] font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 truncate max-w-full">
                      {b.codigo_bloco}
                    </span>
                    <div className="shrink-0">
                      <StatusBadge status={b.status === 'Finalizado' ? 'Deferido' : (b.status === 'Enviado' ? 'Chamado aberto' : 'Aguardando análise')} />
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-500 font-medium mb-6">
                    <span className="text-navy-900 font-bold">{b.bloco_solicitacoes?.length || 0}</span> solicitações vinculadas
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => exportToExcel(b)} className="opacity-80 group-hover:opacity-100 transition-opacity px-2">
                    <Download size={14} className="mr-1" /> Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportToPDF(b)} className="opacity-80 group-hover:opacity-100 transition-opacity px-2">
                    <FileText size={14} className="mr-1" /> PDF
                  </Button>
                  
                  {b.status !== 'Finalizado' && (
                    <Button 
                      variant="primary" 
                      size="sm" 
                      className="col-span-2 bg-navy-900 hover:bg-navy-800 text-white border-0 shadow-md h-9 mt-1" 
                      onClick={() => { setActiveBloco(b); setUploadModalOpen(true); }}
                    >
                      <Upload size={14} className="mr-1.5" /> Enviar p/ Coordenação
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Filas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="bg-[#F8FAFC] px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-navy-900 flex items-center gap-2.5 text-[15px]">
              <div className="w-2 h-2 rounded-full bg-navy-500" /> Fila: ATÉ 65%
            </h3>
          </CardHeader>
          <div className="overflow-auto max-h-[400px] w-full">
            <div className="min-w-max w-full">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100">
                  {solicitacoesAte65.length === 0 ? (
                  <Tr><Td className="text-center text-slate-500 py-10 font-medium">Nenhuma solicitação pendente.</Td></Tr>
                ) : (
                  solicitacoesAte65.map(s => (
                    <Tr key={s.id} className={getRowColorClass(s.status, s.reprocessada)}>
                      <Td className="py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-navy-900">{s.nome}</p>
                          {s.reprocessada && (
                            <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-amber-200">REENVIADO</span>
                          )}
                        </div>
                        <p className="text-[12px] text-navy-500 font-medium mt-0.5">{s.curso} - <span className="text-navy-700 font-bold">{s.desc_percentual_solicitado}%</span></p>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="bg-[#FFFBEB] px-6 py-4 border-b border-[#FDE68A]">
            <h3 className="font-bold text-[#B8860B] flex items-center gap-2.5 text-[15px]">
              <div className="w-2 h-2 rounded-full bg-[#FBBF24]" /> Fila: ACIMA DE 65%
            </h3>
          </CardHeader>
          <div className="overflow-auto max-h-[400px] w-full">
            <div className="min-w-max w-full">
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-100">
                  {solicitacoesAcima65.length === 0 ? (
                  <Tr><Td className="text-center text-slate-500 py-10 font-medium">Nenhuma solicitação pendente.</Td></Tr>
                ) : (
                  solicitacoesAcima65.map(s => (
                    <Tr key={s.id} className={getRowColorClass(s.status, s.reprocessada)}>
                      <Td className="py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-navy-900">{s.nome}</p>
                          {s.reprocessada && (
                            <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-md font-bold border border-amber-200">REENVIADO</span>
                          )}
                        </div>
                        <p className="text-[12px] text-navy-500 font-medium mt-0.5">{s.curso} - <span className="text-navy-700 font-bold">{s.desc_percentual_solicitado}%</span></p>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        </Card>
      </div>

      {/* Modal de Sucesso - Envio para Coordenação */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        title="Envio Concluído!"
        description="O bloco foi processado com sucesso."
      >
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-emerald-600" size={32} />
          </div>
          <h4 className="text-[17px] font-bold text-navy-900 mb-2">Liberado para Coordenação</h4>
          <p className="text-[14px] text-navy-500 leading-relaxed mb-6">
            As solicitações deste bloco agora estão visíveis para os **Coordenadores** realizarem a abertura dos chamados.
          </p>
          <Button 
            variant="primary" 
            className="w-full bg-navy-900" 
            onClick={() => setSuccessModalOpen(false)}
          >
            Entendido
          </Button>
        </div>
      </Modal>

      {/* Modal Criar Bloco */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => !creating && setCreateModalOpen(false)} 
        title="Criar Novo Bloco"
        description="Agrupe solicitações para enviar ao professor avaliador."
      >
        <div className="space-y-5 mt-2">
          <div>
            <label className="block text-[13px] font-semibold text-navy-900 mb-2">Tipo de Bloco</label>
            <div className="flex bg-navy-50 p-1 rounded-[var(--radius-lg)] border border-border">
              <button
                className={`flex-1 py-2 text-[13px] font-bold rounded-[var(--radius-sm)] transition-all ${tipoBloco === 'ate65' ? 'bg-white shadow-sm text-navy-900' : 'text-navy-500 hover:text-navy-700'}`}
                onClick={() => { setTipoBloco('ate65'); setSelectedIds([]); }}
              >
                Até 65%
              </button>
              <button
                className={`flex-1 py-2 text-[13px] font-bold rounded-[var(--radius-sm)] transition-all ${tipoBloco === 'acima65' ? 'bg-white shadow-sm text-navy-900' : 'text-navy-500 hover:text-navy-700'}`}
                onClick={() => { setTipoBloco('acima65'); setSelectedIds([]); }}
              >
                Acima de 65%
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[13px] font-semibold text-navy-900">Selecione as Solicitações</label>
              <div className="flex items-center gap-4">
                {(tipoBloco === 'ate65' ? solicitacoesAte65 : solicitacoesAcima65).length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      const currentList = tipoBloco === 'ate65' ? solicitacoesAte65 : solicitacoesAcima65;
                      if (selectedIds.length === currentList.length) {
                        setSelectedIds([]);
                      } else {
                        setSelectedIds(currentList.map(s => s.id));
                      }
                    }}
                    className="text-[11px] font-bold text-brand-blue hover:text-navy-700 transition-colors bg-navy-50 px-2 py-1 rounded"
                  >
                    {selectedIds.length === (tipoBloco === 'ate65' ? solicitacoesAte65 : solicitacoesAcima65).length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                )}
                <span className="text-navy-400 font-bold text-[11px] uppercase tracking-wider">{selectedIds.length} selecionadas</span>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border border-border rounded-[var(--radius-md)] p-2 space-y-1 bg-surface shadow-inner">
              {(tipoBloco === 'ate65' ? solicitacoesAte65 : solicitacoesAcima65).length === 0 && (
                <p className="text-[13px] text-navy-400 font-medium text-center py-6">Nenhuma solicitação nesta faixa.</p>
              )}
              {(tipoBloco === 'ate65' ? solicitacoesAte65 : solicitacoesAcima65).map(s => (
                <label key={s.id} className="flex items-center space-x-3 hover:bg-navy-50 p-2.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors border border-transparent hover:border-border">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-border text-navy-600 focus:ring-navy-500 transition-all cursor-pointer"
                    checked={selectedIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds([...selectedIds, s.id]);
                      else setSelectedIds(selectedIds.filter(id => id !== s.id));
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-navy-900">{s.nome}</p>
                    <p className="text-[11px] text-navy-500 font-medium">{s.curso} — {s.desc_percentual_solicitado}%</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreateBloco} isLoading={creating}>Gerar Bloco</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Upload */}
      <Modal 
        isOpen={isUploadModalOpen} 
        onClose={() => !uploading && setUploadModalOpen(false)} 
        title="Upload de Parecer"
        description="Envie o PDF assinado pelo professor avaliador."
      >
        {activeBloco && (
          <form onSubmit={handleUploadRetorno} className="space-y-5 mt-2">
            <div className="bg-navy-50 border border-border p-3 rounded-[var(--radius-md)] flex items-center justify-between">
              <span className="text-[13px] font-semibold text-navy-600">Bloco Alvo</span>
              <span className="font-mono text-[13px] font-bold text-navy-900">{activeBloco.codigo_bloco}</span>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-navy-900 mb-1">Arquivo PDF *</label>
              <div className="flex items-start gap-2 mb-3 bg-amber-50 p-3 rounded-[var(--radius-md)] border border-amber-200">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[12px] font-medium text-amber-800">
                  O nome do arquivo <b>DEVE</b> conter o código exato do bloco para segurança.
                </p>
              </div>
              
              <div className="relative">
                <input 
                  type="file" 
                  accept="application/pdf"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full border border-border rounded-[var(--radius-md)] p-2.5 text-[14px] text-navy-700 bg-white cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[12px] file:font-semibold file:bg-navy-50 file:text-navy-700 hover:file:bg-navy-100 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <Button type="button" variant="ghost" onClick={() => setUploadModalOpen(false)} disabled={uploading}>Cancelar</Button>
              <Button type="submit" isLoading={uploading} variant="primary" className="bg-gold-500 hover:bg-gold-600 shadow-md border-0 text-white">
                Confirmar Retorno
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
