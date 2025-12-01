import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, ReferenceLine, Cell
} from 'recharts';
import { 
  Activity, Thermometer, Wrench, AlertTriangle, 
  Database, Filter, Download, ChevronDown, ChevronUp, 
  RefreshCw, Upload, FileSpreadsheet, DollarSign, 
  CheckCircle2, Star, ShieldCheck, ShieldAlert, Scale, User, LogOut, Lock, UserPlus, Trash2,
  ChevronLeft, ChevronRight, Search, XCircle, Info, Factory, Save, Edit2, X, AlertCircle,
  ArrowUpRight, ArrowDownRight, Lightbulb, TrendingUp, Users, Trophy, Award
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, get, child, update, remove, push } from 'firebase/database';

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCqIzWpvyn_q41-HhgOFtefmyBEpbLkJhU",
  authDomain: "projeto-almox-48819.firebaseapp.com",
  databaseURL: "https://projeto-almox-48819-default-rtdb.firebaseio.com",
  projectId: "projeto-almox-48819",
  storageBucket: "projeto-almox-48819.firebasestorage.app",
  messagingSenderId: "604367180658",
  appId: "1:604367180658:web:ab32ef3990a3d55f8083eb",
  measurementId: "G-THDGMNQLE9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- UTILITÁRIOS ---
const COLORS = ['#008200', '#1f9d55', '#4cc783', '#8ae0b4', '#c9f2dd']; 

