import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Homework } from '../../types';
import { getSubjectColor } from '../../utils/icsParser';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
  StickyNote,
  Edit2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

/**
 * Parses YYYY-MM-DD from homework object (from dueDateIso or DD/MM/YYYY dueDate)
 */
function parseHomeworkDateIso(hw: Homework): string {
  if (hw.dueDateIso && /^\d{4}-\d{2}-\d{2}$/.test(hw.dueDateIso)) {
    return hw.dueDateIso;
  }
  if (hw.dueDate && hw.dueDate.includes('/')) {
    const parts = hw.dueDate.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
  }
  return hw.dueDate || '';
}

/**
 * Formats date into French: e.g. "mardi 6 oct."
 */
function formatFrenchDueDate(dateIso: string, fallback: string): string {
  if (!dateIso || !/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return fallback;
  }
  try {
    const d = new Date(dateIso + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });
      return formatted; // e.g. "mardi 6 oct."
    }
  } catch {}
  return fallback;
}

export const HomeworkView: React.FC = () => {
  const {
    homework,
    currentUser,
    isLeader,
    toggleHomeworkDone,
    updateHomeworkDelegate,
    syncPronoteIcal,
    openModal
  } = useApp();

  const [filterMode, setFilterMode] = useState<'todo' | 'all' | 'done'>('todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOverdueOpen, setIsOverdueOpen] = useState(false); // Replié par défaut

  // Delegate edit states
  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
  const [delegateNoteInput, setDelegateNoteInput] = useState('');
  const [estimatedTimeInput, setEstimatedTimeInput] = useState('');
  const [linkTitleInput, setLinkTitleInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const completedIds = currentUser?.completedHomeworkIds || [];

  // ==========================================
  // 1. SUPPRESSION DES DOUBLONS
  // Même matière + même date « Pour le » + même texte
  // ==========================================
  const uniqueHomework = useMemo(() => {
    const seen = new Set<string>();
    const list: Homework[] = [];

    for (const hw of homework) {
      const dateKey = parseHomeworkDateIso(hw);
      const subjectKey = hw.subject.trim().toLowerCase();
      const descKey = hw.description.trim().toLowerCase();
      const uniqueKey = `${subjectKey}|${dateKey}|${descKey}`;

      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        list.push(hw);
      }
    }

    return list;
  }, [homework]);

  // Filter based on user's hidden groups, search query, and todo/done
  const filteredHomework = useMemo(() => {
    let list = [...uniqueHomework];

    // Filter hidden options/groups
    const hiddenGroups = currentUser?.hiddenCourseCategories || [];
    if (hiddenGroups.length > 0) {
      list = list.filter(hw => {
        if (hw.group && hiddenGroups.includes(hw.group)) {
          return false;
        }
        return true;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        hw =>
          hw.subject.toLowerCase().includes(q) ||
          hw.description.toLowerCase().includes(q) ||
          (hw.group && hw.group.toLowerCase().includes(q))
      );
    }

    // Filter by todo / done
    if (filterMode === 'todo') {
      list = list.filter(hw => !completedIds.includes(hw.id));
    } else if (filterMode === 'done') {
      list = list.filter(hw => completedIds.includes(hw.id));
    }

    return list;
  }, [uniqueHomework, currentUser?.hiddenCourseCategories, searchQuery, filterMode, completedIds]);

  // ==========================================
  // 2. REGROUPEMENT PAR ÉCHÉANCE
  // Ordre : En retard, Aujourd'hui, Demain, Cette semaine, La semaine prochaine, Plus tard
  // Tri dans chaque groupe : par date puis par matière
  // ==========================================
  const groupedHomework = useMemo(() => {
    const now = new Date();
    // Today in Paris ISO
    const todayIso = now.toISOString().slice(0, 10);

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowIso = tomorrow.toISOString().slice(0, 10);

    // End of current week (Dimanche)
    const currentDay = now.getDay();
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    const endOfWeekIso = endOfWeek.toISOString().slice(0, 10);

    // End of next week (Dimanche suivant)
    const endOfNextWeek = new Date(endOfWeek);
    endOfNextWeek.setDate(endOfWeek.getDate() + 7);
    const endOfNextWeekIso = endOfNextWeek.toISOString().slice(0, 10);

    const overdue: Homework[] = [];
    const today: Homework[] = [];
    const tomorrowList: Homework[] = [];
    const thisWeek: Homework[] = [];
    const nextWeek: Homework[] = [];
    const later: Homework[] = [];

    for (const hw of filteredHomework) {
      const dateIso = parseHomeworkDateIso(hw);

      if (!dateIso || dateIso < todayIso) {
        // En retard (dont la date est passée)
        overdue.push(hw);
      } else if (dateIso === todayIso) {
        // Aujourd'hui
        today.push(hw);
      } else if (dateIso === tomorrowIso) {
        // Demain
        tomorrowList.push(hw);
      } else if (dateIso <= endOfWeekIso) {
        // Cette semaine
        thisWeek.push(hw);
      } else if (dateIso <= endOfNextWeekIso) {
        // La semaine prochaine
        nextWeek.push(hw);
      } else {
        // Plus tard
        later.push(hw);
      }
    }

    // Tri par date puis par matière
    const sortFn = (a: Homework, b: Homework) => {
      const dA = parseHomeworkDateIso(a);
      const dB = parseHomeworkDateIso(b);
      if (dA !== dB) return dA.localeCompare(dB);
      return a.subject.localeCompare(b.subject);
    };

    return {
      overdue: overdue.sort(sortFn),
      today: today.sort(sortFn),
      tomorrow: tomorrowList.sort(sortFn),
      thisWeek: thisWeek.sort(sortFn),
      nextWeek: nextWeek.sort(sortFn),
      later: later.sort(sortFn)
    };
  }, [filteredHomework]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncPronoteIcal();
    setIsSyncing(false);
    setSyncFeedback(res.message);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const startEditDelegate = (hw: Homework) => {
    setEditingHomeworkId(hw.id);
    setDelegateNoteInput(hw.delegateNote || '');
    setEstimatedTimeInput(hw.estimatedTime || '');
    setLinkTitleInput('');
    setLinkUrlInput('');
  };

  const saveDelegateEdit = async (hw: Homework) => {
    const links = [...(hw.links || [])];
    if (linkTitleInput.trim() && linkUrlInput.trim()) {
      links.push({
        title: linkTitleInput.trim(),
        url: linkUrlInput.trim().startsWith('http') ? linkUrlInput.trim() : `https://${linkUrlInput.trim()}`
      });
    }

    await updateHomeworkDelegate(hw.id, {
      delegateNote: delegateNoteInput.trim() || undefined,
      estimatedTime: estimatedTimeInput.trim() || undefined,
      links: links.length > 0 ? links : undefined
    });

    setEditingHomeworkId(null);
  };

  const totalUpcoming =
    groupedHomework.today.length +
    groupedHomework.tomorrow.length +
    groupedHomework.thisWeek.length +
    groupedHomework.nextWeek.length +
    groupedHomework.later.length;

  /**
   * Render single homework card
   */
  const renderHomeworkCard = (hw: Homework, isOverdueItem: boolean = false) => {
    const isDone = completedIds.includes(hw.id);
    const dateIso = parseHomeworkDateIso(hw);
    const frenchDate = formatFrenchDueDate(dateIso, hw.dueDate);
    const subjectColor = getSubjectColor(hw.subject);
    const isEditing = editingHomeworkId === hw.id;

    return (
      <div
        key={hw.id}
        className={`rounded-2xl p-4 sm:p-5 border transition-all duration-150 ${
          isDone
            ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-75'
            : isOverdueItem
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/80 shadow-xs'
            : 'bg-white dark:bg-[#1A2026] border-slate-200 dark:border-slate-800 shadow-xs'
        }`}
        style={{
          borderLeftWidth: '5px',
          borderLeftColor: isDone ? '#94a3b8' : isOverdueItem ? '#991B1B' : subjectColor
        }}
      >
        <div className="flex items-start justify-between gap-3">
          
          {/* Checkbox + Details */}
          <div className="flex items-start space-x-3.5 flex-1 min-w-0">
            
            {/* Checkbox "Fait" */}
            <button
              type="button"
              onClick={() => toggleHomeworkDone(hw.id)}
              className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                isDone
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-[#234E70]'
              }`}
              title={isDone ? 'Marquer comme non fait' : 'Marquer comme fait'}
            >
              {isDone && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
            </button>

            <div className="flex-1 min-w-0 space-y-2">
              
              {/* Top Row: Matière en badge coloré, Date en français */}
              <div className="flex items-center flex-wrap gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: subjectColor }}
                >
                  {hw.subject}
                </span>

                {hw.group && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                    {hw.group}
                  </span>
                )}

                {/* Date en français : e.g. "mardi 6 oct." */}
                <span className="flex items-center text-xs font-extrabold text-slate-800 dark:text-slate-200 capitalize">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                  Pour le {frenchDate}
                </span>

                {/* Badge Alerte En retard */}
                {isOverdueItem && !isDone && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#991B1B] text-white shrink-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    En retard
                  </span>
                )}

                {hw.estimatedTime && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-bold shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    ~{hw.estimatedTime}
                  </span>
                )}
              </div>

              {/* Texte du devoir (sans coupure, saut de ligne propre) */}
              <p
                className={`text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed break-words ${
                  isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                }`}
              >
                {hw.description}
              </p>

              {/* Documents attachés (en petit : "document sur Pronote") */}
              {hw.documents && hw.documents.length > 0 && (
                <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                  {hw.documents.map((doc, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700"
                    >
                      <FileText className="w-3 h-3 mr-1 text-slate-400" />
                      <span className="font-semibold">{doc}</span>
                      <span className="ml-1 text-[10px] text-slate-400">(document sur Pronote)</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Note du délégué */}
              {hw.delegateNote && (
                <div className="p-2.5 rounded-xl bg-[#234E70]/10 dark:bg-sky-950/40 border border-[#234E70]/20 text-xs space-y-1">
                  <p className="font-bold text-[#234E70] dark:text-sky-300 flex items-center">
                    <StickyNote className="w-3.5 h-3.5 mr-1 text-[#234E70] dark:text-sky-400" />
                    Note du délégué pour la classe :
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line break-words">
                    {hw.delegateNote}
                  </p>
                </div>
              )}

              {/* Liens utiles */}
              {hw.links && hw.links.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  {hw.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-[#234E70] dark:text-sky-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{link.title}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* Formulaire d'édition délégué */}
              {isEditing && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Compléter ce devoir (note, temps estimé, liens) :
                  </p>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500">Note ou conseil pour la classe :</label>
                    <textarea
                      value={delegateNoteInput}
                      onChange={(e) => setDelegateNoteInput(e.target.value)}
                      rows={2}
                      placeholder="Ex: Pensez à relire le cours page 34..."
                      className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#234E70]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Temps estimé :</label>
                      <input
                        type="text"
                        value={estimatedTimeInput}
                        onChange={(e) => setEstimatedTimeInput(e.target.value)}
                        placeholder="Ex: 25 min"
                        className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#234E70]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">Titre du lien :</label>
                      <input
                        type="text"
                        value={linkTitleInput}
                        onChange={(e) => setLinkTitleInput(e.target.value)}
                        placeholder="Ex: Fiche méthode"
                        className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#234E70]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500">URL :</label>
                      <input
                        type="text"
                        value={linkUrlInput}
                        onChange={(e) => setLinkUrlInput(e.target.value)}
                        placeholder="https://..."
                        className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#234E70]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingHomeworkId(null)}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => saveDelegateEdit(hw)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#234E70] text-white hover:bg-[#1b3e59]"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right: Bouton d'édition délégué aligné */}
          {isLeader && !isEditing && (
            <button
              type="button"
              onClick={() => startEditDelegate(hw)}
              className="p-2 rounded-xl text-slate-400 hover:text-[#234E70] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Compléter ce devoir (note, temps estimé, liens)"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>
    );
  };

  /**
   * Render Section with header and list
   */
  const renderSection = (title: string, list: Homework[], badgeColor: string = 'bg-slate-100 text-slate-700') => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2 pt-2">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {title}
          </h3>
          <span className={`px-2 py-0.2 rounded-full text-xs font-bold ${badgeColor}`}>
            {list.length}
          </span>
        </div>
        <div className="space-y-3">
          {list.map(hw => renderHomeworkCard(hw, false))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Cahier de textes & Devoirs
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {uniqueHomework.length} travail{uniqueHomework.length > 1 ? 'x' : ''} enregistré{uniqueHomework.length > 1 ? 's' : ''} • Synchronisé avec Pronote
                </p>
              </div>
            </div>
          </div>

          {/* Sync & options buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => openModal('optionsFilter')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Mes options & groupes</span>
            </button>

            {isLeader && (
              <button
                type="button"
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold bg-[#234E70] hover:bg-[#1b3e59] text-white transition-all shadow-xs active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Synchronisation...' : 'Synchroniser Pronote'}
              </button>
            )}
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 text-xs flex items-center space-x-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Filter and search bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Mode pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterMode('todo')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'todo'
                  ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              À faire ({uniqueHomework.filter(h => !completedIds.includes(h.id)).length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Tous ({uniqueHomework.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('done')}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'done'
                  ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Terminés ({uniqueHomework.filter(h => completedIds.includes(h.id)).length})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une matière..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#234E70]"
            />
          </div>
        </div>
      </div>

      {/* Main Homework List Grouped by Due Date */}
      {filteredHomework.length === 0 ? (
        <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-10 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7 text-[#234E70] dark:text-sky-400" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {uniqueHomework.length === 0 ? 'Aucun devoir renseigné' : 'Aucun devoir ne correspond à votre filtre'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {uniqueHomework.length === 0
              ? 'Synchronisez votre espace avec Pronote pour charger automatiquement le travail à faire.'
              : 'Bravo ! Vous êtes à jour dans vos révisions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* ==================================================== */}
          {/* 1. SECTION « EN RETARD » (Replié par défaut avec compteur) */}
          {/* ==================================================== */}
          {groupedHomework.overdue.length > 0 && (
            <div className="rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setIsOverdueOpen(!isOverdueOpen)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-rose-50/60 dark:hover:bg-rose-950/40 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#991B1B] dark:text-rose-400 shrink-0" />
                  <span className="text-sm font-extrabold text-[#991B1B] dark:text-rose-300">
                    En retard
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-[#991B1B] text-white">
                    {groupedHomework.overdue.length}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                    (devoirs passés non terminés)
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-[#991B1B] dark:text-rose-300 font-semibold">
                  <span>{isOverdueOpen ? 'Replier' : 'Afficher'}</span>
                  {isOverdueOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>

              {isOverdueOpen && (
                <div className="p-4 pt-1 space-y-3 border-t border-rose-200 dark:border-rose-900/60">
                  {groupedHomework.overdue.map(hw => renderHomeworkCard(hw, true))}
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* 2. SECTION « AUJOURD'HUI » */}
          {/* ==================================================== */}
          {renderSection(
            "Aujourd'hui",
            groupedHomework.today,
            'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
          )}

          {/* ==================================================== */}
          {/* 3. SECTION « DEMAIN » */}
          {/* ==================================================== */}
          {renderSection(
            'Demain',
            groupedHomework.tomorrow,
            'bg-[#234E70] text-white'
          )}

          {/* ==================================================== */}
          {/* 4. SECTION « CETTE SEMAINE » */}
          {/* ==================================================== */}
          {renderSection(
            'Cette semaine',
            groupedHomework.thisWeek,
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}

          {/* ==================================================== */}
          {/* 5. SECTION « LA SEMAINE PROCHAINE » */}
          {/* ==================================================== */}
          {renderSection(
            'La semaine prochaine',
            groupedHomework.nextWeek,
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}

          {/* ==================================================== */}
          {/* 6. SECTION « PLUS TARD » */}
          {/* ==================================================== */}
          {renderSection(
            'Plus tard',
            groupedHomework.later,
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}

          {/* Message si aucun devoir à venir mais des devoirs en retard */}
          {totalUpcoming === 0 && groupedHomework.overdue.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              Aucun devoir à venir pour les jours prochains. Consultez les devoirs en retard ci-dessus si besoin.
            </div>
          )}

        </div>
      )}

    </div>
  );
};
