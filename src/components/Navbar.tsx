import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab, UserRole } from '../types';
import {
  Calendar,
  User as UserIcon,
  MoreVertical,
  Sun,
  Moon,
  Shield,
  KeyRound,
  FileText,
  History,
  Download,
  LogOut,
  UserCheck,
  RefreshCw,
  Database
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentClass,
    activeTab,
    setActiveTab,
    themeMode,
    setThemeMode,
    isLeader,
    isDelegate,
    openModal,
    exportUserData,
    logout,
    refreshData
  } = useApp();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Strict Phase 1 tabs only: Emploi du temps and Profil & Accueil
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'timetable', label: 'Emploi du temps', icon: <Calendar className="w-4 h-4 shrink-0" /> },
    { id: 'profile', label: 'Profil & Accueil', icon: <UserIcon className="w-4 h-4 shrink-0" /> },
  ];

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'DELEGATE':
        return {
          title: '👑 Délégué titulaire',
          badgeClass: 'bg-[#234E70] text-white shadow-xs'
        };
      case 'DEPUTY':
        return {
          title: 'Délégué suppléant',
          badgeClass: 'bg-sky-700 text-white shadow-xs'
        };
      default:
        return {
          title: 'Élève',
          badgeClass: 'bg-amber-100/80 text-amber-900 dark:bg-slate-800 dark:text-slate-300'
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#111518]/95 backdrop-blur-md border-b border-amber-900/10 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-[1100px] w-full mx-auto px-4 sm:px-6">
        
        {/* LIGNE DU HAUT : Menu ⋮, Nom de la classe, École / Droite : Rôle, Mode sombre, Avatar */}
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Gauche : Menu 3-dots + Titre de classe sur une seule ligne & École en dessous */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            {/* 3-dots Menu Button */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu principal"
                className="p-2 sm:p-2.5 rounded-2xl text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {menuOpen && (
                <div className="absolute left-0 mt-2 w-72 rounded-3xl bg-white dark:bg-[#1A2026] shadow-xl border border-amber-900/10 dark:border-slate-800 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classe rattachée</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {currentClass?.name || 'Aucune classe'}
                    </p>
                    {currentClass && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {currentClass.schoolName} {currentClass.academicYear ? `• ${currentClass.academicYear}` : ''}
                      </p>
                    )}
                  </div>

                  {isLeader && (
                    <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openModal('delegateManagement');
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-bold text-[#234E70] dark:text-sky-400 hover:bg-amber-50 dark:hover:bg-slate-800/60"
                      >
                        <UserCheck className="w-4 h-4 mr-3 shrink-0" />
                        Gestion des invitations & membres
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openModal('backupClass');
                        }}
                        className="w-full flex items-center px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Database className="w-4 h-4 mr-3 text-blue-500 shrink-0" />
                        Sauvegarde & Restauration (JSON)
                      </button>
                    </div>
                  )}

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openModal('privacyRGPD');
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Shield className="w-4 h-4 mr-3 text-emerald-500 shrink-0" />
                      Protection des données & RGPD
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openModal('auditLogs');
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <History className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                      Journal des actions délégués
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        exportUserData();
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Download className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                      Exporter mes données personnelles
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        openModal('onboarding');
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <FileText className="w-4 h-4 mr-3 text-slate-400 shrink-0" />
                      Revoir la visite guidée
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-xs font-bold text-[#991B1B] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    >
                      <LogOut className="w-4 h-4 mr-3 shrink-0" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Identité de classe : Nom sur 1 seule ligne, école en dessous */}
            <div className="flex flex-col min-w-0 justify-center">
              <h1 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate leading-tight tracking-tight">
                {currentClass?.name || 'Klass Lycée'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-normal">
                {currentClass?.schoolName
                  ? `${currentClass.schoolName}${currentClass.academicYear ? ` • ${currentClass.academicYear}` : ''}`
                  : 'Espace de classe connecté'}
              </p>
            </div>
          </div>

          {/* Droite : Bouton actualiser, Badge de rôle, Mode sombre, Avatar */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {/* Bouton rafraîchir en direct */}
            <button
              type="button"
              onClick={handleManualRefresh}
              title="Actualiser les données partagées"
              className="p-2 rounded-2xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#234E70]' : ''}`} />
            </button>

            {/* Badge de rôle */}
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold truncate max-w-[130px] sm:max-w-none ${roleInfo.badgeClass}`}>
                {roleInfo.title}
              </span>
            </div>

            {/* Bouton bascule mode sombre */}
            <button
              type="button"
              onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
              aria-label="Basculer le mode sombre / clair"
              className="p-2 rounded-2xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-amber-100/60 dark:hover:bg-slate-800 transition-colors"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Avatar utilisateur avec anneau bleu bien dégagé pour les délégués */}
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="relative p-0.5 rounded-full shrink-0 focus:outline-none"
              title={`${currentUser?.name || 'Mon Compte'} (${roleInfo.title}) - Accéder au profil`}
            >
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden transition-all duration-200 shrink-0 ${
                  isLeader
                    ? 'ring-3 ring-[#234E70] dark:ring-sky-400 ring-offset-2 ring-offset-[#FAF8F5] dark:ring-offset-[#111518]'
                    : 'ring-1 ring-slate-300 dark:ring-slate-700'
                }`}
              >
                <img
                  src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser?.email || 'user')}`}
                  alt={currentUser?.name || 'Profil'}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          </div>

        </div>

        {/* LIGNE DU DESSOUS : Barre d'onglets horizontale (Emploi du temps & Profil & Accueil) */}
        <div className="border-t border-amber-900/10 dark:border-slate-800/80 py-1.5">
          <nav className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-0.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`h-9 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center space-x-2 whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? 'bg-[#234E70] text-white shadow-xs shadow-[#234E70]/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-amber-100/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>
    </header>
  );
};