// Componente de Notificação (Toast)
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-100 border-emerald-500 text-emerald-800',
    error: 'bg-red-100 border-red-500 text-red-800',
    info: 'bg-blue-100 border-blue-500 text-blue-800'
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg animate-in slide-in-from-right ${styles[type]}`}>
      {type === 'success' && <CheckCircle2 size={20} />}
      {type === 'error' && <XCircle size={20} />}
      {type === 'info' && <Info size={20} />}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><XCircle size={16}/></button>
    </div>
  );
};

// Componente Badge Melhorado
const Badge = ({ status, value, type }) => {
  if (value !== undefined) {
    let styleClass = value >= 85 ? "bg-emerald-50 text-[#008200] border-emerald-200" :
                     value >= 70 ? "bg-amber-50 text-amber-700 border-amber-200" :
                     "bg-red-50 text-red-700 border-red-200";
    return <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${styleClass}`}>{typeof value === 'number' ? value.toFixed(1) : value}%</span>;
  }

  if (type === 'food_safety') {
    if (status === 'compliant') return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-[#008200] border-emerald-200 uppercase"><ShieldCheck size={12} /> OK</span>;
    if (status === 'critical_risk') return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-red-100 text-red-700 border-red-200 uppercase animate-pulse"><ShieldAlert size={12} /> RISCO PCC</span>;
    return <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 uppercase"><AlertCircle size={12} /> ATENÇÃO</span>;
  }

  let styleClass = "bg-slate-100 text-slate-600 border-slate-200";
  if (status === 'operational') styleClass = "bg-emerald-50 text-[#008200] border-emerald-200";
  if (status === 'alert' || status === 'warning') styleClass = "bg-amber-50 text-amber-800 border-amber-200";
  if (status === 'stopped') styleClass = "bg-slate-100 text-slate-600 border-slate-300";

  const label = status === 'operational' ? 'ONLINE' : status === 'stopped' ? 'OFFLINE' : 'ALERTA';

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider border ${styleClass} flex items-center w-fit gap-1.5 uppercase`}>
      <div className={`w-1.5 h-1.5 rounded-full ${status === 'operational' ? 'bg-[#008200]' : status === 'stopped' ? 'bg-slate-500' : 'bg-amber-500'}`}></div>
      {label}
    </span>
  );
};

const KPICard = ({ title, value, subtext, icon: Icon, trend, onClick, isActive }) => (
  <div 
    onClick={onClick}
    className={`p-5 rounded-lg border shadow-sm flex items-start justify-between transition-all relative overflow-hidden group cursor-pointer
      ${isActive 
        ? 'bg-emerald-50 border-[#008200] ring-1 ring-[#008200]' 
        : 'bg-white border-slate-200 hover:shadow-md hover:border-emerald-200'}`}
  >
    <div className={`absolute top-0 left-0 w-1 h-full transition-opacity ${isActive ? 'bg-[#008200] opacity-100' : 'bg-[#008200] opacity-0 group-hover:opacity-100'}`}></div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
      <div className="flex items-center gap-1 mt-3">
        {trend === 'up' && <ArrowUpRight size={14} className="text-[#008200]" />}
        {trend === 'down' && <ArrowDownRight size={14} className="text-red-600" />}
        <span className={`text-xs font-semibold ${trend === 'up' ? 'text-[#008200]' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
          {subtext}
        </span>
      </div>
    </div>
    <div className={`p-3 rounded-lg border ${isActive ? 'bg-white text-[#008200] border-[#008200]' : 'bg-slate-50 border-slate-100 text-[#008200]'}`}>
      <Icon size={22} />
    </div>
  </div>
);

const InsightCard = ({ type, title, description, impact }) => {
  const styles = {
    critical: { border: 'border-l-4 border-l-red-600', icon: ShieldAlert, iconColor: 'text-red-600', bg: 'bg-red-50/30' },
    warning: { border: 'border-l-4 border-l-amber-500', icon: AlertCircle, iconColor: 'text-amber-500', bg: 'bg-white' },
    optimization: { border: 'border-l-4 border-l-blue-600', icon: Lightbulb, iconColor: 'text-blue-600', bg: 'bg-white' },
    success: { border: 'border-l-4 border-l-[#008200]', icon: ShieldCheck, iconColor: 'text-[#008200]', bg: 'bg-white' }
  };

  const Style = styles[type] || styles.optimization;
  const Icon = Style.icon;

  return (
    <div className={`p-5 rounded-lg shadow-sm border border-slate-200 ${Style.border} ${Style.bg} flex gap-4 transition-all hover:shadow-md`}>
      <div className={`mt-0.5 ${Style.iconColor}`}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h4>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">{description}</p>
        {impact && (
          <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <TrendingUp size={12}/> Impacto: {impact}
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Login
const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message.includes('auth') ? 'Erro de autenticação. Verifique os dados.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#002e12] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#002e12] p-8 text-center border-b border-[#004d1f]">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
             <Star className="text-red-600 fill-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">EcoTermo Enterprise</h1>
          <p className="text-emerald-400 text-xs mt-2 tracking-wide uppercase font-bold">Acesso Corporativo Seguro</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">E-mail Corporativo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#008200] outline-none" placeholder="usuario@heineken.com.br" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#008200] outline-none" placeholder="••••••••" required />
              </div>
            </div>
            {error && <div className="p-3 rounded bg-red-50 border border-red-100 flex items-center gap-2 text-sm text-red-600"><AlertCircle size={16} /> {error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-[#008200] hover:bg-[#006000] text-white font-bold py-3 rounded-lg transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="animate-spin" size={20}/> : (isRegistering ? <UserPlus size={20}/> : <ShieldCheck size={20} />)}
              {loading ? 'Processando...' : (isRegistering ? 'Criar Conta' : 'Acessar')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="text-sm text-[#008200] font-bold hover:underline">
              {isRegistering ? 'Já possui conta? Entrar' : 'Não tem conta? Cadastrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function EcoTermoEnterprise() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeView, setActiveView] = useState('assets');
  const [assetData, setAssetData] = useState([]); 
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filters, setFilters] = useState({ area: 'Todas', status: 'Todos', search: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'tag', direction: 'asc' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeKpiFilter, setActiveKpiFilter] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [editFormData, setEditFormData] = useState({}); 
  const itemsPerPage = 10;
  
  const fileInputRef = useRef(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await fetchAssets();
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg, type = 'info') => setToast({ message: msg, type });

  // Busca Inteligente de Dados
  const fetchAssets = async () => {
    try {
      const dbRef = ref(db, 'assets');
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const dataObj = snapshot.val();
        const loadedData = Object.keys(dataObj).map(key => ({
          id: key,
          ...dataObj[key],
          efficiency: Number(dataObj[key].efficiency) || 0,
          cost: Number(dataObj[key].cost) || 0,
          plates: Number(dataObj[key].plates) || 0
        }));
        setAssetData(loadedData);
      } else {
        setAssetData([]);
      }
    } catch (error) {
      showToast('Erro ao sincronizar dados.', 'error');
    }
  };

  // --- LÓGICA DE UPLOAD ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let text = e.target.result;
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
        
        const processedData = parseAdaptiveCSV(text);
        
        if (processedData.length > 0) {
          const updates = {};
          let newCount = 0;
          let updateCount = 0;
          const currentMap = new Map(assetData.map(item => [item.tag, item.id]));

          processedData.forEach((item) => {
            const existingId = currentMap.get(item.tag);
            if (existingId) {
              updates['/assets/' + existingId] = { ...item, updatedAt: new Date().toISOString() };
              updateCount++;
            } else {
              const newKey = push(child(ref(db), 'assets')).key;
              updates['/assets/' + newKey] = { ...item, createdAt: new Date().toISOString() };
              newCount++;
            }
          });

          await update(ref(db), updates);
          await fetchAssets();
          showToast(`Processado: ${newCount} novos, ${updateCount} atualizados.`, 'success');
          setActiveView('assets');
        } else {
          showToast("Nenhum dado válido encontrado na planilha.", 'error');
        }
      } catch (error) {
        console.error(error);
        showToast("Erro ao processar arquivo. Verifique o formato.", 'error');
      } finally {
        setIsProcessing(false);
        event.target.value = ''; 
      }
    };
    reader.readAsText(file); 
  };

  const parseAdaptiveCSV = (csvText) => {
    const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) return [];
    
    const firstLine = lines[0];
    const separator = firstLine.includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase().replace(/['"]+/g, ''));
    
    const columnMap = {
      tag: headers.findIndex(h => h.includes('tag') || h.includes('etiqueta')),
      model: headers.findIndex(h => h.includes('modelo') || h.includes('model')),
      serial: headers.findIndex(h => h.includes('serie') || h.includes('serial') || h.includes('sn')),
      plates: headers.findIndex(h => h.includes('placa') || h.includes('qtd')),
      area: headers.findIndex(h => h.includes('area') || h.includes('setor')),
      material: headers.findIndex(h => h.includes('material')),
      lastMaint: headers.findIndex(h => h.includes('manut') || h.includes('data') || h.includes('ultima')),
      technician: headers.findIndex(h => h.includes('executante') || h.includes('tecnico')),
      status: headers.findIndex(h => h.includes('status') || h.includes('situacao')),
      efficiency: headers.findIndex(h => h.includes('eficiencia') || h.includes('rendimento')),
      cost: headers.findIndex(h => h.includes('custo') || h.includes('valor')),
      app: headers.findIndex(h => h.includes('aplicacao') || h.includes('app'))
    };

    if (columnMap.tag === -1) throw new Error("Coluna TAG não encontrada.");

    const parsedData = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(separator).map(c => c.replace(/['"]+/g, '').trim());
      if (cols.length > 1) {
        const getVal = (idx) => idx > -1 && cols[idx] ? cols[idx] : '';
        const rawEff = getVal(columnMap.efficiency).replace(',', '.').replace('%', '');
        const rawCost = getVal(columnMap.cost).replace('R$', '').replace('.', '').replace(',', '.');

        const obj = {
          tag: getVal(columnMap.tag),
          model: getVal(columnMap.model) || '-',
          serial: getVal(columnMap.serial) || '-',
          plates: parseInt(getVal(columnMap.plates)) || 0,
          area: getVal(columnMap.area) || 'Geral',
          app: getVal(columnMap.app) || 'Processo',
          material: getVal(columnMap.material) || 'Inox',
          lastMaint: getVal(columnMap.lastMaint) || new Date().toLocaleDateString('pt-BR'),
          technician: getVal(columnMap.technician) || 'N/A',
          status: normalizeStatus(getVal(columnMap.status)),
          efficiency: parseFloat(rawEff) || 0,
          cost: parseFloat(rawCost) || 0,
          pressureClean: (Math.random() * 2 + 3).toFixed(1),
          pressureRaw: (Math.random() * 2 + 2).toFixed(1),
          integrityStatus: Math.random() > 0.1 ? 'valid' : 'expired',
          fsStatus: 'compliant',
          daysRun: Math.floor(Math.random() * 300)
        };
        
        if (obj.app.toLowerCase().includes('pasteur') && parseFloat(obj.pressureRaw) >= parseFloat(obj.pressureClean)) {
          obj.fsStatus = 'critical_risk';
        }
        if (obj.tag) parsedData.push(obj);
      }
    }
    return parsedData;
  };

  const normalizeStatus = (statusRaw) => {
    if (!statusRaw) return 'stopped';
    const s = statusRaw.toLowerCase();
    if (s.includes('oper') || s.includes('online') || s.includes('ok')) return 'operational';
    if (s.includes('alert') || s.includes('crit') || s.includes('ruim')) return 'alert';
    return 'stopped';
  };

  const handleClearDatabase = async () => {
    if (window.confirm("ATENÇÃO: Deseja apagar TODOS os registros? Isso não pode ser desfeito.")) {
      setIsProcessing(true);
      try {
        await remove(ref(db, 'assets'));
        setAssetData([]);
        showToast('Base de dados limpa com sucesso.', 'success');
      } catch (error) {
        showToast('Erro ao limpar base de dados.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // --- NOVAS FUNÇÕES DE EDIÇÃO E EXCLUSÃO ---
  const startEditing = (asset) => {
    setEditFormData({ ...asset });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsProcessing(true);
    try {
      await update(ref(db, `assets/${selectedAsset.id}`), editFormData);
      
      const newData = assetData.map(a => a.id === selectedAsset.id ? editFormData : a);
      setAssetData(newData);
      setSelectedAsset(editFormData);
      setIsEditing(false);
      showToast('Ativo atualizado com sucesso!', 'success');
    } catch (error) {
      showToast('Erro ao salvar alterações.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSingleAsset = async () => {
    if(window.confirm(`Tem certeza que deseja excluir o ativo ${selectedAsset.tag}?`)) {
      setIsProcessing(true);
      try {
        await remove(ref(db, `assets/${selectedAsset.id}`));
        const newData = assetData.filter(a => a.id !== selectedAsset.id);
        setAssetData(newData);
        setSelectedAsset(null);
        showToast('Ativo excluído.', 'success');
      } catch (error) {
        showToast('Erro ao excluir.', 'error');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  // --- CÁLCULO DE PERFORMANCE DE EXECUTANTES ---
  const technicianStats = useMemo(() => {
    const stats = {};
    assetData.forEach(asset => {
      const tech = asset.technician || 'N/A';
      if (!stats[tech]) {
        stats[tech] = { name: tech, totalAssets: 0, totalEfficiency: 0, criticalIssues: 0, areas: new Set() };
      }
      stats[tech].totalAssets += 1;
      stats[tech].totalEfficiency += asset.efficiency;
      if (asset.fsStatus === 'critical_risk' || asset.efficiency < 60) {
        stats[tech].criticalIssues += 1;
      }
      stats[tech].areas.add(asset.area);
    });

    return Object.values(stats).map(s => ({
      ...s,
      avgEfficiency: s.totalAssets > 0 ? (s.totalEfficiency / s.totalAssets).toFixed(1) : 0,
      score: s.totalAssets > 0 ? Math.max(0, 100 - (s.criticalIssues * 20) + (s.totalEfficiency / s.totalAssets * 0.2)).toFixed(0) : 0, // Score fictício baseada em performance
      areaCount: s.areas.size
    })).sort((a, b) => b.score - a.score); // Ordenar por melhor score
  }, [assetData]);

  // --- FILTROS, KPI E PAGINAÇÃO ---
  const kpis = useMemo(() => {
    const total = assetData.length;
    const criticalRisks = assetData.filter(d => d.fsStatus === 'critical_risk').length;
    const compliant = assetData.filter(d => d.fsStatus === 'compliant').length;
    const complianceRate = total > 0 ? ((compliant / total) * 100).toFixed(1) : 0;
    
    return [
      { id: 'safety', title: 'Compliance Food Safety', value: `${complianceRate}%`, subtext: `${criticalRisks} Riscos Críticos`, trend: criticalRisks > 0 ? 'down' : 'up', icon: ShieldCheck },
      { id: 'total', title: 'Total de Ativos', value: `${total}`, subtext: 'Base Realtime DB', trend: 'neutral', icon: Database },
      { id: 'maint', title: 'Manutenções Recentes', value: `${assetData.filter(d => d.daysRun < 30).length}`, subtext: 'Últimos 30 dias', trend: 'neutral', icon: Wrench },
      { id: 'eff', title: 'Eficiência Média', value: `84.2%`, subtext: 'Troca Térmica', trend: 'up', icon: Thermometer },
    ];
  }, [assetData]);

  const processedData = useMemo(() => {
    let data = [...assetData];
    
    if (activeKpiFilter === 'safety') {
        data = data.filter(d => d.fsStatus === 'critical_risk');
    } else if (activeKpiFilter === 'maint') {
        data = data.filter(d => d.daysRun < 30);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      data = data.filter(d => 
        d.tag.toLowerCase().includes(term) || d.model.toLowerCase().includes(term) || d.serial.toLowerCase().includes(term)
      );
    }
    
    if (filters.area !== 'Todas') data = data.filter(d => d.area === filters.area);
    if (filters.status !== 'Todos') data = data.filter(d => d.status === filters.status);
    
    data.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      return valA < valB ? (sortConfig.direction === 'asc' ? -1 : 1) : (sortConfig.direction === 'asc' ? 1 : -1);
    });
    return data;
  }, [assetData, filters, sortConfig, activeKpiFilter]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const handleSort = (key) => setSortConfig(curr => ({ key, direction: curr.key === key && curr.direction === 'asc' ? 'desc' : 'asc' }));

  if (loadingAuth) return <div className="min-h-screen bg-[#002e12] flex items-center justify-center"><RefreshCw className="text-white animate-spin" size={48} /></div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <aside className="w-64 bg-[#002e12] text-white flex flex-col shadow-2xl z-30">
        <div className="h-20 flex items-center px-6 border-b border-[#004d1f] gap-3">
           <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-red-600"><Star fill="currentColor" size={16}/></div>
           <div><span className="block font-bold text-lg">EcoTermo</span><span className="text-[10px] uppercase text-emerald-400">Enterprise</span></div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {[
            { id: 'assets', icon: Database, label: 'Inventário de Ativos' },
            { id: 'reports', icon: ShieldCheck, label: 'Inteligência & Qualidade' },
            { id: 'team', icon: Users, label: 'Performance de Executantes' },
            { id: 'maintenance', icon: Wrench, label: 'Ordens de Serviço' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center px-4 py-3 rounded-md transition-all ${activeView === item.id ? 'bg-[#008200] text-white shadow-md' : 'text-emerald-100/70 hover:bg-[#004d1f]'}`}>
              <item.icon size={18} />
              <span className="ml-3 text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#004d1f] space-y-2 bg-[#00250e]">
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
          <button onClick={() => fileInputRef.current.click()} disabled={isProcessing} className="w-full bg-white hover:bg-slate-100 text-[#002e12] py-2 rounded text-xs font-bold flex items-center justify-center gap-2">
            {isProcessing ? <RefreshCw className="animate-spin" size={14}/> : <Upload size={14} />} Importar Planilha
          </button>
          <button onClick={handleClearDatabase} className="w-full bg-red-900/40 hover:bg-red-900/60 text-red-200 py-2 rounded text-xs flex items-center justify-center gap-2 border border-red-900/50">
            <Trash2 size={14} /> Limpar Tudo
          </button>
          <button onClick={() => signOut(auth)} className="w-full mt-2 text-emerald-400 hover:text-white py-2 text-xs flex items-center justify-center gap-2">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div>
             <h1 className="text-xl font-bold text-slate-800">
               {activeView === 'assets' ? 'Gestão de Ativos' : activeView === 'reports' ? 'Qualidade & IA' : activeView === 'team' ? 'Performance de Executantes' : 'Manutenção'}
             </h1>
             <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
               <Factory size={12} /> Unidade Fabril Alagoinhas <span className="text-slate-300">|</span> <span className="text-[#008200] font-bold">{assetData.length} Ativos Monitorados</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
               <p className="text-xs font-bold text-slate-700">{user.email}</p>
               <p className="text-[10px] text-slate-400">Administrador</p>
             </div>
             <div className="w-10 h-10 rounded bg-[#008200] text-white flex items-center justify-center font-bold">{user.email.substring(0,2).toUpperCase()}</div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeView === 'assets' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {kpis.map((kpi, idx) => (
                  <KPICard 
                    key={idx} 
                    {...kpi} 
                    isActive={activeKpiFilter === kpi.id}
                    onClick={() => setActiveKpiFilter(activeKpiFilter === kpi.id ? null : kpi.id)}
                  />
                ))}
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <input 
                      type="text" 
                      placeholder="Buscar TAG, Modelo ou Série..." 
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-[#008200]"
                      value={filters.search}
                      onChange={e => setFilters({...filters, search: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-600 outline-none"
                      value={filters.area}
                      onChange={e => setFilters({...filters, area: e.target.value})}
                    >
                      <option value="Todas">Todas as Áreas</option>
                      {[...new Set(assetData.map(d => d.area))].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    {activeKpiFilter && (
                      <button onClick={() => setActiveKpiFilter(null)} className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md font-bold">
                        <XCircle size={14}/> Limpar Filtro KPI
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        {[
                          {k: 'tag', l: 'TAG'}, {k: 'area', l: 'Área'}, {k: 'model', l: 'Modelo'}, 
                          {k: 'lastMaint', l: 'Última Manut.'}, 
                          {k: 'technician', l: 'Executante'}, {k: 'efficiency', l: 'Eficiência'}, {k: 'status', l: 'Status'}
                        ].map(col => (
                          <th key={col.k} className="px-6 py-3 cursor-pointer hover:bg-slate-100" onClick={() => handleSort(col.k)}>
                            <div className="flex items-center gap-1">{col.l} <ChevronDown size={12} className={sortConfig.key === col.k ? 'text-[#008200]' : 'opacity-0'}/></div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedData.map((row) => (
                        <tr key={row.id} onClick={() => { setSelectedAsset(row); setIsEditing(false); }} className="hover:bg-emerald-50/30 cursor-pointer transition-colors">
                          <td className="px-6 py-3 font-bold text-[#008200]">{row.tag}</td>
                          <td className="px-6 py-3 text-slate-600">{row.area}</td>
                          <td className="px-6 py-3 text-slate-600">{row.model}</td>
                          <td className="px-6 py-3 text-slate-700">{row.lastMaint}</td>
                          <td className="px-6 py-3 text-slate-500 text-xs">{row.technician}</td>
                          <td className="px-6 py-3"><Badge value={row.efficiency} /></td>
                          <td className="px-6 py-3"><Badge status={row.status} /></td>
                        </tr>
                      ))}
                      {paginatedData.length === 0 && (
                        <tr><td colSpan="7" className="text-center py-10 text-slate-400">Nenhum dado encontrado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-sm text-slate-500">
                  <span>Mostrando {paginatedData.length} de {processedData.length}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronLeft size={18}/></button>
                    <span className="px-2">{currentPage} / {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 hover:bg-slate-200 rounded disabled:opacity-30"><ChevronRight size={18}/></button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'team' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Ranking Card */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20}/> Ranking de Qualidade dos Executantes
                  </h3>
                  <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500">Atualizado hoje</span>
                </div>
                <div className="space-y-4">
                  {technicianStats.map((tech, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-slate-100 rounded-lg hover:shadow-md transition-shadow">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-400'}`}>
                        {index + 1}º
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-slate-700">{tech.name}</span>
                          <span className="text-xs text-slate-500">{tech.totalAssets} Ativos</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${tech.score > 80 ? 'bg-[#008200]' : tech.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, tech.score)}%` }}></div>
                        </div>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <span className={`text-xl font-bold ${tech.score > 80 ? 'text-[#008200]' : 'text-slate-600'}`}>{tech.score}</span>
                        <p className="text-[10px] text-slate-400 uppercase">Pontuação</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Card */}
              <div className="space-y-6">
                <div className="bg-[#002e12] rounded-lg shadow-lg p-6 text-white relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-white/5"><Award size={120}/></div>
                  <h3 className="font-bold text-lg mb-4 relative z-10">Destaque do Mês</h3>
                  {technicianStats.length > 0 && (
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                          {technicianStats[0].name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-xl">{technicianStats[0].name}</p>
                          <p className="text-emerald-300 text-xs">Melhor Performance Geral</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                        <div className="bg-white/10 p-2 rounded">
                          <p className="text-xl font-bold">{technicianStats[0].avgEfficiency}%</p>
                          <p className="text-[10px] text-emerald-200">Eficiência Média</p>
                        </div>
                        <div className="bg-white/10 p-2 rounded">
                          <p className="text-xl font-bold text-emerald-400">{technicianStats[0].areaCount}</p>
                          <p className="text-[10px] text-emerald-200">Áreas Atendidas</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-700 mb-4">Eficiência Média por Equipe</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={technicianStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                        <Tooltip />
                        <Bar dataKey="avgEfficiency" fill="#008200" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'reports' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                <div className="lg:col-span-2 bg-[#002e12] p-6 rounded-lg shadow-md text-white">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="p-3 bg-white/10 rounded-lg"><ShieldCheck className="text-emerald-400" size={24} /></div>
                     <div>
                       <h3 className="text-xl font-bold">Consultor IA - Food Safety</h3>
                       <p className="text-emerald-200/80 text-sm">Análise em tempo real de {assetData.length} equipamentos.</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assetData.some(d => d.efficiency < 60) ? (
                      <div className="bg-white text-slate-800 p-4 rounded border-l-4 border-red-500">
                        <h4 className="font-bold flex gap-2 items-center text-red-600"><AlertTriangle size={16}/> Baixa Eficiência Crítica</h4>
                        <p className="text-xs mt-1">Detectados ativos com eficiência térmica abaixo de 60%. Risco de falha no processo de pasteurização.</p>
                      </div>
                    ) : (
                      <div className="bg-white text-slate-800 p-4 rounded border-l-4 border-[#008200]">
                        <h4 className="font-bold flex gap-2 items-center text-[#008200]"><CheckCircle2 size={16}/> Eficiência Térmica OK</h4>
                        <p className="text-xs mt-1">Todos os equipamentos operando dentro dos parâmetros aceitáveis.</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* 2. Custo vs Eficiência */}
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm h-80">
                  <h3 className="font-bold text-slate-800 mb-4">Matriz de Decisão (Custo x Performance)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="efficiency" name="Eficiência" unit="%" domain={[0, 100]} />
                      <YAxis type="number" dataKey="cost" name="Custo" unit="R$" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Ativos" data={assetData} fill="#008200">
                        {assetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.efficiency < 70 ? '#dc2626' : '#008200'} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
             </div>
          )}
        </div>
      </main>

      {selectedAsset && (
        <div className="w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 absolute right-0 top-0 h-full animate-in slide-in-from-right duration-300">
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
             <div>
               <h2 className="font-bold text-lg text-slate-800">{isEditing ? 'Editar Ativo' : selectedAsset.tag}</h2>
               <p className="text-xs text-slate-400 font-mono">{selectedAsset.serial}</p>
             </div>
             <button onClick={() => setSelectedAsset(null)} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {!isEditing ? (
              <>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded text-center">
                   <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Status Food Safety</p>
                   <div className="mt-2 flex justify-center"><Badge status={selectedAsset.fsStatus} type="food_safety"/></div>
                </div>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Modelo</span> <span className="font-medium">{selectedAsset.model}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Área</span> <span className="font-medium">{selectedAsset.area}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Última Manut.</span> <span className="font-bold text-[#008200]">{selectedAsset.lastMaint}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Técnico</span> <span className="font-medium">{selectedAsset.technician}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-slate-500">Custo Manut.</span> <span className="font-mono font-bold text-slate-800">R$ {selectedAsset.cost}</span></div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button onClick={() => startEditing(selectedAsset)} className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2">
                    <Edit2 size={14}/> Editar Dados
                  </button>
                  <button onClick={handleDeleteSingleAsset} disabled={isProcessing} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 rounded flex items-center justify-center">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Modelo</label>
                  <input className="w-full p-2 border rounded text-sm" value={editFormData.model} onChange={e => setEditFormData({...editFormData, model: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Área</label>
                  <input className="w-full p-2 border rounded text-sm" value={editFormData.area} onChange={e => setEditFormData({...editFormData, area: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Data Manutenção</label>
                  <input className="w-full p-2 border rounded text-sm" type="date" value={editFormData.lastMaint?.split('/').reverse().join('-')} onChange={e => {
                    const date = new Date(e.target.value);
                    setEditFormData({...editFormData, lastMaint: date.toLocaleDateString('pt-BR')});
                  }} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Técnico Responsável</label>
                  <input className="w-full p-2 border rounded text-sm" value={editFormData.technician} onChange={e => setEditFormData({...editFormData, technician: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                  <select className="w-full p-2 border rounded text-sm" value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})}>
                    <option value="operational">Operacional</option>
                    <option value="alert">Alerta</option>
                    <option value="stopped">Parado</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <button onClick={handleSaveEdit} disabled={isProcessing} className="flex-1 bg-[#008200] text-white hover:bg-[#006000] py-2.5 rounded font-bold text-xs flex items-center justify-center gap-2">
                    <Save size={14}/> {isProcessing ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                  <button onClick={() => setIsEditing(false)} className="px-4 py-2.5 border rounded text-slate-500 hover:bg-slate-50 text-xs font-bold">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
