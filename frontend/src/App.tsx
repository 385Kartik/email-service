import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, Calendar, User, PlusCircle, Users, CheckCircle2, Clock, Search,
  Sparkles, Send, RefreshCw, FileText, Type, LayoutGrid, Trash2, FilePlus,
  ChevronRight, IndianRupee, History, X, AlertCircle
} from 'lucide-react';

interface Template {
  _id: string;
  title: string;
  subject: string;
  message: string;
}

interface Client {
  _id: string;
  name: string;
  uniqueId: string;
  email: string;
  baseAmount: number;
  uniqueAmount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  sendTime: string;
  prePaymentTemplate: Template;
  postPaymentTemplate: Template;
  overdueTemplate: Template;
  lastSentAt?: string;
  createdAt: string;
}

interface EmailLog {
  _id: string;
  client: Client;
  template: Template;
  sentAt: string;
  type: 'PRE_PAYMENT' | 'POST_PAYMENT' | 'OVERDUE';
  status: 'SENT' | 'FAILED';
  errorMsg?: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'clients' | 'templates'>('clients');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);

  // Default dates
  const now = new Date();
  const nextWeek = new Date(now.setDate(now.getDate() + 7)).toISOString().split('T')[0];
  const defaultTime = `09:00`;

  // Client Form State
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    baseAmount: '',
    dueDate: nextWeek,
    sendTime: defaultTime,
    prePaymentTemplate: '',
    postPaymentTemplate: '',
    overdueTemplate: ''
  });

  // Template Form State
  const [templateForm, setTemplateForm] = useState({
    title: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Logs Modal State
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
      
      // Set defaults for dropdowns if available
      if (tRes.data.length > 0 && !clientForm.prePaymentTemplate) {
        setClientForm(prev => ({
          ...prev,
          prePaymentTemplate: tRes.data[0]._id,
          postPaymentTemplate: tRes.data[0]._id,
          overdueTemplate: tRes.data[0]._id
        }));
      }
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Client Creation
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.prePaymentTemplate || !clientForm.postPaymentTemplate || !clientForm.overdueTemplate) {
      alert('Please create and select all Email Templates first!');
      setActiveTab('templates');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/clients`, {
        ...clientForm,
        baseAmount: Number(clientForm.baseAmount)
      });

      setClientForm(prev => ({ 
        ...prev, 
        name: '', 
        email: '',
        baseAmount: ''
      }));

      fetchData();
      alert('⚡ Client Added & Campaign Started!');
    } catch (error) {
      console.error('Error adding client', error);
      alert('Failed to add client.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Mark Paid
  const handleMarkPaid = async (id: string, name: string) => {
    if(!confirm(`Are you sure you want to mark ${name} as PAID? This will instantly send them the Thank You email.`)) return;
    try {
      await axios.put(`${API_URL}/clients/${id}/pay`);
      fetchData();
      alert('✅ Marked as PAID and confirmation email sent!');
    } catch (error: any) {
      console.error('Error marking paid', error);
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  // Handle Template Creation
  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/templates`, templateForm);
      setTemplateForm({ title: '', subject: '', message: '' });
      fetchData();
      // Auto-assign newly created template to all dropdowns if they were empty
      if(!clientForm.prePaymentTemplate) {
        setClientForm(prev => ({
          ...prev,
          prePaymentTemplate: res.data._id,
          postPaymentTemplate: res.data._id,
          overdueTemplate: res.data._id
        }));
      }
      alert('✨ Template saved successfully!');
    } catch (error: any) {
      console.error('Error creating template', error);
      const msg = error.response?.data?.error || 'Failed to save template.';
      alert(`⚠️ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await axios.delete(`${API_URL}/templates/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting template', error);
    }
  };

  const insertVariable = (variable: string) => {
    setTemplateForm(prev => ({
      ...prev,
      message: prev.message + ` ${variable}`
    }));
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
    <div className="min-h-screen bg-[#DFF6FF] text-slate-800 font-sans antialiased pb-12 relative">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#5F2CFF] rounded-xl shadow-lg shadow-[#5F2CFF]/30 text-white">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#5F2CFF] tracking-tight">
                Devoraaa
              </h1>
              <p className="text-xs text-slate-500 font-medium">Automated Client Invoicing CRM</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-white/80 p-1 rounded-xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setActiveTab('clients')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'clients' 
                  ? 'bg-[#5F2CFF] text-white shadow-md shadow-[#5F2CFF]/20' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Client CRM</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'templates' 
                  ? 'bg-[#5F2CFF] text-white shadow-md shadow-[#5F2CFF]/20' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Email Library</span>
            </button>
          </div>

          <button 
            onClick={fetchData}
            className="flex items-center space-x-2 text-xs bg-white/80 hover:bg-white text-slate-700 font-semibold px-3 py-2 rounded-xl border border-white/90 shadow-sm transition active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#5F2CFF] ${refreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-white/80">
            <div className="p-3.5 bg-[#5F2CFF]/10 text-[#5F2CFF] rounded-xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Clients</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{clients.length}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-white/80">
            <div className="p-3.5 bg-amber-500/10 text-amber-600 rounded-xl">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Dues</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{pendingCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-white/80">
            <div className="p-3.5 bg-rose-500/10 text-rose-600 rounded-xl">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">{overdueCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-white/80">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <IndianRupee className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Received</p>
              <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹{totalRevenue.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        {/* TAB 1: CLIENTS CRM PAGE */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Create Client Form */}
            <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-200/60">
                <PlusCircle className="w-5 h-5 text-[#5F2CFF]" />
                <h2 className="text-lg font-bold text-slate-900">Add New Client Invoice</h2>
              </div>

              {templates.length === 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-3">
                  <p className="text-xs font-semibold text-amber-800">No email templates created yet!</p>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="text-xs bg-[#5F2CFF] text-white font-bold px-4 py-2 rounded-lg shadow"
                  >
                    Create Templates First &rarr;
                  </button>
                </div>
              ) : (
                <form onSubmit={handleClientSubmit} className="space-y-4">
                  {/* Client Details */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Client Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                        value={clientForm.name}
                        onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        placeholder="john@example.com"
                        className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                        value={clientForm.email}
                        onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                      <input
                        type="number"
                        placeholder="5000"
                        className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                        value={clientForm.baseAmount}
                        onChange={e => setClientForm({ ...clientForm, baseAmount: e.target.value })}
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">System will auto-add a unique decimal (e.g. .01) for tracking.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#5F2CFF] absolute left-3 top-2.5" />
                        <input
                          type="date"
                          className="w-full bg-white/80 border border-slate-200 rounded-xl pl-9 pr-2 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-[#5F2CFF]"
                          value={clientForm.dueDate}
                          onChange={e => setClientForm({ ...clientForm, dueDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Mail Time</label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-[#5F2CFF] absolute left-3 top-2.5" />
                        <input
                          type="time"
                          className="w-full bg-white/80 border border-slate-200 rounded-xl pl-9 pr-2 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-[#5F2CFF]"
                          value={clientForm.sendTime}
                          onChange={e => setClientForm({ ...clientForm, sendTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mail Drip Sequences */}
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-700 flex items-center space-x-1 border-b border-slate-200 pb-2">
                      <Mail className="w-3.5 h-3.5" /> <span>Drip Sequences (Rules)</span>
                    </h3>
                    
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">1. Pre-Payment Reminder</label>
                      <select
                        className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#5F2CFF]"
                        value={clientForm.prePaymentTemplate}
                        onChange={e => setClientForm({ ...clientForm, prePaymentTemplate: e.target.value })}
                      >
                        <option value="">Select Template...</option>
                        {templates.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">2. Overdue Mail (If due date passes)</label>
                      <select
                        className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#5F2CFF]"
                        value={clientForm.overdueTemplate}
                        onChange={e => setClientForm({ ...clientForm, overdueTemplate: e.target.value })}
                      >
                        <option value="">Select Template...</option>
                        {templates.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">3. Post-Payment (Instant Thank You)</label>
                      <select
                        className="w-full bg-white text-xs border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-[#5F2CFF]"
                        value={clientForm.postPaymentTemplate}
                        onChange={e => setClientForm({ ...clientForm, postPaymentTemplate: e.target.value })}
                      >
                        <option value="">Select Template...</option>
                        {templates.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#5F2CFF] hover:bg-[#4d21da] text-white font-bold py-3 rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /><span>Add Client & Start</span></>}
                  </button>
                </form>
              )}
            </div>

            {/* Clients Table */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Active Invoices & Clients</h2>
                    <p className="text-xs text-slate-500">Manage statuses and track email drops</p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      className="bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm w-full sm:w-64"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200">
                        <th className="pb-3 px-2">Client / ID</th>
                        <th className="pb-3 px-2">Amount (Exact)</th>
                        <th className="pb-3 px-2">Due Date</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40">
                      {filteredClients.map((client) => {
                        const isPaid = client.status === 'PAID';
                        const isOverdue = client.status === 'OVERDUE' || (!isPaid && new Date() > new Date(client.dueDate));
                        
                        return (
                        <tr key={client._id} className="hover:bg-white/50 transition">
                          <td className="py-3 px-2">
                            <div className="font-bold text-slate-900">{client.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono bg-slate-100 inline-block px-1 rounded mt-0.5">{client.uniqueId}</div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                              ₹{client.uniqueAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-xs">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className={isOverdue && !isPaid ? 'text-rose-600 font-bold' : ''}>
                                {new Date(client.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
                              ${isPaid ? 'bg-emerald-100 text-emerald-700' : 
                                isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                              {isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {!isPaid && (
                                <button 
                                  onClick={() => handleMarkPaid(client._id, client.name)}
                                  className="text-[10px] bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded shadow flex items-center space-x-1"
                                >
                                  <CheckCircle2 className="w-3 h-3" /> <span>Mark Paid</span>
                                </button>
                              )}
                              <button 
                                onClick={() => setShowLogsFor(client._id)}
                                className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded shadow flex items-center space-x-1"
                              >
                                <History className="w-3 h-3" /> <span>Logs</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )})}
                      {filteredClients.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                            No clients found. Add a client to get started.
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-200/60">
                <FilePlus className="w-5 h-5 text-[#5F2CFF]" />
                <h2 className="text-lg font-bold text-slate-900">Create Email Template</h2>
              </div>

              <form onSubmit={handleTemplateSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Template Internal Name</label>
                  <div className="relative">
                    <LayoutGrid className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. Day 1 Welcome Email"
                      className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      value={templateForm.title}
                      onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Subject Line</label>
                  <div className="relative">
                    <Type className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="Welcome to our platform {{name}}!"
                      className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      value={templateForm.subject}
                      onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Email Message Body</label>
                    <div className="flex space-x-1">
                      <button type="button" onClick={() => insertVariable('{{name}}')} className="text-[10px] bg-[#5F2CFF]/10 text-[#5F2CFF] font-bold px-2 py-0.5 rounded hover:bg-[#5F2CFF]/20">+ Name</button>
                      <button type="button" onClick={() => insertVariable('{{email}}')} className="text-[10px] bg-[#5F2CFF]/10 text-[#5F2CFF] font-bold px-2 py-0.5 rounded hover:bg-[#5F2CFF]/20">+ Email</button>
                    </div>
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                    <textarea
                      rows={6}
                      className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm"
                      value={templateForm.message}
                      onChange={e => setTemplateForm({ ...templateForm, message: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="w-full mt-4 bg-[#5F2CFF] hover:bg-[#4d21da] text-white font-bold py-3 rounded-xl shadow-lg transition active:scale-95 flex justify-center space-x-2">
                  <FilePlus className="w-4 h-4" /><span>Save Template</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Saved Email Templates</h2>
                  <p className="text-xs text-slate-500">Reusable templates available for tracking</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(t => (
                    <div key={t._id} className="bg-white/80 border border-slate-200/80 rounded-xl p-5 shadow-sm space-y-3 relative group">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{t.title}</h3>
                          <p className="text-xs text-[#5F2CFF] font-semibold mt-0.5">Subject: {t.subject}</p>
                        </div>
                        <button onClick={() => handleDeleteTemplate(t._id)} className="text-slate-400 hover:text-rose-600 p-1 rounded-lg opacity-60 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/50 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {t.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* LOGS OVERLAY MODAL */}
      {showLogsFor && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-fadeIn">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-[#5F2CFF]" />
                <h3 className="font-bold text-slate-800 text-lg">Email Delivery Tracking</h3>
              </div>
              <button onClick={() => setShowLogsFor(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 overflow-y-auto bg-slate-50/50 flex-1">
              {logs.filter(l => l.client?._id === showLogsFor).length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No emails have been sent to this client yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.filter(l => l.client?._id === showLogsFor).map(log => (
                    <div key={log._id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            log.type === 'POST_PAYMENT' ? 'bg-emerald-100 text-emerald-700' :
                            log.type === 'OVERDUE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {log.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-slate-600">{log.template?.title || 'Deleted Template'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.sentAt).toLocaleString()}
                        </p>
                        {log.errorMsg && <p className="text-[10px] text-rose-500 mt-1">Error: {log.errorMsg}</p>}
                      </div>
                      <div className="flex items-center space-x-1">
                        {log.status === 'SENT' ? (
                          <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> <span className="text-xs font-bold text-emerald-600">Delivered</span></>
                        ) : (
                          <><X className="w-4 h-4 text-rose-500" /> <span className="text-xs font-bold text-rose-600">Failed</span></>
                        )}
                      </div>
                    </div>
                  ))}
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
