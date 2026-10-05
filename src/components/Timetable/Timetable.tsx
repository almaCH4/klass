import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CourseCard } from './CourseCard';
import { PersonalEventCard } from './PersonalEventCard';
import { Course, PersonalEvent } from '../../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  Layers,
  RefreshCw,
  Upload,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const Timetable: React.FC = () => {
  const {
    courses,
    personalEvents,
    currentUser,
    currentClass,
    isLeader,
    openModal,
    syncPronoteIcal
  } = useApp();

  // Vue par défaut : « Jour »
  const [viewMode, setViewMode] = useState<'week' | 'day'>('day');

  // Déterminer la date d'aujourd'hui ou le prochain jour de cours si c'est le week-end
  const getInitialState = () => {
    const today = new Date();
    const day = today.getDay(); // 0 is Dimanche, 6 is Samedi
    if (day === 0 || day === 6) {
      // Le week-end : afficher le lundi de la semaine suivante
      return {
        weekOffset: 1,
        selectedDay: 1
      };
    }
    return {
      weekOffset: 0,
      selectedDay: day
    };
  };

  const [weekOffset, setWeekOffset] = useState<number>(() => getInitialState().weekOffset);
  const [selectedDay, setSelectedDay] = useState<number>(() => getInitialState().selectedDay);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; success: boolean } | null>(null);

  // Compute dates for the displayed week (Lundi à Vendredi)
  const weekDays = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);

    // Find Monday of this week
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

  // Filter personal events for current user
  const userPersonalEvents = useMemo(() => {
    if (!currentUser) return [];
    return personalEvents.filter(e => e.userId === currentUser.id);
  }, [personalEvents, currentUser]);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await syncPronoteIcal();
    setIsSyncing(false);
    setSyncFeedback({ message: res.message, success: res.success });
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Navigation jour précédent / jour suivant
  const goToPreviousDay = () => {
    if (selectedDay > 1) {
      setSelectedDay(prev => prev - 1);
    } else {
      setWeekOffset(prev => prev - 1);
      setSelectedDay(5); // Vendredi précédent
    }
  };

  const goToNextDay = () => {
    if (selectedDay < 5) {
      setSelectedDay(prev => prev + 1);
    } else {
      setWeekOffset(prev => prev + 1);
      setSelectedDay(1); // Lundi suivant
    }
  };

  /**
   * getDaySchedule :
   * 1. Filtre les cours sur la date exacte (jour, mois, année) de la semaine affichée
   * 2. Supprime les doublons (même matière, même début, même fin, même date)
   * 3. Surligne le cours en cours et le prochain cours de la journée
   */
  const getDaySchedule = (dayOfWeek: number, isoDate: string) => {
    // 1. Filtrage sur la date exacte (ou fallback sur dayOfWeek si cours manuel sans date)
    const matchingCourses = filteredCourses.filter(c => {
      if (c.date) {
        return c.date === isoDate;
      }
      return c.dayOfWeek === dayOfWeek;
    });

    // 2. Suppression des doublons (même matière, même début, même fin, même date)
    const seen = new Set<string>();
    const deduplicatedCourses: Course[] = [];
    for (const c of matchingCourses) {
      const key = `${c.subject.trim().toLowerCase()}_${c.startTime}_${c.endTime}_${c.date || isoDate}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicatedCourses.push(c);
      }
    }

    const dayCourses = deduplicatedCourses.sort((a, b) => a.startTime.localeCompare(b.startTime));

    const dayPersonalEvents = userPersonalEvents
      .filter(e => e.date === isoDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // 3. Détermination du cours en cours et du prochain cours de la journée
    const now = new Date();
    const currentParisMinutes = now.getHours() * 60 + now.getMinutes();
    const isToday = isoDate === new Date().toISOString().slice(0, 10);

    let currentCourseId: string | null = null;
    let nextCourseId: string | null = null;

    if (isToday) {
      // Trouver le cours qui a lieu actuellement
      for (const c of dayCourses) {
        const [sh, sm] = c.startTime.split(':').map(Number);
        const [eh, em] = c.endTime.split(':').map(Number);
        const startM = (sh || 0) * 60 + (sm || 0);
        const endM = (eh || 0) * 60 + (em || 0);

        if (!c.isCancelled && currentParisMinutes >= startM && currentParisMinutes < endM) {
          currentCourseId = c.id;
          break;
        }
      }

      // Trouver le prochain cours à venir aujourd'hui
      let minDiff = Infinity;
      for (const c of dayCourses) {
        if (c.id === currentCourseId || c.isCancelled) continue;
        const [sh, sm] = c.startTime.split(':').map(Number);
        const startM = (sh || 0) * 60 + (sm || 0);
        if (startM > currentParisMinutes && (startM - currentParisMinutes) < minDiff) {
          minDiff = startM - currentParisMinutes;
          nextCourseId = c.id;
        }
      }
    }

    type ScheduleItem =
      | { type: 'course'; data: Course; isCurrent: boolean; isNext: boolean; time: string }
      | { type: 'event'; data: PersonalEvent; time: string };

    const items: ScheduleItem[] = [
      ...dayCourses.map(c => ({
        type: 'course' as const,
        data: c,
        isCurrent: c.id === currentCourseId,
        isNext: c.id === nextCourseId,
        time: c.startTime
      })),
      ...dayPersonalEvents.map(e => ({
        type: 'event' as const,
        data: e,
        time: e.startTime
      }))
    ].sort((a, b) => a.time.localeCompare(b.time));

    return { dayCourses, dayPersonalEvents, items };
  };

  const currentDisplayedDayInfo = weekDays.find(d => d.dayOfWeek === selectedDay) || weekDays[0];

  return (
    <div className="space-y-5 w-full mx-auto pb-12">
      
      {/* Top Banner / Controls */}
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Pronote Status */}
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Emploi du temps
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {currentClass?.name ? `Classe de ${currentClass.name}` : 'Planning hebdomadaire'}
                </p>
              </div>
            </div>

            {/* Badges & Sync row */}
            <div className="flex items-center flex-wrap gap-2 pt-1">
              {currentClass?.pronoteLastSynced ? (
                <button
                  type="button"
                  onClick={() => openModal('pronoteSync')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Pronote synchronisé</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openModal('pronoteSync')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Pronote : Non importé</span>
                </button>
              )}

              {/* Délégué controls */}
              {isLeader && (
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isSyncing}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#234E70] text-white hover:bg-[#1b3e59] shadow-xs active:scale-95 disabled:opacity-60 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
                  </button>

                  {currentClass?.pronoteLastSynced && (
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800/80 px-2.5 py-0.5 rounded-full">
                      {currentClass.pronoteLastSynced.includes('à')
                        ? `Dernière synchro à ${currentClass.pronoteLastSynced.split('à')[1]?.trim() || ''}`
                        : `Dernière synchro : ${currentClass.pronoteLastSynced}`}
                    </span>
                  )}
                </div>
              )}

              {/* Options filter button */}
              <button
                type="button"
                onClick={() => openModal('optionsFilter')}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Mes options & groupes</span>
                {(currentUser?.hiddenCourseCategories?.length || 0) > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#234E70] text-white text-[10px] font-bold">
                    {currentUser?.hiddenCourseCategories?.length}
                  </span>
                )}
              </button>
            </div>

            {/* Sync feedback notification */}
            {syncFeedback && (
              <div
                className={`mt-2 p-3 rounded-2xl text-xs flex items-center space-x-2 border transition-all animate-in fade-in duration-200 ${
                  syncFeedback.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}
              >
                <span className="font-semibold">{syncFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Navigation Controls & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View Mode Toggle: Day / Week (Visible uniquement sur tablette / ordinateur) */}
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

            {/* Add action buttons */}
            <button
              type="button"
              onClick={() => openModal('personalEvent', { date: currentDisplayedDayInfo.isoDate })}
              className="inline-flex items-center px-3.5 py-2 rounded-2xl text-xs font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800/80 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">+ Événement perso</span>
              <span className="sm:hidden">+ Perso</span>
            </button>

            {isLeader && (
              <button
                type="button"
                onClick={() => openModal('editCourse')}
                className="inline-flex items-center px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#234E70] hover:bg-[#1b3e59] text-white transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">+ Ajouter cours</span>
                <span className="sm:hidden">+ Cours</span>
              </button>
            )}
          </div>
        </div>

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

      {/* Main Content Area */}
      {courses.length === 0 ? (
        isLeader ? (
          <div className="bg-white dark:bg-[#1A2026] border-2 border-dashed border-[#234E70]/30 dark:border-sky-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/60 dark:text-sky-400 mx-auto flex items-center justify-center mb-4 shadow-xs">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Importe ton emploi du temps Pronote (.ics)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              Exporte en 1 clic ton fichier iCal (.ics) depuis ton compte Pronote, puis glisse-le ici pour charger instantanément l'emploi du temps de toute la classe.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => openModal('pronoteSync')}
                className="inline-flex items-center px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-[#234E70] hover:bg-[#1b3e59] text-white transition-all shadow-xs active:scale-95"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer mon fichier Pronote (.ics)
              </button>
              <button
                type="button"
                onClick={() => openModal('editCourse')}
                className="inline-flex items-center px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Ajouter un cours manuellement
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 mx-auto flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Emploi du temps pas encore importé
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
              Les délégués de ta classe n'ont pas encore importé le fichier Pronote (.ics). Dès qu'il sera chargé, tes cours s'afficheront ici automatiquement.
            </p>
          </div>
        )
      ) : (
        /* RENDER VUE SEMAINE OU VUE JOUR */
        viewMode === 'week' ? (
          /* VUE SEMAINE (Grille compacte 5 colonnes sur desktop) */
          <div className="hidden md:grid md:grid-cols-5 gap-3.5">
            {weekDays.map((day) => {
              const { items } = getDaySchedule(day.dayOfWeek, day.isoDate);

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
                    {items.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 dark:text-slate-500">
                        <p className="text-xs">Aucun cours</p>
                      </div>
                    ) : (
                      items.map((item) => {
                        if (item.type === 'course') {
                          return (
                            <CourseCard
                              key={item.data.id}
                              course={item.data}
                              layout="week"
                              isCurrent={item.isCurrent}
                              isNext={item.isNext}
                              onEditNote={(course) => openModal('editNote', course)}
                              onEditCourse={(course) => openModal('editCourse', course)}
                            />
                          );
                        } else {
                          return (
                            <PersonalEventCard
                              key={item.data.id}
                              event={item.data}
                              onEdit={(event) => openModal('personalEvent', event)}
                            />
                          );
                        }
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null
      )}

      {/* VUE JOUR (Par défaut & vue obligatoire sur mobile avec boutons précédent/suivant) */}
      {(viewMode === 'day' || (typeof window !== 'undefined' && window.innerWidth < 768)) && courses.length > 0 && (
        <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs max-w-3xl mx-auto">
          
          {/* Day Navigation Header with Prev / Next Buttons */}
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
                {currentDisplayedDayInfo.isToday ? "Aujourd'hui" : "Jour sélectionné"}
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

          {/* Liste verticale : une ligne par cours */}
          <div className="mt-5 space-y-3">
            {(() => {
              const { items } = getDaySchedule(currentDisplayedDayInfo.dayOfWeek, currentDisplayedDayInfo.isoDate);
              if (items.length === 0) {
                return (
                  <div className="py-14 text-center text-slate-400">
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Aucun cours prévu ce jour
                    </p>
                    <p className="text-xs mt-1">
                      Profitez de votre journée ou avancez vos devoirs !
                    </p>
                  </div>
                );
              }
              return items.map((item) => {
                if (item.type === 'course') {
                  return (
                    <CourseCard
                      key={item.data.id}
                      course={item.data}
                      layout="day"
                      isCurrent={item.isCurrent}
                      isNext={item.isNext}
                      onEditNote={(course) => openModal('editNote', course)}
                      onEditCourse={(course) => openModal('editCourse', course)}
                    />
                  );
                } else {
                  return (
                    <PersonalEventCard
                      key={item.data.id}
                      event={item.data}
                      onEdit={(event) => openModal('personalEvent', event)}
                    />
                  );
                }
              });
            })()}
          </div>
        </div>
      )}

    </div>
  );
};
