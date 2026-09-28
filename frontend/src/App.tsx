import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, Calendar, User, PlusCircle, Users, CheckCircle2, Clock, Search,
  Send, RefreshCw, FileText, Type, LayoutGrid, Trash2, FilePlus,
  IndianRupee, History, X, AlertCircle, ArrowLeft, Plus, Sparkles, ChevronRight
} from 'lucide-react';

interface Template {
  _id: string;
  title: string;
  subject: string;
  message: string;
}

interface Schedule {
  _id: string;
  templateId: Template;
  triggerType: 'DAILY_BEFORE_DUE' | 'DAILY_OVERDUE' | 'SPECIFIC_DATE' | 'ON_PAID';
  specificDate?: string;
  sendTime: string;
  isActive: boolean;
  lastSentAt?: string;
}

interface Client {
  _id: string;
  name: string;
  uniqueId: string;
  email: string;
  baseAmount: number;
  uniqueAmount: number;
  startDate: string;
  dueDate: string;
  endDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  schedules: Schedule[];
  createdAt: string;
}

interface EmailLog {
  _id: string;
  client: Client;
  template: Template;
  sentAt: string;
  type: string;
  status: 'SENT' | 'FAILED';
  errorMsg?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'clients' | 'templates'>('clients');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const now = new Date();
  const defaultToday = now.toISOString().split('T')[0];
  const nextWeek = new Date(now.setDate(now.getDate() + 7)).toISOString().split('T')[0];
  const nextMonth = new Date(now.setDate(now.getDate() + 30)).toISOString().split('T')[0];

  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    baseAmount: '',
    startDate: defaultToday,
    dueDate: nextWeek,
    endDate: nextMonth
  });

  const [scheduleForm, setScheduleForm] = useState({
    templateId: '',
    triggerType: 'DAILY_BEFORE_DUE',
    specificDate: defaultToday,
    sendTime: '09:00'
  });

  const [templateForm, setTemplateForm] = useState({ title: '', subject: '', message: '' });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showLogsFor, setShowLogsFor] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [tRes, cRes, lRes] = await Promise.all([
        axios.get(`${API_URL}/templates`),
        axios.get(`${API_URL}/clients`),
        axios.get(`${API_URL}/logs`)
      ]);
      setTemplates(tRes.data);
      setClients(cRes.data);
      setLogs(lRes.data);

      if (selectedClient) {
        const updated = cRes.data.find((c: Client) => c._id === selectedClient._id);
        if (updated) setSelectedClient(updated);
      }
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/clients`, { ...clientForm, baseAmount: Number(clientForm.baseAmount) });
      setClientForm(prev => ({ ...prev, name: '', email: '', baseAmount: '' }));
      fetchData();
      alert('Client Added! Click on the client row to customize Drip Emails.');
    } catch (error) {
      alert('Failed to add client.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !scheduleForm.templateId) return;
    try {
      await axios.post(`${API_URL}/clients/${selectedClient._id}/schedules`, scheduleForm);
      setScheduleForm({ templateId: '', triggerType: 'DAILY_BEFORE_DUE', specificDate: defaultToday, sendTime: '09:00' });
      fetchData();
    } catch (error) {
      alert('Failed to add schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!selectedClient || !confirm('Delete this drip schedule?')) return;
    try {
      await axios.delete(`${API_URL}/clients/${selectedClient._id}/schedules/${scheduleId}`);
      fetchData();
    } catch (error) {
      alert('Failed to delete schedule');
    }
  };

  const handleMarkPaid = async (id: string, name: string) => {
    if(!confirm(`Mark ${name} as PAID?`)) return;
    try {
      await axios.put(`${API_URL}/clients/${id}/pay`);
      fetchData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/templates`, templateForm);
      setTemplateForm({ title: '', subject: '', message: '' });
      fetchData();
      alert('Template saved!');
    } catch (error) {
      alert('Failed to save template.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await axios.delete(`${API_URL}/templates/${id}`);
    fetchData();
  };

  const insertVariable = (variable: string) => {
    setTemplateForm(prev => ({ ...prev, message: prev.message + ` ${variable}` }));
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.uniqueId.toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = clients.filter(c => c.status === 'PENDING').length;
  const overdueCount = clients.filter(c => c.status === 'OVERDUE').length;
  const totalRevenue = clients.filter(c => c.status === 'PAID').reduce((acc, c) => acc + c.uniqueAmount, 0);

  return (
    <div className="min-h-screen bg-[#DFF6FF] text-slate-800 font-sans antialiased pb-16 relative selection:bg-[#5F2CFF]/20 selection:text-[#5F2CFF]">
      {/* Liquid Ambient Blurred Orbs for iOS Glass Effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-[#5F2CFF]/22 rounded-full blur-[115px] animate-pulse"></div>
        <div className="absolute top-1/4 -right-32 w-[38rem] h-[38rem] bg-cyan-300/35 rounded-full blur-[135px]"></div>
        <div className="absolute -bottom-36 left-1/3 w-[36rem] h-[36rem] bg-indigo-300/30 rounded-full blur-[125px]"></div>
        <div className="absolute top-2/3 right-1/4 w-80 h-80 bg-violet-300/25 rounded-full blur-[95px]"></div>
      </div>

      {/* Floating iOS Glass Navbar */}
      <header className="sticky top-4 z-40 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="ios-glass rounded-3xl h-16 px-5 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-[#5F2CFF] to-[#8A63FF] rounded-2xl shadow-[0_8px_20px_-3px_rgba(95,44,255,0.45)] text-white">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#5F2CFF] tracking-tight">Devoraaa</h1>
                <span className="text-[10px] bg-[#5F2CFF]/12 text-[#5F2CFF] font-bold px-2 py-0.5 rounded-full border border-[#5F2CFF]/20">iOS Liquid</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Automated Client Invoicing Platform</p>
            </div>
          </div>

          {/* Segmented iOS Nav Control */}
          <div className="flex items-center bg-white/35 backdrop-blur-xl p-1 rounded-2xl border border-white/70 shadow-inner">
            <button 
              onClick={() => { setActiveTab('clients'); setSelectedClient(null); }} 
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'clients' 
                  ? 'bg-gradient-to-r from-[#5F2CFF] to-[#7B4EFF] text-white shadow-[0_4px_14px_rgba(95,44,255,0.38),inset_0_1px_1px_rgba(255,255,255,0.4)] scale-[1.02]' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Client CRM</span>
            </button>
            <button 
              onClick={() => { setActiveTab('templates'); setSelectedClient(null); }} 
              className={`flex items-center space-x-2 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                activeTab === 'templates' 
                  ? 'bg-gradient-to-r from-[#5F2CFF] to-[#7B4EFF] text-white shadow-[0_4px_14px_rgba(95,44,255,0.38),inset_0_1px_1px_rgba(255,255,255,0.4)] scale-[1.02]' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>
          </div>

          <button 
            onClick={fetchData} 
            className="flex items-center space-x-2 text-xs ios-glass-subtle hover:bg-white/75 text-slate-700 font-semibold px-3 py-2 rounded-2xl shadow-sm border border-white/80 active:scale-95 transition-all"
            title="Sync Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5F2CFF] ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-bold">Sync</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-7 space-y-7">
        
        {/* Metric Cards - iOS Glass Widgets */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="ios-glass p-5 rounded-3xl flex items-center space-x-4 ios-glass-hover">
            <div className="p-3 bg-gradient-to-br from-[#5F2CFF]/15 to-[#5F2CFF]/5 text-[#5F2CFF] rounded-2xl border border-[#5F2CFF]/20">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Clients</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{clients.length}</h3>
            </div>
          </div>

          <div className="ios-glass p-5 rounded-3xl flex items-center space-x-4 ios-glass-hover">
            <div className="p-3 bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 rounded-2xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{pendingCount}</h3>
            </div>
          </div>

          <div className="ios-glass p-5 rounded-3xl flex items-center space-x-4 ios-glass-hover">
            <div className="p-3 bg-gradient-to-br from-rose-500/15 to-rose-500/5 text-rose-600 rounded-2xl border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{overdueCount}</h3>
            </div>
          </div>

          <div className="ios-glass p-5 rounded-3xl flex items-center space-x-4 ios-glass-hover">
            <div className="p-3 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 rounded-2xl border border-emerald-500/20">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collected</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">₹{totalRevenue.toFixed(0)}</h3>
            </div>
          </div>
        </div>

        {/* DETAIL VIEW FOR A SELECTED CLIENT */}
        {activeTab === 'clients' && selectedClient && (
          <div className="space-y-6">
            <button 
              onClick={() => setSelectedClient(null)} 
              className="flex items-center space-x-2 text-slate-700 hover:text-[#5F2CFF] font-bold text-xs ios-glass-subtle hover:bg-white/80 px-4 py-2.5 rounded-2xl w-fit transition-all active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" /> <span>Back to All Clients</span>
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
              {/* Client Info Glass Card */}
              <div className="ios-glass p-6 sm:p-7 rounded-3xl space-y-5">
                <div>
                  <span className="text-[10px] font-mono uppercase bg-[#5F2CFF]/10 text-[#5F2CFF] px-2.5 py-1 rounded-full border border-[#5F2CFF]/15 font-bold">
                    {selectedClient.uniqueId}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-2">{selectedClient.name}</h2>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium">{selectedClient.email}</p>
                </div>

                <div className="p-4 ios-glass-subtle rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exact Due</span>
                    <p className="text-2xl font-black text-emerald-600 mt-0.5">₹{selectedClient.uniqueAmount.toFixed(2)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    selectedClient.status === 'PAID' 
                      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30' 
                      : 'bg-amber-500/15 text-amber-700 border-amber-400/30'
                  }`}>
                    {selectedClient.status}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs font-medium text-slate-600 pt-2">
                  <div className="flex justify-between items-center py-1 border-b border-white/50">
                    <span className="text-slate-400 font-semibold">Start Date</span>
                    <span className="font-bold text-slate-800">{new Date(selectedClient.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-white/50 text-rose-600">
                    <span className="font-semibold">Due Date</span>
                    <span className="font-bold">{new Date(selectedClient.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-semibold">End Date (Stop)</span>
                    <span className="font-bold text-slate-800">{new Date(selectedClient.endDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {selectedClient.status !== 'PAID' && (
                  <button 
                    onClick={() => handleMarkPaid(selectedClient._id, selectedClient.name)} 
                    className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-3.5 rounded-2xl shadow-[0_10px_25px_-5px_rgba(16,185,129,0.4),inset_0_1px_1px_rgba(255,255,255,0.4)] flex justify-center items-center space-x-2 active:scale-[0.98] transition-all"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Mark as PAID (Send Thank You)</span>
                  </button>
                )}
              </div>

              {/* Drip Campaigns Builder Glass Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="ios-glass p-6 sm:p-7 rounded-3xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/60 pb-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Custom Drip Sequence</h3>
                      <p className="text-xs text-slate-500">Configure multiple timed emails specifically for this client</p>
                    </div>
                    <span className="text-xs font-bold text-[#5F2CFF] bg-[#5F2CFF]/10 px-3 py-1 rounded-full border border-[#5F2CFF]/20">
                      {selectedClient.schedules.length} Drips Active
                    </span>
                  </div>
                  
                  {/* Add Drip Liquid Form */}
                  <form onSubmit={handleAddSchedule} className="ios-glass-subtle p-5 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Template</label>
                      <select 
                        className="w-full ios-input rounded-xl p-2.5 text-sm" 
                        value={scheduleForm.templateId} 
                        onChange={e => setScheduleForm({...scheduleForm, templateId: e.target.value})} 
                        required
                      >
                        <option value="">Select Template from Library...</option>
                        {templates.map(t => <option key={t._id} value={t._id}>{t.title} ({t.subject})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">When to send?</label>
                      <select 
                        className="w-full ios-input rounded-xl p-2.5 text-sm" 
                        value={scheduleForm.triggerType} 
                        onChange={e => setScheduleForm({...scheduleForm, triggerType: e.target.value as any})} 
                        required
                      >
                        <option value="DAILY_BEFORE_DUE">Daily Before Due Date</option>
                        <option value="DAILY_OVERDUE">Daily After Due Date (Overdue)</option>
                        <option value="ON_PAID">Instantly When Marked Paid</option>
                        <option value="SPECIFIC_DATE">On a Specific Date</option>
                      </select>
                    </div>
                    {scheduleForm.triggerType === 'SPECIFIC_DATE' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Specific Date</label>
                        <input 
                          type="date" 
                          className="w-full ios-input rounded-xl p-2.5 text-sm" 
                          value={scheduleForm.specificDate} 
                          onChange={e => setScheduleForm({...scheduleForm, specificDate: e.target.value})} 
                          required 
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Daily Mail Time</label>
                        <input 
                          type="time" 
                          disabled={scheduleForm.triggerType === 'ON_PAID'} 
                          className="w-full ios-input rounded-xl p-2.5 text-sm disabled:opacity-40" 
                          value={scheduleForm.sendTime} 
                          onChange={e => setScheduleForm({...scheduleForm, sendTime: e.target.value})} 
                          required 
                        />
                      </div>
                    )}
                    <div className="md:col-span-2 pt-1">
                      <button 
                        type="submit" 
                        className="bg-gradient-to-r from-[#5F2CFF] to-[#7B4EFF] hover:opacity-95 text-white font-bold py-2.5 px-5 rounded-xl shadow-[0_8px_20px_-3px_rgba(95,44,255,0.4),inset_0_1px_1px_rgba(255,255,255,0.35)] flex items-center space-x-2 text-xs active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" /><span>Add Drip Email to Sequence</span>
                      </button>
                    </div>
                  </form>

                  {/* Active Schedules Liquid List */}
                  <div className="space-y-3">
                    {selectedClient.schedules.length === 0 ? (
                      <div className="text-center py-8 ios-glass-subtle rounded-2xl text-slate-400 text-xs">
                        <Mail className="w-7 h-7 mx-auto mb-2 opacity-50 text-[#5F2CFF]" />
                        <p className="font-semibold">No drip emails configured for this client yet.</p>
                        <p className="text-[11px] mt-0.5">Use the form above to add custom reminder schedules.</p>
                      </div>
                    ) : (
                      selectedClient.schedules.map((s) => (
                        <div key={s._id} className="ios-glass-subtle p-4 rounded-2xl flex items-center justify-between hover:bg-white/60 transition-all">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-sm">{s.templateId?.title || 'Custom Template'}</span>
                            <span className="text-xs font-semibold text-[#5F2CFF] mt-0.5">
                              {s.triggerType.replace(/_/g, ' ')} 
                              {s.triggerType === 'SPECIFIC_DATE' ? ` on ${new Date(s.specificDate || '').toLocaleDateString()}` : ''}
                              {s.triggerType !== 'ON_PAID' ? ` at ${s.sendTime}` : ''}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteSchedule(s._id)} 
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                            title="Remove Drip"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIST VIEW FOR CLIENTS */}
        {activeTab === 'clients' && !selectedClient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            
            {/* Create Client Form - Pure Glass */}
            <div className="ios-glass p-6 sm:p-7 rounded-3xl space-y-5">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-white/60">
                <PlusCircle className="w-5 h-5 text-[#5F2CFF]" />
                <h2 className="text-lg font-bold text-slate-900">Add New Client</h2>
              </div>
              <p className="text-xs text-slate-500">Fill basic details. You can configure multiple drips after creating.</p>

              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Client Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                    <input 
                      type="text" 
                      placeholder="e.g. Rahul Sharma" 
                      className="w-full ios-input rounded-2xl pl-10 pr-4 py-2.5 text-sm" 
                      value={clientForm.name} 
                      onChange={e => setClientForm({ ...clientForm, name: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                    <input 
                      type="email" 
                      placeholder="client@company.com" 
                      className="w-full ios-input rounded-2xl pl-10 pr-4 py-2.5 text-sm" 
                      value={clientForm.email} 
                      onChange={e => setClientForm({ ...clientForm, email: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Invoice Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                    <input 
                      type="number" 
                      placeholder="5000" 
                      className="w-full ios-input rounded-2xl pl-10 pr-4 py-2.5 text-sm" 
                      value={clientForm.baseAmount} 
                      onChange={e => setClientForm({ ...clientForm, baseAmount: e.target.value })} 
                      required 
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">Auto-assigns unique decimal (e.g. ₹5000.01) for 0-fee tracking.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
                    <input 
                      type="date" 
                      className="w-full ios-input rounded-2xl px-3 py-2 text-xs sm:text-sm" 
                      value={clientForm.startDate} 
                      onChange={e => setClientForm({ ...clientForm, startDate: e.target.value })} 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
                    <input 
                      type="date" 
                      className="w-full ios-input rounded-2xl px-3 py-2 text-xs sm:text-sm text-rose-600 font-bold" 
                      value={clientForm.dueDate} 
                      onChange={e => setClientForm({ ...clientForm, dueDate: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">End Date (Stop Mails)</label>
                  <input 
                    type="date" 
                    className="w-full ios-input rounded-2xl px-3 py-2.5 text-xs sm:text-sm" 
                    value={clientForm.endDate} 
                    onChange={e => setClientForm({ ...clientForm, endDate: e.target.value })} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-[#5F2CFF] to-[#7B4EFF] hover:opacity-95 text-white font-bold py-3.5 rounded-2xl shadow-[0_10px_25px_-4px_rgba(95,44,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4" /><span>Create Client Profile</span></>}
                </button>
              </form>
            </div>

            {/* Clients Directory Glass Table */}
            <div className="lg:col-span-2 space-y-6">
              <div className="ios-glass p-6 sm:p-7 rounded-3xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/60">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Clients Directory</h2>
                    <p className="text-xs text-slate-500">Click on any client to customize their personal drip sequences</p>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      placeholder="Search by name, ID or email..." 
                      className="ios-input rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm w-full sm:w-64" 
                      value={search} 
                      onChange={e => setSearch(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/50">
                        <th className="pb-3 px-3">Client / ID</th>
                        <th className="pb-3 px-3">Amount</th>
                        <th className="pb-3 px-3">Due Date</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/40">
                      {filteredClients.map((client) => {
                        const isPaid = client.status === 'PAID';
                        const isOverdue = client.status === 'OVERDUE' || (!isPaid && new Date() > new Date(client.dueDate));
                        return (
                          <tr 
                            key={client._id} 
                            onClick={() => setSelectedClient(client)}
                            className="group hover:bg-white/50 cursor-pointer transition-all duration-200 rounded-2xl"
                          >
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-slate-900 group-hover:text-[#5F2CFF] transition-colors">{client.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono bg-white/50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-white/60">
                                {client.uniqueId}
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 text-xs">
                                ₹{client.uniqueAmount.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-xs font-semibold text-slate-600">
                              <span className={isOverdue && !isPaid ? 'text-rose-600 font-bold' : ''}>
                                {new Date(client.dueDate).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                isPaid ? 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30' : 
                                isOverdue ? 'bg-rose-500/15 text-rose-700 border-rose-400/30' : 'bg-amber-500/15 text-amber-700 border-amber-400/30'
                              }`}>
                                {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setShowLogsFor(client._id); }} 
                                  className="text-[11px] ios-glass-subtle hover:bg-white/80 font-bold text-slate-700 px-3 py-1.5 rounded-xl border border-white/80 shadow-sm active:scale-95 transition-all"
                                >
                                  Logs
                                </button>
                                <div className="p-1 text-slate-400 group-hover:text-[#5F2CFF] transition-colors">
                                  <ChevronRight className="w-4 h-4" />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredClients.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400 text-xs font-medium">
                            No clients found. Click "Create Client Profile" to add your first client.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL TEMPLATES LIBRARY PAGE */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
            <div className="ios-glass p-6 sm:p-7 rounded-3xl space-y-5">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-white/60">
                <FilePlus className="w-5 h-5 text-[#5F2CFF]" />
                <h2 className="text-lg font-bold text-slate-900">Create Template</h2>
              </div>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Template Internal Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Day 1 Welcome & Invoice" 
                    className="w-full ios-input rounded-2xl px-4 py-2.5 text-sm" 
                    value={templateForm.title} 
                    onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Subject Line</label>
                  <input 
                    type="text" 
                    placeholder="Reminder: Invoice for {{name}}" 
                    className="w-full ios-input rounded-2xl px-4 py-2.5 text-sm" 
                    value={templateForm.subject} 
                    onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Message Body</label>
                    <div className="flex space-x-1.5">
                      <button 
                        type="button" 
                        onClick={() => insertVariable('{{name}}')} 
                        className="text-[10px] bg-[#5F2CFF]/12 text-[#5F2CFF] font-bold px-2 py-0.5 rounded-lg border border-[#5F2CFF]/20 hover:bg-[#5F2CFF]/20 transition-all"
                      >
                        + Name
                      </button>
                      <button 
                        type="button" 
                        onClick={() => insertVariable('{{remaining_days}}')} 
                        className="text-[10px] bg-rose-500/12 text-rose-600 font-bold px-2 py-0.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/20 transition-all"
                      >
                        + Days Left
                      </button>
                    </div>
                  </div>
                  <textarea 
                    rows={6} 
                    placeholder="Hi {{name}}, your payment is pending. Only {{remaining_days}} days left to clear it..." 
                    className="w-full ios-input rounded-2xl px-4 py-2.5 text-sm" 
                    value={templateForm.message} 
                    onChange={e => setTemplateForm({ ...templateForm, message: e.target.value })} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#5F2CFF] to-[#7B4EFF] hover:opacity-95 text-white font-bold py-3.5 rounded-2xl shadow-[0_10px_25px_-4px_rgba(95,44,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-all active:scale-[0.98] text-sm"
                >
                  Save to Template Library
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="ios-glass p-6 sm:p-7 rounded-3xl space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/60">
                  <h2 className="text-lg font-bold text-slate-900">Saved Templates</h2>
                  <span className="text-xs font-bold text-[#5F2CFF] bg-[#5F2CFF]/10 px-3 py-1 rounded-full border border-[#5F2CFF]/20">
                    {templates.length} Ready
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(t => (
                    <div key={t._id} className="ios-glass-subtle rounded-2xl p-5 shadow-sm space-y-3 relative group hover:bg-white/65 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{t.title}</h3>
                          <p className="text-xs text-[#5F2CFF] font-semibold mt-0.5">Subject: {t.subject}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteTemplate(t._id)} 
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-500/10 transition-all opacity-70 group-hover:opacity-100"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-600 bg-white/40 p-3 rounded-xl border border-white/60 whitespace-pre-wrap max-h-28 overflow-y-auto font-mono">
                        {t.message}
                      </div>
                    </div>
                  ))}
                  {templates.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-slate-400 text-xs">
                      No templates created yet. Use the form on the left to add your first template.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* iOS LIQUID GLASS LOGS MODAL */}
      {showLogsFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-md flex items-center justify-center p-4">
          <div className="ios-glass rounded-3xl w-full max-w-xl max-h-[80vh] flex flex-col shadow-[0_25px_60px_rgba(0,0,0,0.18)] overflow-hidden">
            <div className="p-5 border-b border-white/60 flex justify-between items-center bg-white/30">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#5F2CFF]/15 text-[#5F2CFF] rounded-xl">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Email Delivery Logs</h3>
                  <p className="text-[11px] text-slate-500">Track delivery history and status</p>
                </div>
              </div>
              <button 
                onClick={() => setShowLogsFor(null)} 
                className="p-2 hover:bg-white/60 rounded-xl text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {logs.filter(l => l.client?._id === showLogsFor).map(log => (
                <div key={log._id} className="ios-glass-subtle p-3.5 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#5F2CFF] bg-[#5F2CFF]/12 px-2 py-0.5 rounded-full border border-[#5F2CFF]/20">
                      {log.type.replace('_', ' ')}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 mt-1">{log.template?.title || 'System Notification'}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(log.sentAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                    log.status === 'SENT' 
                      ? 'bg-emerald-500/15 text-emerald-700 border-emerald-400/30' 
                      : 'bg-rose-500/15 text-rose-700 border-rose-400/30'
                  }`}>
                    {log.status === 'SENT' ? 'Delivered' : 'Failed'}
                  </span>
                </div>
              ))}
              {logs.filter(l => l.client?._id === showLogsFor).length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Mail className="w-7 h-7 mx-auto mb-2 opacity-40 text-slate-400" />
                  No delivery logs recorded for this client yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
