import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Lock,
  Save,
  Check,
  Shield,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  Clock,
  Cake,
  Camera,
  ArrowRight,
  School
} from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
];

const THEME_COLORS: { id: 'blue' | 'purple' | 'emerald' | 'amber' | 'rose' | 'cyan'; name: string; hex: string }[] = [
  { id: 'blue', name: 'Bleu Royal', hex: '#2563eb' },
  { id: 'purple', name: 'Violet Studio', hex: '#7c3aed' },
  { id: 'emerald', name: 'Vert Émeraude', hex: '#059669' },
  { id: 'amber', name: 'Ambre Solaire', hex: '#d97706' },
  { id: 'rose', name: 'Rose Bonbon', hex: '#e11d48' },
  { id: 'cyan', name: 'Bleu Lagon', hex: '#0891b2' },
];

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    currentClass,
    courses,
    personalEvents,
    updateUserProfile,
    updatePrivateNotes,
    getPrivateNotes,
    exportUserData,
    deleteAccount,
    setActiveTab,
    isLeader,
    isDelegate
  } = useApp();

  const [notesText, setNotesText] = useState('');
  const [saveStatus, setSaveStatus] = useState('Chargement du bloc-notes...');
  const [firstName, setFirstName] = useState(currentUser?.firstName || '');
  const [lastName, setLastName] = useState(currentUser?.lastName || '');
  const [birthday, setBirthday] = useState(currentUser?.birthday || '');
  const [showBirthday, setShowBirthday] = useState(currentUser?.showBirthdayToClass ?? true);
  const [selectedTheme, setSelectedTheme] = useState(currentUser?.themeColor || 'blue');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [profileSavedFeedback, setProfileSavedFeedback] = useState(false);

  // Load server-side private notepad
  useEffect(() => {
    let isMounted = true;
    getPrivateNotes().then((data) => {
      if (isMounted) {
        setNotesText(data.text || '');
        setSaveStatus(data.lastSaved || 'Sauvegardé sur le serveur');
      }
    });
    return () => {
      isMounted = false;
    };
  }, [getPrivateNotes]);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setBirthday(currentUser.birthday || '');
      setShowBirthday(currentUser.showBirthdayToClass);
      setSelectedTheme(currentUser.themeColor || 'blue');
    }
  }, [currentUser]);

  // Autosave private notepad with debounce to server
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (currentUser && notesText !== undefined) {
        try {
          const timestamp = await updatePrivateNotes(notesText);
          setSaveStatus('Sauvegardé sur le serveur à ' + timestamp.split('à ')[1] || 'Sauvegardé');
        } catch {
          setSaveStatus('Erreur de sauvegarde serveur');
        }
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [notesText, currentUser, updatePrivateNotes]);

  // Current formatted date in French
  const todayFormatted = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const capitalizedToday = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  // Find next upcoming course for today
  const currentDayOfWeek = new Date().getDay();
  const todayCourses = courses
    .filter(c => c.dayOfWeek === currentDayOfWeek && !c.isCancelled)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      birthday,
      showBirthdayToClass: showBirthday,
      themeColor: selectedTheme
    });
    setProfileSavedFeedback(true);
    setTimeout(() => setProfileSavedFeedback(false), 2500);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image trop volumineuse. Veuillez choisir un fichier inférieur à 2 Mo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateUserProfile({ avatarUrl: reader.result });
          setShowAvatarPicker(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Date & Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white mb-3">
              <Calendar className="w-3.5 h-3.5" />
              <span>{capitalizedToday}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Bonjour, {currentUser?.firstName || 'Lycéen'} ! 👋
            </h1>
            <p className="mt-1 text-blue-100 text-sm max-w-xl">
              {currentClass ? (
                <>Bienvenue sur votre espace classe <span className="font-semibold text-white">{currentClass.name}</span> ({currentClass.schoolName}).</>
              ) : (
                <>Vous n'avez pas encore rejoint de classe. Vous pouvez en créer une ou rejoindre via une invitation.</>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs sm:text-sm shadow-sm transition-transform active:scale-95 flex items-center"
            >
              <span>Voir l'emploi du temps</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Card & Customization */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            
            {/* Avatar with distinctive BLUE RING for delegates */}
            <div className="relative inline-block mx-auto mb-4">
              <div
                className={`w-28 h-28 rounded-full overflow-hidden mx-auto transition-all ${
                  isLeader ? 'delegate-ring ring-4 ring-blue-500' : 'ring-2 ring-slate-200 dark:ring-slate-700'
                }`}
              >
                <img
                  src={currentUser?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser?.email || 'user')}`}
                  alt={currentUser?.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-md border-2 border-white dark:border-slate-900"
                title="Changer ma photo de profil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar presets dropdown */}
            {showAvatarPicker && (
              <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-in fade-in">
                <p className="text-xs font-bold text-slate-500 mb-2">Choisir un avatar ou importer une photo</p>
                <div className="flex justify-center gap-2 mb-3">
                  {AVATAR_PRESETS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        updateUserProfile({ avatarUrl: url });
                        setShowAvatarPicker(false);
                      }}
                      className="w-8 h-8 rounded-full overflow-hidden border hover:scale-110 transition-transform"
                    >
                      <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <label className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-100">
                  <span>Importer un fichier (PNG/JPG)</span>
                  <input type="file" accept="image/*" onChange={handleCustomAvatarUpload} className="hidden" />
                </label>
              </div>
            )}

            {/* Name & Role badge */}
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {currentUser?.name || 'Mon Profil'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser?.email}</p>

            <div className="mt-3 flex justify-center">
              {isDelegate ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mr-1.5 animate-pulse" />
                  👑 Délégué(e) Titulaire (Anneau bleu)
                </span>
              ) : currentUser?.role === 'DEPUTY' ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  <span className="w-2 h-2 rounded-full bg-sky-500 mr-1.5" />
                  🎖️ Délégué(e) Suppléant(e) (Anneau bleu)
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  🎓 Élève
                </span>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center text-xs text-slate-500 space-x-4">
              <span className="flex items-center">
                <School className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {currentClass?.name || 'Sans classe'}
              </span>
            </div>
          </div>

          {/* Form to edit personal info */}
          <form onSubmit={handleSaveProfile} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Mes coordonnées
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Prénom
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Birthday with privacy toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                <span className="flex items-center">
                  <Cake className="w-3.5 h-3.5 mr-1 text-pink-500" />
                  Date d'anniversaire
                </span>
                <span className="text-[10px] text-slate-400">Pour le bot de classe (P3)</span>
              </label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="mt-2.5 flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBirthday}
                  onChange={(e) => setShowBirthday(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center">
                  {showBirthday ? <Eye className="w-3 h-3 mr-1 text-emerald-500" /> : <EyeOff className="w-3 h-3 mr-1 text-slate-400" />}
                  {showBirthday ? 'Afficher mon anniversaire à la classe' : 'Garder mon anniversaire secret'}
                </span>
              </label>
            </div>

            {/* Theme color preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center">
                <Palette className="w-3.5 h-3.5 mr-1 text-blue-500" />
                Couleur de thème préférée
              </label>
              <div className="flex items-center gap-2">
                {THEME_COLORS.map((tc) => (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => setSelectedTheme(tc.id)}
                    style={{ backgroundColor: tc.hex }}
                    title={tc.name}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      selectedTheme === tc.id ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center space-x-1.5"
              >
                {profileSavedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Profil enregistré !</span>
                  </>
                ) : (
                  <span>Enregistrer sur le serveur</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Columns: Server-Backed Private Bloc-Notes (Auto-save) & Class Summary */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PRIVATE NOTEPAD */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center">
                    Mon Bloc-Notes Personnel & Secret
                  </h3>
                  <p className="text-xs text-slate-400">
                    🔒 Strictement privé : stocké sur le serveur, accessible uniquement avec votre compte.
                  </p>
                </div>
              </div>

              {/* Autosave status pill */}
              <div className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                <Save className="w-3 h-3" />
                <span>{saveStatus}</span>
              </div>
            </div>

            {/* Notepad textarea */}
            <div className="mt-4">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Écrivez ici vos notes privées, objectifs de révision, devoirs personnels ou pensées... Vos notes sont sauvegardées de façon sécurisée sur le serveur."
                rows={8}
                className="w-full p-4 rounded-2xl bg-amber-50/20 dark:bg-slate-800/40 border border-amber-200/60 dark:border-slate-700/80 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y leading-relaxed font-sans"
              />
            </div>

            {/* Quick helper buttons */}
            <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNotesText(prev => prev + '\n- [ ] ')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  + Case à cocher
                </button>
                <button
                  type="button"
                  onClick={() => setNotesText(prev => prev + `\n📌 Note du ${new Date().toLocaleDateString('fr-FR')} : `)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                >
                  + Date du jour
                </button>
              </div>

              <span className="text-[11px] text-slate-400">
                {notesText.length} caractères
              </span>
            </div>
          </div>

          {/* Today's Overview & Personal Events */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Today's Classes Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <Clock className="w-4 h-4 mr-1.5 text-blue-500" />
                  Cours d'aujourd'hui
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('timetable')}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Tout voir
                </button>
              </div>

              {todayCourses.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Aucun cours prévu aujourd'hui.
                </p>
              ) : (
                <div className="space-y-2">
                  {todayCourses.slice(0, 3).map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{c.subject}</p>
                        <p className="text-[11px] text-slate-400">{c.room} • {c.teacher}</p>
                      </div>
                      <span className="font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 px-2 py-0.5 rounded-md">
                        {c.startTime}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Personal Events Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                  <Lock className="w-4 h-4 mr-1.5 text-indigo-500" />
                  Mes événements privés
                </h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                  {personalEvents.length} enregistrés
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Vos rendez-vous personnels sont synchronisés avec votre compte sur le serveur et visibles uniquement par vous.
              </p>

              <button
                type="button"
                onClick={() => setActiveTab('timetable')}
                className="w-full py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold transition-colors"
              >
                Gérer mes événements sur l'emploi du temps
              </button>
            </div>
          </div>

          {/* RGPD & Data Rights Box */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
                <Shield className="w-4 h-4 mr-1.5 text-blue-500" />
                Vos droits & Protection des mineurs (RGPD)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
                Conformément au RGPD et à la directive européenne, vous conservez le contrôle total de vos données. Vous pouvez les télécharger ou supprimer votre compte à tout moment.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                type="button"
                onClick={exportUserData}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 flex items-center"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-slate-400" />
                Exporter
              </button>

              <button
                type="button"
                onClick={deleteAccount}
                className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 flex items-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Supprimer
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
