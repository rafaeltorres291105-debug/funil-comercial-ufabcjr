import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}`;
};

const COLUMNS = [
  { id: 'diagnostica', title: 'Diagnóstica', color: 'bg-col-diag', text: 'text-col-diag' },
  { id: 'alinhamento', title: 'Alinhamento', color: 'bg-col-alin', text: 'text-col-alin' },
  { id: 'proposta', title: 'Proposta', color: 'bg-col-prop', text: 'text-col-prop' },
  { id: 'negociacao', title: 'Negociação', color: 'bg-col-nego', text: 'text-col-nego' },
  { id: 'contrato', title: 'Contrato', color: 'bg-col-cont', text: 'text-col-cont' },
  { id: 'perdido', title: 'Saíram do Funil', color: 'bg-red-500', text: 'text-red-500' },
];

const SERVICE_TYPES = ['Gestão de Mídias', 'Mapeamento de Processos', 'Pesquisa de Mercado', 'Dados'];

const INITIAL_SEED_LEADS = [
  { columnId: 'diagnostica', company: 'Aquapolo', participants: [], proposalLink: '', journeyLink: '', notes: '', serviceType: 'Pesquisa de Mercado', rd1Date: '2026-09-12', rd2Date: '', proposalDate: '' },
  { columnId: 'diagnostica', company: 'Brasilata', participants: [{ id: 'p1', name: 'Felipe Ikeda', email: 'felipe.ikeda@ufabcjr.com.br' }], proposalLink: '', journeyLink: '', notes: '', serviceType: 'Mapeamento de Processos', rd1Date: '2026-09-15', rd2Date: '', proposalDate: '' },
  { columnId: 'diagnostica', company: 'Klin Produtos', participants: [{ id: 'p2', name: 'Leonardo Aguilar', email: 'leonardo.aguilar@ufabcjr.com.br' }], proposalLink: '', journeyLink: '', notes: '', serviceType: 'Dados', rd1Date: '', rd2Date: '', proposalDate: '' },
  { columnId: 'alinhamento', company: 'Ambev', participants: [{ id: 'p2', name: 'Leonardo Aguilar', email: 'leonardo.aguilar@ufabcjr.com.br' }, { id: 'p3', name: 'Alice', email: 'alice@ufabcjr.com.br' }], proposalLink: '', journeyLink: '', notes: '', serviceType: 'Mapeamento de Processos', rd1Date: '2026-09-10', rd2Date: '2026-09-18', proposalDate: '' },
  { columnId: 'alinhamento', company: 'Atlantis Consultoria', participants: [{ id: 'p1', name: 'Felipe Ikeda', email: 'felipe.ikeda@ufabcjr.com.br' }, { id: 'p4', name: 'Najla Gomes', email: 'najla.gomes@ufabcjr.com.br' }], proposalLink: '', journeyLink: '', notes: '', serviceType: 'Gestão de Mídias', rd1Date: '', rd2Date: '', proposalDate: '' },
  { columnId: 'proposta', company: 'Academia Gaviões', participants: [{ id: 'p5', name: 'Gustavo Sumita', email: 'gustavo.sumita@ufabcjr.com.br' }, { id: 'p6', name: 'Pedro Silva', email: 'pedro.silva@ufabcjr.com.br' }], proposalLink: 'https://docs.google.com/presentation/d/exemplo', journeyLink: '', notes: '', serviceType: 'Pesquisa de Mercado', rd1Date: '2026-09-01', rd2Date: '', proposalDate: '2026-09-22' },
  { columnId: 'negociacao', company: 'Local Service', participants: [{ id: 'p7', name: 'Caio Sperandio', email: 'caio.sperandio@ufabcjr.com.br' }, { id: 'p2', name: 'Leonardo Aguilar', email: 'leonardo.aguilar@ufabcjr.com.br' }], proposalLink: '', journeyLink: 'https://docs.google.com/spreadsheets/d/exemplo', notes: '', serviceType: 'Mapeamento de Processos', rd1Date: '2026-08-25', rd2Date: '', proposalDate: '2026-09-15' },
  { columnId: 'contrato', company: 'Joy Tênis', participants: [{ id: 'p1', name: 'Felipe Ikeda', email: 'felipe.ikeda@ufabcjr.com.br' }], proposalLink: '', journeyLink: '', notes: '', serviceType: 'Dados', rd1Date: '', rd2Date: '', proposalDate: '2026-09-05' },
  { columnId: 'perdido', company: 'Empresa Exemplo', participants: [{ id: 'p4', name: 'Najla Gomes', email: 'najla.gomes@ufabcjr.com.br' }], proposalLink: '', journeyLink: '', notes: 'Desistiu por orçamento', serviceType: 'Gestão de Mídias', rd1Date: '', rd2Date: '', proposalDate: '' },
];

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 60%, 40%)`;
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const LogoUFABC = ({ className = "text-3xl" }) => (
  <div className={`font-black tracking-tighter flex items-baseline select-none ${className} text-white`}>
    <span>UFABC</span>
    <span className="text-ufabc-yellow ml-1 italic font-bold text-[0.8em]">jr.</span>
  </div>
);

