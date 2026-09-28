import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, Calendar, User, PlusCircle, Users, CheckCircle2, Clock, Search,
  Send, RefreshCw, FileText, Type, LayoutGrid, Trash2, FilePlus,
  IndianRupee, History, X, AlertCircle, ArrowLeft, Plus
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
      alert('Client Added! Click on the client row to add Drip Emails.');
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
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#DFF6FF] text-slate-800 font-sans antialiased pb-12">
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#5F2CFF] rounded-xl shadow-lg shadow-[#5F2CFF]/30 text-white">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#5F2CFF] tracking-tight">Devoraaa</h1>
              <p className="text-xs text-slate-500 font-medium">Automated Client Invoicing</p>
            </div>
          </div>

          <div className="flex items-center bg-white/80 p-1 rounded-xl border border-slate-200/80">
            <button onClick={() => { setActiveTab('clients'); setSelectedClient(null); }} className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'clients' ? 'bg-[#5F2CFF] text-white shadow-md' : 'text-slate-600'}`}>
              <Users className="w-4 h-4" /><span>Client CRM</span>
            </button>
            <button onClick={() => { setActiveTab('templates'); setSelectedClient(null); }} className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'templates' ? 'bg-[#5F2CFF] text-white shadow-md' : 'text-slate-600'}`}>
              <FileText className="w-4 h-4" /><span>Templates</span>
            </button>
          </div>

          <button onClick={fetchData} className="flex items-center space-x-2 text-xs bg-white text-slate-700 font-semibold px-3 py-2 rounded-xl shadow-sm border border-slate-200">
            <RefreshCw className={`w-3.5 h-3.5 text-[#5F2CFF] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* DETAIL VIEW FOR A SELECTED CLIENT */}
        {activeTab === 'clients' && selectedClient && (
          <div className="space-y-6 animate-fadeIn">
            <button onClick={() => setSelectedClient(null)} className="flex items-center space-x-2 text-slate-600 hover:text-[#5F2CFF] font-bold text-sm bg-white/50 px-4 py-2 rounded-xl w-fit">
              <ArrowLeft className="w-4 h-4" /> <span>Back to Client List</span>
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Client Info Card */}
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 space-y-4 h-fit">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedClient.name}</h2>
                  <p className="text-slate-500 text-sm">{selectedClient.email}</p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Amount Due</span>
                  <span className="text-xl font-black text-emerald-600">₹{selectedClient.uniqueAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-semibold">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedClient.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {selectedClient.status}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-medium text-slate-600">
                  <div className="flex justify-between"><span>Start Date:</span><span>{new Date(selectedClient.startDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between text-rose-600 font-bold"><span>Due Date:</span><span>{new Date(selectedClient.dueDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span>End Date (Stop Mails):</span><span>{new Date(selectedClient.endDate).toLocaleDateString()}</span></div>
                </div>
                {selectedClient.status !== 'PAID' && (
                  <button onClick={() => handleMarkPaid(selectedClient._id, selectedClient.name)} className="w-full mt-4 bg-emerald-500 text-white font-bold py-3 rounded-xl shadow flex justify-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" /><span>Mark as PAID</span>
                  </button>
                )}
              </div>

              {/* Drip Campaigns Builder */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Custom Drip Schedule</h3>
                  
                  {/* Add Drip Form */}
                  <form onSubmit={handleAddSchedule} className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Template</label>
                      <select className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" value={scheduleForm.templateId} onChange={e => setScheduleForm({...scheduleForm, templateId: e.target.value})} required>
                        <option value="">Select Template...</option>
                        {templates.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">When to send?</label>
                      <select className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" value={scheduleForm.triggerType} onChange={e => setScheduleForm({...scheduleForm, triggerType: e.target.value as any})} required>
                        <option value="DAILY_BEFORE_DUE">Daily Before Due Date</option>
                        <option value="DAILY_OVERDUE">Daily After Due Date (Overdue)</option>
                        <option value="ON_PAID">Instantly On Payment</option>
                        <option value="SPECIFIC_DATE">On a Specific Date</option>
                      </select>
                    </div>
                    {scheduleForm.triggerType === 'SPECIFIC_DATE' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Specific Date</label>
                        <input type="date" className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm" value={scheduleForm.specificDate} onChange={e => setScheduleForm({...scheduleForm, specificDate: e.target.value})} required />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Daily Time</label>
                        <input type="time" disabled={scheduleForm.triggerType === 'ON_PAID'} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm disabled:opacity-50" value={scheduleForm.sendTime} onChange={e => setScheduleForm({...scheduleForm, sendTime: e.target.value})} required />
                      </div>
                    )}
                    <div className="md:col-span-2 pt-2">
                      <button type="submit" className="bg-[#5F2CFF] text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 text-sm">
                        <Plus className="w-4 h-4" /><span>Add to Schedule</span>
                      </button>
                    </div>
                  </form>

                  {/* Active Schedules List */}
                  <div className="space-y-3">
                    {selectedClient.schedules.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">No drip emails configured for this client.</p>
                    ) : (
                      selectedClient.schedules.map((s, idx) => (
                        <div key={s._id} className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800">{s.templateId?.title || 'Unknown Template'}</span>
                            <span className="text-xs font-semibold text-[#5F2CFF]">
                              {s.triggerType.replace(/_/g, ' ')} 
                              {s.triggerType === 'SPECIFIC_DATE' ? ` (${new Date(s.specificDate || '').toLocaleDateString()})` : ''}
                              {s.triggerType !== 'ON_PAID' ? ` at ${s.sendTime}` : ''}
                            </span>
                          </div>
                          <button onClick={() => handleDeleteSchedule(s._id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Add New Client</h2>
              <form onSubmit={handleClientSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Name</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={clientForm.name} onChange={e => setClientForm({ ...clientForm, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
                  <input type="email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={clientForm.email} onChange={e => setClientForm({ ...clientForm, email: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Base Amount (₹)</label>
                  <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm" value={clientForm.baseAmount} onChange={e => setClientForm({ ...clientForm, baseAmount: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Start Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm" value={clientForm.startDate} onChange={e => setClientForm({ ...clientForm, startDate: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm" value={clientForm.dueDate} onChange={e => setClientForm({ ...clientForm, dueDate: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">End Date</label>
                  <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm" value={clientForm.endDate} onChange={e => setClientForm({ ...clientForm, endDate: e.target.value })} required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-[#5F2CFF] text-white font-bold py-3 rounded-xl shadow-lg">
                  {loading ? 'Creating...' : 'Create Client Profile'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <h2 className="text-lg font-bold text-slate-900">Clients Directory</h2>
                  <input type="text" placeholder="Search..." className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-1.5 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                        <th className="pb-2 px-2">Client</th>
                        <th className="pb-2 px-2">Amount</th>
                        <th className="pb-2 px-2">Status</th>
                        <th className="pb-2 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClients.map((client) => (
                        <tr key={client._id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => setSelectedClient(client)}>
                          <td className="py-3 px-2 font-bold text-slate-900">{client.name}</td>
                          <td className="py-3 px-2 font-bold text-emerald-600">₹{client.uniqueAmount.toFixed(2)}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${client.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <button onClick={(e) => { e.stopPropagation(); setShowLogsFor(client._id); }} className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded">Logs</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL TEMPLATES LIBRARY PAGE */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Create Template</h2>
              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" value={templateForm.title} onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                  <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" value={templateForm.subject} onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })} required />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Message</label>
                    <div className="flex space-x-1">
                      <button type="button" onClick={() => insertVariable('{{name}}')} className="text-[10px] text-[#5F2CFF] font-bold">+ Name</button>
                      <button type="button" onClick={() => insertVariable('{{remaining_days}}')} className="text-[10px] text-rose-500 font-bold">+ Days Left</button>
                    </div>
                  </div>
                  <textarea rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm" value={templateForm.message} onChange={e => setTemplateForm({ ...templateForm, message: e.target.value })} required />
                </div>
                <button type="submit" className="w-full bg-[#5F2CFF] text-white font-bold py-3 rounded-xl shadow-lg">Save Template</button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 px-2">Saved Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                  <div key={t._id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2 relative group">
                    <div className="flex justify-between">
                      <h3 className="font-bold text-slate-900">{t.title}</h3>
                      <button onClick={() => handleDeleteTemplate(t._id)} className="text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-[#5F2CFF] font-semibold">Subject: {t.subject}</p>
                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap h-24 overflow-y-auto">{t.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* LOGS MODAL */}
      {showLogsFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between"><h3 className="font-bold">Email Logs</h3><button onClick={() => setShowLogsFor(null)}><X className="w-5 h-5"/></button></div>
            <div className="p-4 overflow-y-auto bg-slate-50 flex-1 space-y-3">
              {logs.filter(l => l.client?._id === showLogsFor).map(log => (
                <div key={log._id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#5F2CFF]">{log.type.replace('_', ' ')}</span>
                    <p className="text-xs font-semibold">{log.template?.title}</p>
                    <p className="text-[10px] text-slate-400">{new Date(log.sentAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-xs font-bold ${log.status === 'SENT' ? 'text-emerald-500' : 'text-rose-500'}`}>{log.status}</span>
                </div>
              ))}
              {logs.filter(l => l.client?._id === showLogsFor).length === 0 && <p className="text-center text-sm text-slate-400">No logs found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
