import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { CourseCatchupModal } from './CourseCatchupModal';
import {
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  FileText,
  Clock,
  MapPin,
  User as UserIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  StickyNote,
  BookOpen,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const CatchupView: React.FC = () => {
  const {
    courses,
    currentUser,
    currentClass,
    isLeader,
    openModal
  } = useApp();

  // Navigation mode: 'day' | 'week'
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Initial state: Aujourd'hui ou lundi prochain si week-end
  const getInitialState = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Dimanche, 6 is Samedi
    if (day === 0 || day === 6) {
      return { weekOffset: 1, selectedDay: 1 };
    }
    return { weekOffset: 0, selectedDay: day };
  };

  const [weekOffset, setWeekOffset] = useState<number>(() => getInitialState().weekOffset);
  const [selectedDay, setSelectedDay] = useState<number>(() => getInitialState().selectedDay);

  // Secondary filters: matière et recherche
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal fiche de cours
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<Course | null>(null);

  // Compute dates for displayed week (Lundi à Vendredi)
  const weekDays = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    const currentDay = baseDate.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + diffToMonday);

    const days = [];
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isoDate = d.toISOString().slice(0, 10);
      days.push({
        dayOfWeek: i + 1,
        name: dayNames[i],
        date: d,
        isoDate,
        formattedShort: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        formattedFull: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        isToday: d.toDateString() === new Date().toDateString()
      });
    }
    return days;
  }, [weekOffset]);

  // Unique subjects for secondary filter dropdown
  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    courses.forEach(c => {
      if (c.subject) subjects.add(c.subject);
    });
    return Array.from(subjects).sort();
  }, [courses]);

  // Filter courses based on user's hidden categories
  const filteredCourses = useMemo(() => {
    const hidden = currentUser?.hiddenCourseCategories || [];
    return courses.filter(c => {
      if (c.category && hidden.includes(c.category)) {
        return false;
      }
      return true;
    });
  }, [courses, currentUser?.hiddenCourseCategories]);

  // Navigation handlers
  const goToPreviousDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(prev => prev - 1);
    } else {
      setWeekOffset(prev => prev - 1);
      setSelectedDay(5);
    }
  };

  const goToNextDay = () => {
    if (selectedDay < 5) {
      setSelectedDay(prev => prev + 1);
    } else {
      setWeekOffset(prev => prev + 1);
      setSelectedDay(1);
    }
  };

  /**
   * Retrieves and deduplicates courses for a specific day and applies secondary filters
   */
  const getDayCatchupCourses = (dayOfWeek: number, isoDate: string) => {
    // 1. Filtrage sur la date exacte ou dayOfWeek
    const matching = filteredCourses.filter(c => {
      if (c.date) {
        return c.date === isoDate;
      }
      return c.dayOfWeek === dayOfWeek;
    });

    // 2. Déduplication (même matière, même début, même fin, même date)
    const seen = new Set<string>();
    const deduplicated: Course[] = [];
    for (const c of matching) {
      const key = `${c.subject.trim().toLowerCase()}_${c.startTime}_${c.endTime}_${c.date || isoDate}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(c);
      }
    }

    // 3. Application des filtres secondaires (Matière & Recherche)
    let result = deduplicated;

    if (selectedSubject !== 'all') {
      result = result.filter(c => c.subject === selectedSubject);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        c =>
          c.subject.toLowerCase().includes(q) ||
          (c.lessonContent && c.lessonContent.toLowerCase().includes(q)) ||
          (c.catchupData?.lessonSummary && c.catchupData.lessonSummary.toLowerCase().includes(q)) ||
          (c.catchupData?.adviceNote && c.catchupData.adviceNote.toLowerCase().includes(q)) ||
          (c.teacher && c.teacher.toLowerCase().includes(q)) ||
          (c.group && c.group.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const currentDisplayedDayInfo = weekDays.find(d => d.dayOfWeek === selectedDay) || weekDays[0];

  /**
   * Renders indicators badges for a course card
   */
  const renderContentIndicators = (course: Course) => {
    const hasPronoteContent = Boolean(course.lessonContent);
    const hasDelegateSummary = Boolean(course.catchupData?.lessonSummary);
    const hasAdvice = Boolean(course.catchupData?.adviceNote || course.delegateNote?.text);
    const hasDocuments = Boolean(course.documents && course.documents.length > 0);
    const hasLinks = Boolean(course.catchupData?.links && course.catchupData.links.length > 0);
    const hasImages = Boolean(course.catchupData?.images && course.catchupData.images.length > 0);

    const hasAnyContent = hasPronoteContent || hasDelegateSummary || hasAdvice || hasDocuments || hasLinks || hasImages;

    if (!hasAnyContent) {
      return (
        <span className="text-[11px] text-slate-400 italic">
          Fiche vierge • Cliquez pour ajouter ou consulter
        </span>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {hasPronoteContent && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-sky-950/60 dark:text-sky-300 border border-blue-200 dark:border-sky-800">
            <FileText className="w-3 h-3 mr-1" />
            Contenu Pronote
          </span>
        )}

        {hasDelegateSummary && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <BookOpen className="w-3 h-3 mr-1" />
            Résumé de cours
          </span>
        )}

        {hasAdvice && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <StickyNote className="w-3 h-3 mr-1" />
            Conseil / Rappel
          </span>
        )}

        {hasDocuments && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <FileText className="w-3 h-3 mr-1 text-slate-400" />
            Documents ({course.documents!.length})
          </span>
        )}

        {hasLinks && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <LinkIcon className="w-3 h-3 mr-1" />
            Drive / Liens ({course.catchupData!.links!.length})
          </span>
        )}

        {hasImages && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ImageIcon className="w-3 h-3 mr-1" />
            Photos tableau ({course.catchupData!.images!.length})
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 w-full mx-auto pb-16">
      
      {/* ==================================================== */}
      {/* TOP HEADER & CONTROLS (Identique à l'emploi du temps) */}
      {/* ==================================================== */}
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Description */}
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Rattrapage & Fiches de cours
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Consulte les cours de chaque journée : résumés Pronote, notes des délégués, liens Drive et photos de tableau.
                </p>
              </div>
            </div>
          </div>

          {/* Controls: Mode toggle, Week navigation & Search trigger */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View Mode Toggle: Day / Week (desktop only) */}
            <div className="hidden md:flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Jour
              </button>
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Semaine
              </button>
            </div>

            {/* Week navigation */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const init = getInitialState();
                  setWeekOffset(init.weekOffset);
                  setSelectedDay(init.selectedDay);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  weekOffset === getInitialState().weekOffset
                    ? 'bg-[#234E70] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                {new Date().getDay() === 0 || new Date().getDay() === 6 ? 'Semaine proch.' : 'Aujourd\'hui'}
              </button>

              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary filter toggle button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-colors ${
                showFilters || selectedSubject !== 'all' || searchQuery.trim()
                  ? 'bg-[#234E70] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtres</span>
              {(selectedSubject !== 'all' || searchQuery.trim()) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Secondary filters bar: Matière et recherche */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 animate-in fade-in">
            {/* Subject dropdown */}
            <div className="w-full sm:w-60">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Filtrer par matière :
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
              >
                <option value="all">Toutes les matières</option>
                {allSubjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Search input */}
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Recherche dans les leçons et résumés :
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une notion, un chapitre, un mot-clé..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
                />
              </div>
            </div>

            {(selectedSubject !== 'all' || searchQuery.trim()) && (
              <div className="sm:self-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline"
                >
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        )}

        {/* Day selector pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between overflow-x-auto gap-2 pb-0.5 no-scrollbar">
          {weekDays.map((d) => {
            const isSelected = selectedDay === d.dayOfWeek;
            return (
              <button
                key={d.dayOfWeek}
                type="button"
                onClick={() => setSelectedDay(d.dayOfWeek)}
                className={`flex-1 min-w-[65px] py-2 px-2.5 rounded-2xl text-center transition-all ${
                  isSelected
                    ? 'bg-[#234E70] text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  {d.name.slice(0, 3)}
                </p>
                <p className="text-sm font-extrabold mt-0.5">
                  {d.date.getDate()}
                </p>
                {d.isToday && (
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-[#234E70] dark:bg-sky-400'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================== */}
      {/* VUE SEMAINE COMPACTE (Desktop) */}
      {/* ==================================================== */}
      {viewMode === 'week' && (
        <div className="hidden md:grid md:grid-cols-5 gap-3.5">
          {weekDays.map((day) => {
            const dayCourses = getDayCatchupCourses(day.dayOfWeek, day.isoDate);

            return (
              <div
                key={day.dayOfWeek}
                className={`flex flex-col rounded-3xl p-3.5 border transition-all ${
                  day.isToday
                    ? 'bg-sky-50/30 dark:bg-slate-900/90 border-[#234E70] ring-2 ring-[#234E70]/20 shadow-xs'
                    : 'bg-white dark:bg-[#1A2026] border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {day.name}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {day.formattedShort}
                    </h3>
                  </div>

                  {day.isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#234E70] text-white">
                      Aujourd'hui
                    </span>
                  )}
                </div>

                {/* Day items list compact */}
                <div className="space-y-2 flex-1">
                  {dayCourses.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <p className="text-xs">Aucun cours</p>
                    </div>
                  ) : (
                    dayCourses.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCourseForModal(c)}
                        className="group p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A2026] hover:border-[#234E70] hover:shadow-xs cursor-pointer transition-all text-xs"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: c.color || '#234E70'
                        }}
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{c.startTime} - {c.endTime}</span>
                          {c.group && (
                            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {c.group}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {c.subject}
                        </div>
                        {renderContentIndicators(c)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* VUE JOUR PAR JOUR (Par défaut & mobile) */}
      {/* ==================================================== */}
      {(viewMode === 'day' || (typeof window !== 'undefined' && window.innerWidth < 768)) && (
        <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs max-w-3xl mx-auto">
          
          {/* Day Navigation Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
            <button
              type="button"
              onClick={goToPreviousDay}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1 shrink-0"
              title="Jour précédent"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">Jour préc.</span>
            </button>

            <div className="text-center flex-1 min-w-0">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {currentDisplayedDayInfo.isToday ? "Aujourd'hui" : "Séance du jour"}
              </span>
              <h3 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white capitalize truncate">
                {currentDisplayedDayInfo.formattedFull}
              </h3>
            </div>

            <button
              type="button"
              onClick={goToNextDay}
              className="p-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center space-x-1 shrink-0"
              title="Jour suivant"
            >
              <span className="hidden sm:inline text-xs font-semibold">Jour suiv.</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Courses list of this day */}
          <div className="mt-5 space-y-3">
            {(() => {
              const dayCourses = getDayCatchupCourses(
                currentDisplayedDayInfo.dayOfWeek,
                currentDisplayedDayInfo.isoDate
              );

              if (dayCourses.length === 0) {
                return (
                  <div className="py-14 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Aucun cours programmé ce jour
                    </p>
                    <p className="text-xs mt-1">
                      {selectedSubject !== 'all' || searchQuery.trim()
                        ? 'Aucun cours ne correspond à vos critères de recherche.'
                        : 'Profitez de cette journée sans cours pour réviser !'}
                    </p>
                  </div>
                );
              }

              return dayCourses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCourseForModal(c)}
                  className="group relative rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A2026] hover:border-[#234E70] hover:shadow-sm cursor-pointer transition-all duration-150"
                  style={{
                    borderLeftWidth: '5px',
                    borderLeftColor: c.color || '#234E70'
                  }}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    
                    {/* Time column on the left */}
                    <div className="shrink-0 w-20 sm:w-24 text-left">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                        {c.startTime}
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-400">
                          {c.endTime}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Subject, Group, Room, Teacher & Content Indicators */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#234E70] dark:group-hover:text-sky-400 transition-colors truncate">
                          {c.subject}
                        </h4>

                        {c.group && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                            {c.group}
                          </span>
                        )}

                        {c.statusLabel && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#991B1B] text-white shrink-0">
                            {c.statusLabel}
                          </span>
                        )}
                      </div>

                      {/* Small Subline: Room & Teacher if known */}
                      {(c.room || c.teacher) && (
                        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
                          {c.room && !/d[ée]finir/i.test(c.room) && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span>{c.room}</span>
                            </span>
                          )}
                          {c.teacher && !/^professeur$/i.test(c.teacher.trim()) && (
                            <span className="flex items-center">
                              <UserIcon className="w-3 h-3 mr-1" />
                              <span>{c.teacher.replace(/^(?:Professeur|Enseignant(?:e)?)\s*:\s*/i, '')}</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Content Indicators (Pronote, Résumé, Documents, Drive, Photos) */}
                      {renderContentIndicators(c)}
                    </div>

                    {/* Right: Action arrow */}
                    <div className="shrink-0 self-center">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 group-hover:bg-[#234E70] group-hover:text-white transition-colors">
                        Fiche
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>

                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DETAILED COURSE CATCHUP MODAL */}
      {/* ==================================================== */}
      <CourseCatchupModal
        course={selectedCourseForModal}
        isOpen={Boolean(selectedCourseForModal)}
        onClose={() => setSelectedCourseForModal(null)}
      />

    </div>
  );
};