const Watermark = () => (
  <div className="fixed inset-0 z-[-1] flex items-center justify-center pointer-events-none opacity-[0.02] overflow-hidden select-none">
    <div className="text-[20vw] font-black tracking-tighter text-ufabc-green transform -rotate-12 whitespace-nowrap">
      CRM
    </div>
  </div>
);

const ParticipantBadge = ({ participant, showName = true, className = "" }) => {
  const color = stringToColor(participant.name);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0"
        style={{ backgroundColor: color }}
        title={participant.name}
      >
        {getInitials(participant.name)}
      </div>
      {showName && <span className="text-sm font-medium text-slate-600 truncate">{participant.name}</span>}
    </div>
  );
};

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [activeColId, setActiveColId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [activeParticipantFilter, setActiveParticipantFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal de edição/detalhes
  const [selectedLead, setSelectedLead] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantEmail, setNewParticipantEmail] = useState("");

  // 1. Escuta em tempo real do Firestore
  useEffect(() => {
    const leadsCollection = collection(db, 'leads');
    
    const unsubscribe = onSnapshot(leadsCollection, async (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_SEED_LEADS.forEach((lead) => {
          const newDocRef = doc(leadsCollection);
          batch.set(newDocRef, lead);
        });
        await batch.commit();
        return;
      }

      const leadsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      setLeads(leadsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro no Firestore:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Lista dinâmica de membros para filtro e auto-completar
  const uniqueParticipants = useMemo(() => {
    const names = new Set();
    leads.forEach(lead => {
      (lead.participants || []).forEach(p => {
        if (p?.name && p.name.trim()) {
          names.add(p.name.trim());
        }
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [leads]);

  // Drag & Drop
  const handleDragStart = (e, leadId) => {
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.classList.add('dragging'), 0);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedLeadId(null);
    setActiveColId(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (activeColId !== colId) setActiveColId(colId);
  };

  const handleDrop = async (e, colId) => {
    e.preventDefault();
    setActiveColId(null);
    if (!draggedLeadId) return;

    try {
      const leadDocRef = doc(db, 'leads', draggedLeadId);
      await updateDoc(leadDocRef, { columnId: colId });
    } catch (error) {
      console.error("Erro ao mover lead:", error);
    }
  };

  const openModal = (lead) => {
    setSelectedLead({ ...lead });
    setNewParticipantName("");
    setNewParticipantEmail("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewParticipantName("");
    setNewParticipantEmail("");
    setTimeout(() => setSelectedLead(null), 300);
  };

  // Adicionar participante à lista da reunião
  const addParticipantToList = () => {
    if (newParticipantName.trim() === '') return;
    
    const newP = { 
      id: Date.now().toString(), 
      name: newParticipantName.trim(),
      email: newParticipantEmail.trim()
    };

    setSelectedLead(prev => ({
      ...prev,
      participants: [...(prev.participants || []), newP]
    }));

    setNewParticipantName("");
    setNewParticipantEmail("");
  };

  const handleKeyDownParticipant = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addParticipantToList();
    }
  };

  const removeParticipant = (idToRemove) => {
    setSelectedLead(prev => ({
      ...prev,
      participants: (prev.participants || []).filter(p => p.id !== idToRemove)
    }));
  };

  // Salvar no Firebase
  const saveLeadDetails = async () => {
    if (!selectedLead?.id) return;
    try {
      let currentParticipants = [...(selectedLead.participants || [])];

      if (newParticipantName.trim() !== '') {
        currentParticipants.push({
          id: Date.now().toString(),
          name: newParticipantName.trim(),
          email: newParticipantEmail.trim()
        });
      }

      const { id, ...dataToSave } = {
        ...selectedLead,
        participants: currentParticipants
      };

      const leadDocRef = doc(db, 'leads', id);
      await updateDoc(leadDocRef, dataToSave);
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  // Excluir Lead (pode ser chamado do card ou do modal)
  const handleDeleteLead = async (leadId, e) => {
    if (e) e.stopPropagation();
    
    const leadTarget = leads.find(l => l.id === leadId);
    const companyName = leadTarget ? leadTarget.company : "este lead";

    if (window.confirm(`Tem certeza que deseja excluir "${companyName}"?`)) {
      try {
        await deleteDoc(doc(db, 'leads', leadId));
        if (selectedLead?.id === leadId) {
          closeModal();
        }
      } catch (error) {
        console.error("Erro ao excluir lead:", error);
      }
    }
  };

  // Criar novo lead
  const createNewLead = async () => {
    const newLeadData = {
      columnId: 'diagnostica',
      company: 'Novo Lead',
      participants: [],
      proposalLink: '',
      journeyLink: '',
      notes: '',
      serviceType: '',
      rd1Date: '',
      rd2Date: '',
      proposalDate: ''
    };

    try {
      const docRef = await addDoc(collection(db, 'leads'), newLeadData);
      openModal({ id: docRef.id, ...newLeadData });
    } catch (error) {
      console.error("Erro ao criar lead:", error);
    }
  };

  // Filtragem dos leads
  const filteredLeads = leads.filter(lead => {
    const matchService = activeFilter === 'Todos' || lead.serviceType === activeFilter;
    const matchSearch = lead.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchParticipant = activeParticipantFilter === 'Todos' || 
      (lead.participants || []).some(p => p?.name?.trim()?.toLowerCase() === activeParticipantFilter.trim().toLowerCase());
    return matchService && matchSearch && matchParticipant;
  });

  return (
    <div className="h-screen flex flex-col bg-ufabc-bg overflow-hidden">
      <Watermark />
      
      {/* Sugestões de nomes para auto-completar */}
      <datalist id="members-list">
        {uniqueParticipants.map(name => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {/* Header */}
      <header className="bg-ufabc-dark w-full shadow-md border-b border-gray-800 flex-shrink-0">
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <LogoUFABC />
            <div className="w-px h-8 bg-gray-700 hidden sm:block"></div>
            <h1 className="text-lg font-bold text-gray-300 hidden sm:block tracking-wide">
              Funil <span className="text-white">Comercial</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap xl:flex-nowrap gap-3 w-full xl:w-auto mt-2 sm:mt-0">
            {/* Filtro por Serviço */}
            <div className="relative group flex-1 sm:flex-none min-w-[150px]">
              <select 
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-8 rounded-xl bg-ufabc-green text-white hover:bg-ufabc-green-light transition-colors outline-none cursor-pointer text-sm font-medium border border-transparent focus:border-ufabc-yellow shadow-sm"
              >
                <option value="Todos">Todos os Serviços</option>
                {SERVICE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none text-xs"></i>
            </div>

            {/* Filtro por Membro */}
            <div className="relative group flex-1 sm:flex-none min-w-[150px]">
              <select 
                value={activeParticipantFilter}
                onChange={(e) => setActiveParticipantFilter(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 pr-8 rounded-xl bg-ufabc-green text-white hover:bg-ufabc-green-light transition-colors outline-none cursor-pointer text-sm font-medium border border-transparent focus:border-ufabc-yellow shadow-sm"
              >
                <option value="Todos">Todos os Membros ({uniqueParticipants.length})</option>
                {uniqueParticipants.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none text-xs"></i>
            </div>
            
            {/* Busca */}
            <div className="relative group flex-1 sm:flex-none min-w-[150px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/70">
                <i className="fa-solid fa-magnifying-glass text-xs"></i>
              </div>
              <input 
                type="text" 
                placeholder="Buscar empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-9 pr-4 py-2.5 rounded-xl bg-ufabc-green text-white hover:bg-ufabc-green-light focus:bg-ufabc-green-light transition-colors outline-none text-sm font-medium border border-transparent focus:border-ufabc-yellow placeholder-white/70 shadow-sm"
              />
            </div>

            <button 
              onClick={createNewLead}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-ufabc-yellow text-ufabc-dark font-black rounded-xl hover:bg-ufabc-yellow-hover transition-colors shadow-lg shadow-ufabc-yellow/20 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Novo Lead
            </button>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden kanban-scroll p-6">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex items-center gap-3 text-ufabc-green font-bold text-lg">
              <i className="fa-solid fa-circle-notch fa-spin text-2xl"></i>
              Sincronizando funil...
            </div>
          </div>
        ) : (
          <div className="flex gap-6 h-full items-start min-w-max pb-4">
            {COLUMNS.map(col => {
              const colLeads = filteredLeads.filter(l => l.columnId === col.id);
              const isOver = activeColId === col.id;

              return (
                <div 
                  key={col.id}
                  className={`w-80 flex flex-col h-full bg-slate-200/40 rounded-2xl border border-slate-200/60 transition-colors ${isOver ? 'bg-slate-200/80 border-slate-300 shadow-inner' : ''}`}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div className="p-4 pb-2 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${col.color} shadow-sm`}></div>
                      <h3 className={`font-bold text-sm tracking-wide ${col.text}`}>{col.title}</h3>
                      <span className="text-xs font-bold text-slate-400 ml-1">{colLeads.length}</span>
                    </div>
                  </div>

                  <div className="p-3 flex-1 overflow-y-auto space-y-3 no-scrollbar">
                    {colLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openModal(lead)}
                        className="bg-white p-4 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-100 cursor-grab active:cursor-grabbing hover:border-slate-300 transition-all hover:-translate-y-0.5 group relative"
                      >
                        {/* Cabeçalho do Card: Nome e Botão de Excluir Fácil */}
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2 truncate flex-1">
                            <i className="fa-regular fa-file-lines text-slate-400 group-hover:text-ufabc-green transition-colors flex-shrink-0"></i>
                            <span className="truncate">{lead.company}</span>
                          </h4>

                          {/* BOTÃO FÁCIL DE APAGAR À DIREITA DO LEAD */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteLead(lead.id, e)}
                            className="text-slate-300 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-60 hover:opacity-100 flex-shrink-0"
                            title="Excluir este Lead"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        </div>

                        {/* Tag do Serviço */}
                        {lead.serviceType && (
                          <div className="mb-2.5">
                            <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider rounded">
                              {lead.serviceType}
                            </span>
                          </div>
                        )}
                        
                        {/* Participantes */}
                        {(lead.participants || []).length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-2 my-2">
                            {lead.participants.map(p => (
                              <div key={p.id} className="flex items-center gap-1.5" title={p.name}>
                                <div 
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0"
                                  style={{ backgroundColor: stringToColor(p.name) }}
                                >
                                  {getInitials(p.name)}
                                </div>
                                <span className="text-[11px] font-medium text-slate-500 truncate max-w-[110px]">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* DATAS DAS REUNIÕES NO CARD */}
                        {(lead.rd1Date || lead.rd2Date || lead.proposalDate) && (
                          <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 bg-slate-50/70 p-2 rounded-lg">
                            {lead.rd1Date && (
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                  <i className="fa-regular fa-calendar text-blue-500 text-[9px]"></i> 1ª RD:
                                </span>
                                <span className="font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                                  {formatDate(lead.rd1Date)}
                                </span>
                              </div>
                            )}
                            {lead.rd2Date && (
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                  <i className="fa-regular fa-calendar text-amber-500 text-[9px]"></i> 2ª RD:
                                </span>
                                <span className="font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200/60">
                                  {formatDate(lead.rd2Date)}
                                </span>
                              </div>
                            )}
                            {lead.proposalDate && (
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-ufabc-green font-bold flex items-center gap-1.5">
                                  <i className="fa-regular fa-calendar-check text-ufabc-green text-[9px]"></i> Proposta:
                                </span>
                                <span className="font-bold text-ufabc-green bg-green-50 px-1.5 py-0.5 rounded border border-green-200/80">
                                  {formatDate(lead.proposalDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Indicadores de Links */}
                        {(lead.proposalLink || lead.journeyLink) && (
                          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-2.5">
                            {lead.proposalLink && <i className="fa-solid fa-file-powerpoint text-[10px] text-green-500 bg-green-50 p-1.5 rounded" title="Proposta Anexada"></i>}
                            {lead.journeyLink && <i className="fa-solid fa-file-excel text-[10px] text-blue-500 bg-blue-50 p-1.5 rounded" title="Jornada do Cliente Anexada"></i>}
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="h-10 w-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal de Detalhes do Lead */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header Modal */}
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4 flex-1">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${COLUMNS.find(c => c.id === selectedLead.columnId)?.color} bg-opacity-20 ${COLUMNS.find(c => c.id === selectedLead.columnId)?.text}`}>
                  {COLUMNS.find(c => c.id === selectedLead.columnId)?.title}
                </div>
                <input 
                  type="text" 
                  value={selectedLead.company || ""} 
                  onChange={(e) => setSelectedLead({...selectedLead, company: e.target.value})}
                  className="text-2xl font-black text-ufabc-dark bg-transparent border-none outline-none focus:ring-0 flex-1 hover:bg-slate-200/50 rounded px-2 py-1 transition-colors"
                  placeholder="Nome da Empresa"
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDeleteLead(selectedLead.id)} 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="Excluir Lead"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
                <button 
                  onClick={saveLeadDetails} 
                  className="px-5 py-2 bg-ufabc-green text-white text-sm font-bold rounded-xl hover:bg-ufabc-green-light transition-colors shadow-md"
                >
                  Salvar Alterações
                </button>
                <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                  <i className="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
            </div>

            {/* Corpo Modal */}
            <div className="p-8 overflow-y-auto flex-1 bg-white grid grid-cols-1 lg:grid-cols-5 gap-10">
              <div className="lg:col-span-3 space-y-7">
                
                {/* 1. Serviço Ofertado */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-tag text-ufabc-green"></i> Serviço Ofertado
                  </h3>
                  <select 
                    value={selectedLead.serviceType || ""}
                    onChange={(e) => setSelectedLead({...selectedLead, serviceType: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-ufabc-green focus:bg-white transition-all text-slate-700 font-medium cursor-pointer hover:bg-slate-100"
                  >
                    <option value="" disabled>Selecione a frente do projeto...</option>
                    {SERVICE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </section>

                {/* 2. DATAS DAS REUNIÕES (1ª RD, 2ª RD e Proposta) */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fa-regular fa-calendar-days text-ufabc-green"></i> Cronograma de Reuniões
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                        <i className="fa-regular fa-calendar text-blue-500 mr-1"></i> 1ª RD
                      </label>
                      <input 
                        type="date"
                        value={selectedLead.rd1Date || ""}
                        onChange={(e) => setSelectedLead({...selectedLead, rd1Date: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-ufabc-green font-medium text-slate-700 text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                        <i className="fa-regular fa-calendar text-amber-500 mr-1"></i> 2ª RD (Opcional)
                      </label>
                      <input 
                        type="date"
                        value={selectedLead.rd2Date || ""}
                        onChange={(e) => setSelectedLead({...selectedLead, rd2Date: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-ufabc-green font-medium text-slate-700 text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ufabc-green mb-1.5">
                        <i className="fa-regular fa-calendar-check text-ufabc-green mr-1"></i> Proposta
                      </label>
                      <input 
                        type="date"
                        value={selectedLead.proposalDate || ""}
                        onChange={(e) => setSelectedLead({...selectedLead, proposalDate: e.target.value})}
                        className="w-full bg-white border border-green-300 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-ufabc-green font-bold text-ufabc-green text-center"
                      />
                    </div>
                  </div>
                </section>

                {/* 3. Participantes da Reunião */}
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-users text-ufabc-green"></i> Participantes da Reunião
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
                    <div className="space-y-1 max-h-40 overflow-y-auto p-1 no-scrollbar">
                      {(selectedLead.participants || []).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm group">
                          <div className="flex flex-col">
                            <ParticipantBadge participant={p} />
                            {p.email && <span className="text
