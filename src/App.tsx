import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Timetable } from './components/Timetable/Timetable';
import { HomeworkView } from './components/Homework/HomeworkView';
import { CatchupView } from './components/Catchup/CatchupView';
import { ClassChatView } from './components/Chat/ClassChatView';
import { ProfileView } from './components/Profile/ProfileView';
import { ModalManager } from './components/ModalManager';
import {
  Download,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User as UserIcon,
  X
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, currentUser, currentClass, openModal } = useApp();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Navbar with 3-dots, Tabs, Role Switcher and Avatar with Blue Ring */}
      <Navbar />

      {/* Optional PWA Install Banner */}
      {showInstallBanner && (
        <aside aria-label="Installation de l'application" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 animate-bounce" />
            <span><strong>Installer l'application Klass</strong> sur votre smartphone pour un accès instantané 24h/24 hors-ligne.</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1 bg-white text-blue-700 font-bold rounded-lg shadow-sm hover:bg-blue-50"
            >
              Installer (PWA)
            </button>
            <button
              type="button"
              onClick={() => setShowInstallBanner(false)}
              className="p-1 hover:bg-blue-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Main Container centered at ~1100px max-width */}
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        {activeTab === 'timetable' && <Timetable />}
        {activeTab === 'homework' && <HomeworkView />}
        {activeTab === 'chat' && <ClassChatView />}
        {activeTab === 'catchup' && <CatchupView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      {/* Modal Manager (all modals mounted at root) */}
      <ModalManager />

      {/* Footer with French High School & RGPD notice */}
      <footer className="border-t border-amber-900/10 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 py-5 mt-auto">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-700 dark:text-slate-300">Klass Lycée</span>
            <span>•</span>
            <span>{currentClass?.name || 'Terminale 3'}</span>
            <span>•</span>
            <span>{currentClass?.schoolName || 'Lycée Victor Hugo'}</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => openModal('privacyRGPD')}
              className="hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
              Confidentialité RGPD
            </button>
            <button
              type="button"
              onClick={() => openModal('auditLogs')}
              className="hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
              Journal des délégués
            </button>
            <button
              type="button"
              onClick={() => openModal('passwordGoogle')}
              className="hover:text-slate-600 dark:hover:text-slate-200 underline"
            >
              Sécurité Google
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
