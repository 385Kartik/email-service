import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, 
  Calendar, 
  User, 
  PlusCircle, 
  Users, 
  CheckCircle2, 
  Clock, 
  Search,
  Sparkles,
  Send,
  RefreshCw,
  FileText,
  Type,
  LayoutGrid,
  Trash2,
  FilePlus,
  ChevronRight
} from 'lucide-react';

interface Template {
  _id: string;
  title: string;
  subject: string;
  message: string;
}

interface Campaign {
  _id: string;
  name: string;
  email: string;
  templateId: Template;
  startDateTime: string;
  endDateTime: string;
  sendTime: string;
  lastSentAt?: string;
  isActive: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'templates'>('scheduler');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Default dates
  const now = new Date();
  const defaultToday = now.toISOString().split('T')[0];
  const nextWeek = new Date(now.setDate(now.getDate() + 7)).toISOString().split('T')[0];
  const defaultTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    email: '',
    templateId: '',
    startDate: defaultToday,
    endDate: nextWeek,
    sendTime: defaultTime
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
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [tRes, cRes] = await Promise.all([
        axios.get(`${API_URL}/templates`),
        axios.get(`${API_URL}/emails`)
      ]);
      setTemplates(tRes.data);
      setCampaigns(cRes.data);
      if (tRes.data.length > 0 && !scheduleForm.templateId) {
        setScheduleForm(prev => ({ ...prev, templateId: tRes.data[0]._id }));
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

  // Handle Schedule Creation
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.templateId) {
      alert('Please create and select an Email Template first!');
      setActiveTab('templates');
      return;
    }
    setLoading(true);
    try {
      const startDateTime = new Date(`${scheduleForm.startDate}T${scheduleForm.sendTime}:00`).toISOString();
      const endDateTime = new Date(`${scheduleForm.endDate}T23:59:59`).toISOString();

      await axios.post(`${API_URL}/emails`, {
        name: scheduleForm.name,
        email: scheduleForm.email,
        templateId: scheduleForm.templateId,
        startDateTime,
        endDateTime,
        sendTime: scheduleForm.sendTime
      });

      setScheduleForm(prev => ({ 
        ...prev, 
        name: '', 
        email: ''
      }));

      fetchData();
      alert('⚡ Campaign Scheduled & Job Started!');
    } catch (error) {
      console.error('Error scheduling email', error);
      alert('Failed to schedule email.');
    } finally {
      setLoading(false);
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
      setScheduleForm(prev => ({ ...prev, templateId: res.data._id }));
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

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = campaigns.filter(c => c.isActive).length;

  return (
    <div className="min-h-screen bg-[#DFF6FF] text-slate-800 font-sans antialiased pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#5F2CFF] rounded-xl shadow-lg shadow-[#5F2CFF]/30 text-white">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#5F2CFF] tracking-tight">
                MailFlow
              </h1>
              <p className="text-xs text-slate-500 font-medium">Automated Email Automation Platform</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-white/80 p-1 rounded-xl border border-slate-200/80 shadow-inner">
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'scheduler' 
                  ? 'bg-[#5F2CFF] text-white shadow-md shadow-[#5F2CFF]/20' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Jobs</span>
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
              <span>Email Templates ({templates.length})</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-white/80">
            <div className="p-3.5 bg-[#5F2CFF]/10 text-[#5F2CFF] rounded-xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Schedules</p>
              <h3 className="text-3xl font-black text-slate-900 mt-0.5">{campaigns.length}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-white/80">
            <div className="p-3.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Jobs</p>
              <h3 className="text-3xl font-black text-slate-900 mt-0.5">{activeCount}</h3>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-sm flex items-center space-x-4 border border-white/80">
            <div className="p-3.5 bg-[#5F2CFF]/10 text-[#5F2CFF] rounded-xl">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Templates</p>
              <h3 className="text-3xl font-black text-slate-900 mt-0.5">{templates.length}</h3>
            </div>
          </div>
        </div>

        {/* TAB 1: SCHEDULER HOME PAGE */}
        {activeTab === 'scheduler' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Schedule Form Card */}
            <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-6">
              <div className="flex items-center space-x-2 pb-4 border-b border-slate-200/60">
                <PlusCircle className="w-5 h-5 text-[#5F2CFF]" />
                <h2 className="text-lg font-bold text-slate-900">Schedule Email Job</h2>
              </div>

              {templates.length === 0 ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center space-y-3">
                  <p className="text-xs font-semibold text-amber-800">No email templates created yet!</p>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className="text-xs bg-[#5F2CFF] text-white font-bold px-4 py-2 rounded-lg shadow"
                  >
                    Create Template First &rarr;
                  </button>
                </div>
              ) : (
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  {/* Select Template */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Email Template</label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                      <select
                        className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner font-semibold"
                        value={scheduleForm.templateId}
                        onChange={e => setScheduleForm({ ...scheduleForm, templateId: e.target.value })}
                        required
                      >
                        {templates.map(t => (
                          <option key={t._id} value={t._id}>{t.title} ({t.subject})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Recipient Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        placeholder="Rahul Sharma"
                        className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                        value={scheduleForm.name}
                        onChange={e => setScheduleForm({ ...scheduleForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        placeholder="rahul@example.com"
                        className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                        value={scheduleForm.email}
                        onChange={e => setScheduleForm({ ...scheduleForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {/* Date & Time Settings */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Daily Send Time</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                      <input
                        type="time"
                        className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                        value={scheduleForm.sendTime}
                        onChange={e => setScheduleForm({ ...scheduleForm, sendTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Date</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#5F2CFF] absolute left-3 top-3.5" />
                        <input
                          type="date"
                          className="w-full bg-white/80 border border-slate-200 rounded-xl pl-9 pr-2 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                          value={scheduleForm.startDate}
                          onChange={e => setScheduleForm({ ...scheduleForm, startDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Date</label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#5F2CFF] absolute left-3 top-3.5" />
                        <input
                          type="date"
                          className="w-full bg-white/80 border border-slate-200 rounded-xl pl-9 pr-2 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                          value={scheduleForm.endDate}
                          onChange={e => setScheduleForm({ ...scheduleForm, endDate: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 bg-[#5F2CFF] hover:bg-[#4d21da] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#5F2CFF]/30 transition transform active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Schedule Job Now</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Scheduled Table */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Active Scheduled Jobs</h2>
                    <p className="text-xs text-slate-500">Subscribers and assigned email templates</p>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search subscribers..."
                      className="bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] w-full sm:w-64 shadow-inner"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700">
                    <thead>
                      <tr className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200/60">
                        <th className="pb-3 px-2">Recipient</th>
                        <th className="pb-3 px-2">Assigned Template</th>
                        <th className="pb-3 px-2">Time</th>
                        <th className="pb-3 px-2">Date Range</th>
                        <th className="pb-3 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40">
                      {filteredCampaigns.map((camp) => (
                        <tr 
                          key={camp._id} 
                          onClick={() => setSelectedCampaign(camp)}
                          className={`hover:bg-white/80 cursor-pointer transition ${selectedCampaign?._id === camp._id ? 'bg-white/90' : ''}`}
                        >
                          <td className="py-3.5 px-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-full bg-[#5F2CFF] flex items-center justify-center font-bold text-white text-sm shadow-md shadow-[#5F2CFF]/20">
                                {camp.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{camp.name}</p>
                                <p className="text-xs text-slate-500">{camp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            {camp.templateId ? (
                              <div className="text-xs">
                                <p className="font-bold text-slate-900">{camp.templateId.title}</p>
                                <p className="text-slate-400 truncate max-w-[120px]">{camp.templateId.subject}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-amber-600">No Template</span>
                            )}
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="inline-flex items-center space-x-1 px-2 py-0.5 bg-[#5F2CFF]/10 text-[#5F2CFF] font-bold text-xs rounded-lg">
                              <Clock className="w-3 h-3" />
                              <span>{camp.sendTime}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <div className="text-xs text-slate-600 font-medium space-y-0.5">
                              <p><span className="text-slate-400 font-normal">From:</span> {new Date(camp.startDateTime).toLocaleDateString()}</p>
                              <p><span className="text-slate-400 font-normal">To:</span> {new Date(camp.endDateTime).toLocaleDateString()}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-2">
                            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              camp.isActive 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${camp.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                              <span>{camp.isActive ? 'Active' : 'Expired'}</span>
                            </span>
                          </td>
                        </tr>
                      ))}

                      {filteredCampaigns.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <Sparkles className="w-8 h-8 mx-auto text-[#5F2CFF]/60 mb-2" />
                            <p className="font-semibold text-slate-600">No active jobs found</p>
                            <p className="text-xs text-slate-400 mt-1">Schedule a job using the form on the left</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Email Content Preview */}
              {selectedCampaign && selectedCampaign.templateId && (
                <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-[#5F2CFF]" />
                      <h3 className="font-bold text-slate-900">Live Preview: {selectedCampaign.templateId.title}</h3>
                    </div>
                    <button 
                      onClick={() => setSelectedCampaign(null)} 
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Close Preview
                    </button>
                  </div>
                  <div className="bg-white/80 border border-slate-200 rounded-xl p-4 text-xs space-y-2 font-mono">
                    <p><span className="font-bold text-slate-500">To:</span> {selectedCampaign.email}</p>
                    <p><span className="font-bold text-slate-500">Subject:</span> {selectedCampaign.templateId.subject.replace(/\{\{\s*name\s*\}\}/gi, selectedCampaign.name)}</p>
                    <div className="pt-2 border-t border-slate-200/60 font-sans text-slate-700 whitespace-pre-wrap">
                      {selectedCampaign.templateId.message
                        .replace(/\{\{\s*name\s*\}\}/gi, selectedCampaign.name)
                        .replace(/\{\{\s*email\s*\}\}/gi, selectedCampaign.email)
                      }
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 2: EMAIL TEMPLATES LIBRARY PAGE */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Create Template Form */}
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
                      className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner font-semibold"
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
                      className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
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
                      <button
                        type="button"
                        onClick={() => insertVariable('{{name}}')}
                        className="text-[10px] bg-[#5F2CFF]/10 text-[#5F2CFF] font-bold px-2 py-0.5 rounded hover:bg-[#5F2CFF]/20"
                      >
                        + Name
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('{{email}}')}
                        className="text-[10px] bg-[#5F2CFF]/10 text-[#5F2CFF] font-bold px-2 py-0.5 rounded hover:bg-[#5F2CFF]/20"
                      >
                        + Email
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-[#5F2CFF] absolute left-3.5 top-3.5" />
                    <textarea
                      rows={6}
                      placeholder="Hi {{name}},\n\nWelcome to our service! Your registered email is {{email}}..."
                      className="w-full bg-white/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5F2CFF] transition shadow-inner"
                      value={templateForm.message}
                      onChange={e => setTemplateForm({ ...templateForm, message: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-[#5F2CFF] hover:bg-[#4d21da] text-white font-bold py-3 rounded-xl shadow-lg shadow-[#5F2CFF]/30 transition transform active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <FilePlus className="w-4 h-4" />
                      <span>Save Template</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Templates List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card p-6 rounded-2xl shadow-md border border-white/90 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Saved Email Templates</h2>
                  <p className="text-xs text-slate-500">Reusable templates available for scheduling</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map(t => (
                    <div key={t._id} className="bg-white/80 border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow transition space-y-3 relative group">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{t.title}</h3>
                          <p className="text-xs text-[#5F2CFF] font-semibold mt-0.5">Subject: {t.subject}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(t._id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition opacity-60 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/50 font-mono whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {t.message}
                      </div>

                      <button
                        onClick={() => {
                          setScheduleForm(prev => ({ ...prev, templateId: t._id }));
                          setActiveTab('scheduler');
                        }}
                        className="text-xs font-bold text-[#5F2CFF] hover:underline flex items-center space-x-1"
                      >
                        <span>Use for schedule</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {templates.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto text-[#5F2CFF]/60 mb-2" />
                      <p className="font-semibold text-slate-600">No templates created yet</p>
                      <p className="text-xs text-slate-400 mt-1">Create your first reusable email template on the left</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
