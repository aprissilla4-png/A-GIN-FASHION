import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Mail, 
  Calendar as CalendarIcon, 
  CheckSquare, 
  RefreshCw,
  ExternalLink,
  Loader2,
  HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchDriveFiles, fetchGmailMessages, fetchCalendarEvents, fetchTasks } from '../lib/workspace';

interface WorkspaceViewProps {
  idToken: string;
  workspaceToken: string;
}

export default function WorkspaceView({ idToken, workspaceToken }: WorkspaceViewProps) {
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [drive, gmail, cal, tsk] = await Promise.all([
        fetchDriveFiles(idToken, workspaceToken),
        fetchGmailMessages(idToken, workspaceToken),
        fetchCalendarEvents(idToken, workspaceToken),
        fetchTasks(idToken, workspaceToken)
      ]);

      setDriveFiles(drive.files || []);
      setEmails(gmail.messages || []);
      setEvents(cal.items || []);
      setTasks(tsk.items || []);
      
      // For Docs/Sheets/Slides, we use the Drive API to filter by mimeType
      setDocs(drive.files?.filter((f: any) => f.mimeType === 'application/vnd.google-apps.document') || []);
      setSheets(drive.files?.filter((f: any) => f.mimeType === 'application/vnd.google-apps.spreadsheet') || []);
      setSlides(drive.files?.filter((f: any) => f.mimeType === 'application/vnd.google-apps.presentation') || []);

    } catch (err) {
      console.error('Failed to fetch workspace data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (idToken && workspaceToken) {
      loadAllData();
    }
  }, [idToken, workspaceToken]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  if (loading && !refreshing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Menghubungkan ke Google Workspace...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Google Workspace</h2>
          <p className="text-slate-500 font-medium">Data produktivitas terintegrasi dengan A-GIN Fashion</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-all font-bold text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Google Drive */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-50 px-6 py-4 flex items-center gap-3 border-b border-blue-100">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-blue-900">Google Drive</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {driveFiles.length > 0 ? driveFiles.slice(0, 5).map(file => (
              <div key={file.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{file.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">{file.mimeType.split('.').pop()}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada file ditemukan</p>
            )}
          </div>
        </div>

        {/* Google Sheets */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-emerald-50 px-6 py-4 flex items-center gap-3 border-b border-emerald-100">
            <div className="w-5 h-5 bg-emerald-600 rounded flex items-center justify-center text-white text-[10px] font-bold">田</div>
            <h3 className="font-extrabold text-emerald-900">Sheets</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {sheets.length > 0 ? sheets.map(sheet => (
              <div key={sheet.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{sheet.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Spreadsheet</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada spreadsheet</p>
            )}
          </div>
        </div>

        {/* Google Docs */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-blue-50 px-6 py-4 flex items-center gap-3 border-b border-blue-100">
            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-[10px] font-bold">目</div>
            <h3 className="font-extrabold text-blue-900">Docs</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {docs.length > 0 ? docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{doc.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Document</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada dokumen</p>
            )}
          </div>
        </div>

        {/* Google Slides */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-orange-50 px-6 py-4 flex items-center gap-3 border-b border-orange-100">
            <div className="w-5 h-5 bg-orange-600 rounded flex items-center justify-center text-white text-[10px] font-bold">▢</div>
            <h3 className="font-extrabold text-orange-900">Slides</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {slides.length > 0 ? slides.map(slide => (
              <div key={slide.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{slide.name}</p>
                  <p className="text-[10px] text-slate-500 truncate">Presentation</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada presentasi</p>
            )}
          </div>
        </div>

        {/* Gmail */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-red-50 px-6 py-4 flex items-center gap-3 border-b border-red-100">
            <Mail className="w-5 h-5 text-red-600" />
            <h3 className="font-extrabold text-red-900">Gmail</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {emails.length > 0 ? emails.map(email => (
              <div key={email.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">Pesan #{email.id.substring(0, 8)}</p>
                  <p className="text-[10px] text-slate-500 truncate">ID: {email.id}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada pesan ditemukan</p>
            )}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-emerald-50 px-6 py-4 flex items-center gap-3 border-b border-emerald-100">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-emerald-900">Kalender</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {events.length > 0 ? events.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{event.summary}</p>
                  <p className="text-[10px] text-slate-500 truncate">{new Date(event.start?.dateTime || event.start?.date).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada acara ditemukan</p>
            )}
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-amber-50 px-6 py-4 flex items-center gap-3 border-b border-amber-100">
            <CheckSquare className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-amber-900">Google Tasks</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            {tasks.length > 0 ? tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                  <p className="text-[10px] text-slate-500 truncate">{task.status}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 text-center py-8">Tidak ada tugas ditemukan</p>
            )}
          </div>
        </div>
        {/* Google Chat */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-cyan-50 px-6 py-4 flex items-center gap-3 border-b border-cyan-100">
            <div className="w-5 h-5 bg-cyan-600 rounded flex items-center justify-center text-white text-[10px] font-bold">@</div>
            <h3 className="font-extrabold text-cyan-900">Google Chat</h3>
          </div>
          <div className="p-4 flex-1 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-cyan-50/50 rounded-2xl border border-cyan-100/50">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">Layanan Terhubung</p>
            </div>
            <p className="text-[10px] text-slate-500 px-1 leading-relaxed">
              Integrasi Chat memungkinkan Anda menerima notifikasi pesanan dan update stok langsung ke ruang obrolan Anda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
