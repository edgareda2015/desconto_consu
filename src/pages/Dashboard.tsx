import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  User,
  GraduationCap,
  Activity,
  Award
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LabelList
} from 'recharts';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes')
        .select('*');
      
      if (error) throw error;

      if (!data || data.length === 0) {
        setStats({
          totalRequests: 0,
          monthlyRequests: 0,
          totalDiscountValue: 0,
          consultantData: [],
          courseData: [],
          approvedCount: 0,
          historyData: []
        });
        return;
      }

      // Processamento de dados
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();

      const monthlySols = data.filter(s => {
        const d = new Date(s.created_at);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      });

      // Valor total solicitado (impacto financeiro)
      const totalValue = data.reduce((acc, s) => {
        const atual = Number(s.mensalidade_atual) || 0;
        const solic = Number(s.mensalidade_solicitada) || 0;
        const diff = atual - solic;
        return acc + (diff > 0 ? diff : 0);
      }, 0);

      // Agrupamento por Consultor
      const consultantMap: any = {};
      data.forEach(s => {
        const name = s.consultor || 'N/A';
        consultantMap[name] = (consultantMap[name] || 0) + 1;
      });
      const consultantData = Object.entries(consultantMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => (b.value as number) - (a.value as number))
        .slice(0, 8);

      // Agrupamento por Curso (Quantitativo e Valor)
      const courseMap: any = {};
      data.forEach(s => {
        const name = s.curso || 'N/A';
        const atual = Number(s.mensalidade_atual) || 0;
        const solic = Number(s.mensalidade_solicitada) || 0;
        const diff = atual - solic;
        
        if (!courseMap[name]) {
          courseMap[name] = { count: 0, totalValue: 0 };
        }
        courseMap[name].count++;
        courseMap[name].totalValue += (diff > 0 ? diff : 0);
      });
      
      const courseDataQuantity = Object.entries(courseMap)
        .map(([name, stats]: any) => ({ 
          name, 
          value: stats.count, 
          totalValue: stats.totalValue 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const courseDataValue = [...courseDataQuantity]
        .sort((a, b) => b.totalValue - a.totalValue);

      // Histórico simplificado (últimos 7 dias)
      const historyMap: any = {};
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        historyMap[key] = 0;
      }
      data.forEach(s => {
        const key = new Date(s.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (historyMap[key] !== undefined) historyMap[key]++;
      });
      const historyData = Object.entries(historyMap).map(([name, value]) => ({ name, value }));

      setStats({
        totalRequests: data.length,
        monthlyRequests: monthlySols.length,
        totalDiscountValue: totalValue,
        consultantData,
        courseDataQuantity,
        courseDataValue,
        historyData,
        approvedCount: data.filter(s => ['Liberado para coordenação', 'Chamado aberto', 'Deferido'].includes(s.status)).length
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-8 p-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="h-[400px] bg-slate-100 rounded-2xl" />
          <div className="h-[400px] bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="section-gap animate-fade-in pb-16">
      <PageHeader 
        title="Dashboard Estratégico" 
        description="Acompanhamento em tempo real de métricas, produtividade e impacto financeiro."
      />

      {/* Grid de Cards Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Solicitações" 
          value={stats?.totalRequests || 0} 
          icon={<Activity />} 
          trend="Geral" 
          color="navy"
        />
        <StatCard 
          title="Total no Mês" 
          value={stats?.monthlyRequests || 0} 
          icon={<FileText />} 
          trend="+12%" 
          color="blue"
        />
        <StatCard 
          title="Total de Descontos" 
          value={`R$ ${(stats?.totalDiscountValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          icon={<DollarSign />} 
          trend="+R$ 2.4k" 
          color="emerald"
        />
        <StatCard 
          title="Taxa de Conclusão" 
          value={stats?.totalRequests > 0 ? `${((stats.approvedCount / stats.totalRequests) * 100).toFixed(1)}%` : '0%'} 
          icon={<Award />} 
          trend="Estável" 
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Gráfico de Evolução (Area) */}
        <Card padding="lg" className="lg:col-span-2 h-[400px] flex flex-col shadow-sm border-slate-200">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-navy-900 flex items-center gap-2 text-[16px]">
                <TrendingUp size={18} className="text-navy-400" />
                Evolução Semanal
              </h3>
              <p className="text-[12px] text-slate-500 font-medium">Volume de solicitações nos últimos 7 dias</p>
            </div>
          </div>
          <div className="flex-1 w-full -ml-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.historyData || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e293b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1e293b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1e293b" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Consultores (Rank) */}
        <Card padding="lg" className="h-[400px] flex flex-col shadow-sm border-slate-200">
          <div className="mb-6">
            <h3 className="font-bold text-navy-900 flex items-center gap-2 text-[16px]">
              <User size={18} className="text-navy-400" />
              Ranking Consultores
            </h3>
            <p className="text-[12px] text-slate-500 font-medium">Desempenho por volume de entrada</p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {(stats?.consultantData || []).map((item: any, index: number) => (
              <div key={item.name} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="font-bold text-navy-800">{item.name}</span>
                  <span className="font-mono font-bold text-navy-500">{item.value}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-navy-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(item.value / (stats.consultantData[0]?.value || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats?.consultantData || stats.consultantData.length === 0) && <p className="text-center text-slate-400 py-10">Sem dados.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Gráfico de Cursos (Quantidade) */}
        <Card padding="lg" className="min-h-[400px] flex flex-col shadow-sm border-slate-200">
          <div className="mb-8">
            <h3 className="font-bold text-navy-900 flex items-center gap-2 text-[16px]">
              <GraduationCap size={18} className="text-navy-400" />
              Volume por Curso
            </h3>
            <p className="text-[12px] text-slate-500 font-medium">Distribuição quantitativa das solicitações</p>
          </div>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.courseDataQuantity || []} layout="vertical" margin={{ right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={140} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#1e293b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} name="Solicitações">
                  {(stats?.courseDataQuantity || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#1e293b' : '#3b82f6'} />
                  ))}
                  <LabelList dataKey="value" position="right" style={{ fontSize: 11, fontWeight: 'bold', fill: '#1e293b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Gráfico de Cursos (Valor) */}
        <Card padding="lg" className="min-h-[400px] flex flex-col shadow-sm border-slate-200">
          <div className="mb-8">
            <h3 className="font-bold text-navy-900 flex items-center gap-2 text-[16px]">
              <DollarSign size={18} className="text-emerald-500" />
              Impacto Financeiro por Curso
            </h3>
            <p className="text-[12px] text-slate-500 font-medium">Total de descontos solicitados (R$)</p>
          </div>
          <div className="flex-1 w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.courseDataValue || []} layout="vertical" margin={{ right: 80 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={140} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#1e293b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="totalValue" radius={[0, 6, 6, 0]} barSize={24} name="Valor Desconto">
                  {(stats?.courseDataValue || []).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill="#10b981" />
                  ))}
                  <LabelList 
                    dataKey="totalValue" 
                    position="right" 
                    formatter={(val: number) => `R$ ${val.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                    style={{ fontSize: 10, fontWeight: 'bold', fill: '#065f46' }} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Resumo de Status (Pie) */}
        <Card padding="lg" className="min-h-[450px] flex flex-col shadow-sm border-slate-200">
          <div className="mb-4">
            <h3 className="font-bold text-navy-900 flex items-center gap-2 text-[16px]">
              <Activity size={18} className="text-navy-400" />
              Distribuição de Status
            </h3>
            <p className="text-[12px] text-slate-500 font-medium">Visão do funil de solicitações</p>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center">
            <div className="w-full h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Aguardando', value: (stats?.totalRequests || 0) - (stats?.approvedCount || 0) },
                      { name: 'Concluído', value: stats?.approvedCount || 0 }
                    ]}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill="#cbd5e1" />
                    <Cell fill="#1e293b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-3xl font-black text-navy-900 leading-none">{stats?.totalRequests || 0}</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase mt-1">Total</p>
              </div>
            </div>
            <div className="flex flex-col gap-4 w-full sm:w-48">
              <LegendItem color="bg-navy-900" label="Finalizados/Lib." value={stats?.approvedCount || 0} />
              <LegendItem color="bg-slate-300" label="Em Processamento" value={(stats?.totalRequests || 0) - (stats?.approvedCount || 0)} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const bgColors: any = {
    blue: 'bg-blue-50/50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50/50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50/50 text-amber-600 border-amber-100',
    navy: 'bg-navy-50/50 text-navy-600 border-navy-100',
  };

  return (
    <Card padding="md" className="relative overflow-hidden group hover:shadow-md transition-all border-slate-200">
      <div className="flex items-start justify-between">
        <div className="relative z-10">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h4 className="text-[26px] font-black text-navy-900 tracking-tight leading-none mb-4">{value}</h4>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${bgColors[color]}`}>
              {trend}
            </span>
            <span className="text-[10px] font-semibold text-slate-400">vs. período ant.</span>
          </div>
        </div>
        <div className={`p-3.5 rounded-2xl ${bgColors[color]} border group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
          {React.cloneElement(icon as React.ReactElement, { size: 22 })}
        </div>
      </div>
      <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { size: 100 })}
      </div>
    </Card>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-[12px] font-bold text-slate-600">{label}</span>
      </div>
      <span className="text-[12px] font-mono font-black text-navy-900">{value}</span>
    </div>
  );
}
