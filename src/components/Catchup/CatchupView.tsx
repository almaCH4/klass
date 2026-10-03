import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LessonSession } from '../../types';
import { getSubjectColor } from '../../utils/icsParser';
import {
  Sparkles,
  Calendar,
  FileText,
  User,
  Search,
  BookOpen,
  RefreshCw,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const CatchupView: React.FC = () => {
  const {
    lessonSessions,
    currentUser,
    isLeader,
    syncPronoteIcal,
    openModal
  } = useApp();

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Extract unique subjects
  const allSubjects = useMemo(() => {
    return Array.from(new Set(lessonSessions.map(s => s.subject))).sort();
  }, [lessonSessions]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let list = [...lessonSessions];

    // Filter out groups hidden by student
    const hiddenGroups = currentUser?.hiddenCourseCategories || [];
    if (hiddenGroups.length > 0) {
      list = list.filter(s => {
        if (s.group && hiddenGroups.includes(s.group)) {
          return false;
        }
        return true;
      });
    }

    // Filter by subject
    if (selectedSubject !== 'all') {
      list = list.filter(s => s.subject === selectedSubject);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s =>
          s.subject.toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q) ||
          (s.teacher && s.teacher.toLowerCase().includes(q)) ||
          s.date.includes(q)
      );
    }

    return list;
  }, [lessonSessions, currentUser?.hiddenCourseCategories, selectedSubject, searchQuery]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await syncPronoteIcal();
    setIsSyncing(false);
  };

  return (
    <div className="space-y-6 w-full mx-auto pb-16">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-5 sm:p-6 border border-amber-900/10 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                Rattrapage & Contenus de séance
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Idéal si tu as manqué un cours : retrouve le résumé des leçons et les documents distribués.
              </p>
            </div>
          </div>

          {isLeader && (
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold bg-[#234E70] hover:bg-[#1b3e59] text-white transition-all shadow-xs active:scale-95 disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Synchronisation...' : 'Synchroniser Pronote'}
            </button>
          )}
        </div>

        {/* Filter bar: Subjects pill list + search */}
        <div className="mt-4 pt-4 border-t border-amber-900/10 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Subject Pills (horizontal scroll) */}
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-1">
            <button
              type="button"
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedSubject === 'all'
                  ? 'bg-[#234E70] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Toutes les matières ({lessonSessions.length})
            </button>

            {allSubjects.map((sub) => {
              const count = lessonSessions.filter(s => s.subject === sub).length;
              const isSelected = selectedSubject === sub;
              return (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-[#234E70] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {sub} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une notion, un mot..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#234E70]"
            />
          </div>
        </div>
      </div>

      {/* List of Sessions */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-10 border border-amber-900/10 dark:border-slate-800 shadow-xs text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {lessonSessions.length === 0 ? 'Aucun contenu de séance importé' : 'Aucune séance trouvée pour cette recherche'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
            {lessonSessions.length === 0
              ? 'Dès que vos professeurs remplissent le cahier de textes sur Pronote, synchronisez pour alimenter cette rubrique.'
              : 'Essayez un autre mot-clé ou réinitialisez le filtre de matière.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSessions.map((session) => {
            const subjectColor = getSubjectColor(session.subject);

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-[#1A2026] rounded-2xl p-5 border border-amber-900/10 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                style={{
                  borderTopWidth: '4px',
                  borderTopColor: subjectColor
                }}
              >
                <div className="space-y-3">
                  
                  {/* Subject, Group & Date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: subjectColor }}
                      >
                        {session.subject}
                      </span>

                      {session.group && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {session.group}
                        </span>
                      )}
                    </div>

                    <span className="flex items-center text-xs font-extrabold text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      {session.date}
                    </span>
                  </div>

                  {session.teacher && (
                    <p className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <User className="w-3 h-3 mr-1 text-slate-400" />
                      {session.teacher}
                    </p>
                  )}

                  {/* Session Content */}
                  <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-slate-800/60 border border-amber-900/5 dark:border-slate-700/60 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed space-y-1.5">
                    {session.title && (
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white pb-1 border-b border-amber-900/10 dark:border-slate-700/80">
                        {session.title}
                      </h4>
                    )}
                    <p>{session.content}</p>
                  </div>
                </div>

                {/* Documents */}
                {session.documents && session.documents.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-amber-900/5 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                    {session.documents.map((doc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold"
                        title="Document disponible sur votre compte Pronote"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1 text-[#234E70] dark:text-sky-400" />
                        <span>{doc}</span>
                        <span className="ml-1 text-[10px] text-slate-400">(sur Pronote)</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
