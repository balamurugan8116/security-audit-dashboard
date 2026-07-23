import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import UploadLogs from './pages/UploadLogs';
import AuditLogs from './pages/AuditLogs';

const PAGE_META = {
  '/': { title: 'Dashboard', subtitle: 'Overview of your security audit logs' },
  '/upload': { title: 'Upload Audit Logs', subtitle: 'Upload JSON or CSV files containing audit logs' },
  '/logs': { title: 'Audit Logs', subtitle: 'View and investigate all audit logs' },
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = PAGE_META[location.pathname] || { title: 'SecureAudit' };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={meta.title} subtitle={meta.subtitle} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadLogs />} />
            <Route path="/logs" element={<AuditLogs />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
