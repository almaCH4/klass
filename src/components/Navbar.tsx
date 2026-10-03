import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab, UserRole } from '../types';
import {
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  Users,
  MessageSquare,
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
    isDelegate,
    isDeputy,
    isLeader,
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

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; phase?: number }[] = [
    { id: 'timetable', label: 'Emploi du temps', icon: <Calendar className="w-4 h-4" /> },
    { id: 'homework', label: 'Devoirs', icon: <BookOpen className="w-4 h-4" />, phase: 2 },
    { id: 'exams', label: 'Contrôles', icon: <GraduationCap className="w-4 h-4" />, phase: 2 },
    { id: 'catchup', label: 'Rattrapage', icon: <Sparkles className="w-4 h-4" />, phase: 2 },
    { id: 'chat', label: 'Groupe', icon: <Users className="w-4 h-4" />, phase: 3 },
    { id: 'messages', label: 'Messagerie', icon: <MessageSquare className="w-4 h-4" />, phase: 3 },
    { id: 'profile', label: 'Profil & Accueil', icon: <UserIcon className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: ActiveTab, phase?: number) => {
    if (phase) {
      openModal('phasePreview', { tab, phase });
      return;
    }
    setActiveTab(tab);
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case 'DELEGATE':
        return {
          title: 'Délégué(e) titulaire',
          badgeClass: 'bg-blue-600 text-white',
          ringClass: 'delegate-ring'
        };
      case 'DEPUTY':
        return {
          title: 'Délégué(e) suppléant(e)',
          badgeClass: 'bg-sky-600 text-white',
          ringClass: 'deputy-ring'
        };
      default:
        return {
          title: 'Élève',
          badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
          ringClass: 'ring-1 ring-slate-200 dark:ring-slate-700'
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
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left section: 3-dots menu & Class Title */}
            <div className="flex items-center space-x-3">
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu principal"
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classe connectée</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {currentClass?.name || 'Aucune classe rattachée'}
                      </p>
                      {currentClass && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {currentClass.schoolName} • {currentClass.academicYear}
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
                          className="w-full flex items-center px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 font-medium"
                        >
                          <UserCheck className="w-4 h-4 mr-3" />
                          Gestion des invitations & membres
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false);
                            openModal('backupClass');
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                        >
                          <Database className="w-4 h-4 mr-3 text-blue-500" />
                          Sauvegarde & Restauration (JSON)
                        </button>
                      </div>
                    )}

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openModal('passwordGoogle');
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <KeyRound className="w-4 h-4 mr-3 text-slate-400" />
                        Réglages du mot de passe
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openModal('privacyRGPD');
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Shield className="w-4 h-4 mr-3 text-slate-400" />
                        Protection des données & RGPD
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openModal('auditLogs');
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <History className="w-4 h-4 mr-3 text-slate-400" />
                        Journal des actions délégués
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          exportUserData();
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Download className="w-4 h-4 mr-3 text-slate-400" />
                        Exporter mes données (JSON)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          openModal('onboarding');
                        }}
                        className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <FileText className="w-4 h-4 mr-3 text-slate-400" />
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
                        className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Class identity */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                    {currentClass?.name || 'Klass Lycée'}
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    Base active 24h/24
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                  {currentClass?.schoolName || 'Espace de classe connecté'}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id, item.phase)}
                    className={`relative flex items-center px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    <span>{item.label}</span>
                    {item.phase && (
                      <span className="ml-1.5 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        P{item.phase}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right section: Real account info, role badge, theme toggle, Avatar with BLUE RING */}
            <div className="flex items-center space-x-3">
              
              {/* Live sync refresh button */}
              <button
                type="button"
                onClick={handleManualRefresh}
                title="Actualiser les données partagées"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              {/* Connected role pill */}
              <div className="hidden md:flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${roleInfo.badgeClass}`}>
                  {isLeader ? '👑 ' : ''}{roleInfo.title}
                </span>
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
                aria-label="Basculer le mode sombre / clair"
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {themeMode === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Avatar with Distinctive BLUE RING for delegates */}
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="relative group focus:outline-none"
                title={`${currentUser?.name || 'Mon Compte'} (${roleInfo.title}) - Accéder au profil`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden transition-all duration-300 ${
                    isLeader ? roleInfo.ringClass : 'ring-2 ring-slate-200 dark:ring-slate-700'
                  }`}
                >
                  <img
                    src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser?.email || 'user')}`}
                    alt={currentUser?.name || 'Profil'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Badge indicator on avatar */}
                {isLeader && (
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                      isDelegate ? 'bg-blue-600' : 'bg-sky-400'
                    }`}
                    title={roleInfo.title}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="lg:hidden flex items-center space-x-1 px-3 py-2 overflow-x-auto scrollbar-none border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id, item.phase)}
                className={`flex-shrink-0 flex items-center px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span className="mr-1.5">{item.icon}</span>
                <span>{item.label}</span>
                {item.phase && (
                  <span className="ml-1 text-[9px] px-1 rounded bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                    P{item.phase}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>
    </>
  );
};
