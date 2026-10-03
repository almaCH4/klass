import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Homework } from '../../types';
import { getSubjectColor } from '../../utils/icsParser';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
  Plus,
  StickyNote,
  Edit2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

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

  const [filterMode, setFilterMode] = useState<'all' | 'todo' | 'done'>('todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingHomeworkId, setEditingHomeworkId] = useState<string | null>(null);
  const [delegateNoteInput, setDelegateNoteInput] = useState('');
  const [estimatedTimeInput, setEstimatedTimeInput] = useState('');
  const [linkTitleInput, setLinkTitleInput] = useState('');
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const completedIds = currentUser?.completedHomeworkIds || [];

  // Determine tomorrow's date in Paris
  const tomorrowFr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  }, []);

  // Filter and sort homework
  const filteredHomework = useMemo(() => {
    let list = [...homework];

    // Filter out groups hidden by student
    const hiddenGroups = currentUser?.hiddenCourseCategories || [];
    if (hiddenGroups.length > 0) {
      list = list.filter(hw => {
        if (hw.group && hiddenGroups.includes(hw.group)) {
          return false;
        }
        return true;
      });
    }

    // Filter by search
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
  }, [homework, currentUser?.hiddenCourseCategories, searchQuery, filterMode, completedIds]);

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

  return (
    <div className="space-y-6 w-full mx-auto pb-16">
      
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-5 sm:p-6 border border-amber-900/10 dark:border-slate-800 shadow-xs transition-colors">
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
                  {homework.length} travail{homework.length > 1 ? 'x' : ''} enregistré{homework.length > 1 ? 's' : ''} • Synchronisé avec Pronote
                </p>
              </div>
            </div>
          </div>

          {/* Sync & options buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => openModal('optionsFilter')}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-amber-50/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-amber-100/70 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Options & Groupes</span>
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
        <div className="mt-4 pt-4 border-t border-amber-900/10 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          
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
              À faire ({homework.filter(h => !completedIds.includes(h.id)).length})
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
              Tous ({homework.length})
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
              Terminés ({homework.filter(h => completedIds.includes(h.id)).length})
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

      {/* Homework Cards List */}
      {filteredHomework.length === 0 ? (
        <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-10 border border-amber-900/10 dark:border-slate-800 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {homework.length === 0 ? 'Aucun devoir renseigné' : 'Tous les devoirs sélectionnés sont terminés !'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {homework.length === 0
              ? 'Synchronisez votre espace avec Pronote pour charger automatiquement le travail à faire.'
              : 'Bravo ! Vous êtes à jour dans vos révisions.'}
          </p>
          {homework.length === 0 && isLeader && (
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold bg-[#234E70] text-white hover:bg-[#1b3e59] shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Lancer la synchronisation Pronote
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredHomework.map((hw) => {
            const isDone = completedIds.includes(hw.id);
            const isTomorrow = hw.dueDate === tomorrowFr || hw.dueDateIso === tomorrowIso;
            const subjectColor = getSubjectColor(hw.subject);
            const isEditing = editingHomeworkId === hw.id;

            return (
              <div
                key={hw.id}
                className={`rounded-2xl p-4 sm:p-5 border transition-all duration-150 ${
                  isDone
                    ? 'bg-slate-50/70 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800/80 opacity-75'
                    : isTomorrow
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/80 shadow-xs'
                    : 'bg-white dark:bg-[#1A2026] border-amber-900/10 dark:border-slate-800 shadow-xs'
                }`}
                style={{
                  borderLeftWidth: '5px',
                  borderLeftColor: isDone ? '#94a3b8' : isTomorrow ? '#991B1B' : subjectColor
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  
                  {/* Left: Checkbox + Content */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    
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
                      
                      {/* Subject + Due Date + Alerts */}
                      <div className="flex items-center flex-wrap gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs"
                          style={{ backgroundColor: subjectColor }}
                        >
                          {hw.subject}
                        </span>

                        {hw.group && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {hw.group}
                          </span>
                        )}

                        <span className="flex items-center text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Pour le {hw.dueDate}
                        </span>

                        {isTomorrow && !isDone && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#991B1B] text-white animate-pulse">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pour demain !
                          </span>
                        )}

                        {hw.givenDate && (
                          <span className="text-[10px] text-slate-400">
                            (Donné le {hw.givenDate})
                          </span>
                        )}

                        {hw.estimatedTime && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-bold">
                            <Clock className="w-3 h-3 mr-1" />
                            ~{hw.estimatedTime}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p
                        className={`text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed ${
                          isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {hw.description}
                      </p>

                      {/* Attached Documents */}
                      {hw.documents && hw.documents.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          {hw.documents.map((doc, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-lg bg-amber-50 dark:bg-slate-800 text-amber-900 dark:text-amber-200 text-xs font-semibold border border-amber-200/80 dark:border-slate-700"
                              title="Document disponible sur votre compte Pronote"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                              <span>{doc}</span>
                              <span className="ml-1 text-[10px] text-slate-400">(sur Pronote)</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Delegate Note & Resources */}
                      {hw.delegateNote && (
                        <div className="p-2.5 rounded-xl bg-[#234E70]/10 dark:bg-sky-950/40 border border-[#234E70]/20 text-xs space-y-1">
                          <p className="font-bold text-[#234E70] dark:text-sky-300 flex items-center">
                            <StickyNote className="w-3.5 h-3.5 mr-1 text-[#234E70] dark:text-sky-400" />
                            Note du délégué pour la classe :
                          </p>
                          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                            {hw.delegateNote}
                          </p>
                        </div>
                      )}

                      {/* Links shared by delegate */}
                      {hw.links && hw.links.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
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

                      {/* Delegate edit form */}
                      {isEditing && (
                        <div className="mt-3 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-slate-800/80 border border-amber-200 dark:border-slate-700 space-y-2.5">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Ajouts du délégué pour ce devoir :
                          </p>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-500">Note ou conseil :</label>
                            <textarea
                              value={delegateNoteInput}
                              onChange={(e) => setDelegateNoteInput(e.target.value)}
                              rows={2}
                              placeholder="Ex: Pensez à réviser la formule du théorème page 54..."
                              className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700"
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
                                className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500">Titre du lien utile :</label>
                              <input
                                type="text"
                                value={linkTitleInput}
                                onChange={(e) => setLinkTitleInput(e.target.value)}
                                placeholder="Ex: Fiche méthode"
                                className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500">URL du lien :</label>
                              <input
                                type="text"
                                value={linkUrlInput}
                                onChange={(e) => setLinkUrlInput(e.target.value)}
                                placeholder="https://..."
                                className="w-full mt-1 p-2 rounded-xl text-xs bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingHomeworkId(null)}
                              className="px-3 py-1.5 rounded-xl text-xs text-slate-500 hover:bg-slate-200"
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

                  {/* Right: Delegate edit button */}
                  {isLeader && !isEditing && (
                    <button
                      type="button"
                      onClick={() => startEditDelegate(hw)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#234E70] hover:bg-amber-100/60 transition-colors shrink-0"
                      title="Compléter ce devoir (note, temps estimé, liens)"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
