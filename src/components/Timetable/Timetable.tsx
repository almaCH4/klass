import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CourseCard } from './CourseCard';
import { PersonalEventCard } from './PersonalEventCard';
import { Course, PersonalEvent } from '../../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  Layers,
  Upload,
  Clock,
  Sparkles
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

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Requirement 5: Le samedi et le dimanche, afficher par défaut la semaine suivante
  const getInitialWeekOffset = () => {
    const day = new Date().getDay(); // 0 is Dimanche, 6 is Samedi
    return (day === 0 || day === 6) ? 1 : 0;
  };

  const [weekOffset, setWeekOffset] = useState<number>(getInitialWeekOffset);

  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay();
    return today >= 1 && today <= 5 ? today : 1;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);

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
    await syncPronoteIcal();
    setIsSyncing(false);
  };

  const getDaySchedule = (dayOfWeek: number, isoDate: string) => {
    const dayCourses = filteredCourses
      .filter(c => c.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    const dayPersonalEvents = userPersonalEvents
      .filter(e => e.date === isoDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    type ScheduleItem =
      | { type: 'course'; data: Course; time: string }
      | { type: 'event'; data: PersonalEvent; time: string };

    const items: ScheduleItem[] = [
      ...dayCourses.map(c => ({ type: 'course' as const, data: c, time: c.startTime })),
      ...dayPersonalEvents.map(e => ({ type: 'event' as const, data: e, time: e.startTime }))
    ].sort((a, b) => a.time.localeCompare(b.time));

    return { dayCourses, dayPersonalEvents, items };
  };

  const currentDisplayedDayInfo = weekDays.find(d => d.dayOfWeek === selectedDay) || weekDays[0];

  // Check if any courses have been imported
  const hasImportedSchedule = courses.length > 0;

  return (
    <div className="space-y-6 w-full mx-auto">
      
      {/* Top Banner / Controls */}
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-5 sm:p-6 border border-amber-900/10 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Pronote Status */}
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/50 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Emploi du temps de la classe
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Semaine du {weekDays[0].formattedShort} au {weekDays[4].formattedShort} {weekDays[0].date.getFullYear()}
                </p>
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center flex-wrap gap-2 pt-1">
              {/* Requirement 5: Le statut "Pronote synchro : Connecté" ne doit apparaître que si un emploi du temps a réellement été importé ; sinon affiche "Pas encore importé" */}
              {hasImportedSchedule ? (
                <button
                  type="button"
                  onClick={() => openModal('pronoteSync')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 transition-colors shadow-xs"
                  title="Gérer la synchronisation Pronote / iCal"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Pronote synchro : Connecté</span>
                  <SlidersHorizontal className="w-3 h-3 ml-1 text-emerald-600 dark:text-emerald-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openModal('pronoteSync')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 transition-colors shadow-xs"
                  title="Importer votre emploi du temps Pronote (.ics)"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Pronote : Pas encore importé</span>
                  <SlidersHorizontal className="w-3 h-3 ml-1 text-amber-600 dark:text-amber-400" />
                </button>
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
          </div>

          {/* Navigation Controls & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            
            {/* View Mode Toggle: Day / Week */}
            <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
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
                onClick={() => setWeekOffset(getInitialWeekOffset())}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  weekOffset === getInitialWeekOffset()
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
              + Événement perso
            </button>

            {isLeader && (
              <button
                type="button"
                onClick={() => openModal('editCourse')}
                className="inline-flex items-center px-3.5 py-2 rounded-2xl text-xs font-bold bg-[#234E70] hover:bg-[#1b3e59] text-white transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + Ajouter cours
              </button>
            )}
          </div>
        </div>

        {/* Day pills row for quick switching */}
        <div className="mt-4 pt-4 border-t border-amber-900/10 dark:border-slate-800/80 flex items-center justify-between overflow-x-auto gap-2 pb-0.5 no-scrollbar">
          {weekDays.map((d) => {
            const isSelected = selectedDay === d.dayOfWeek;
            return (
              <button
                key={d.dayOfWeek}
                type="button"
                onClick={() => {
                  setSelectedDay(d.dayOfWeek);
                  if (viewMode === 'week' && window.innerWidth < 768) {
                    setViewMode('day');
                  }
                }}
                className={`flex-1 min-w-[70px] py-2 px-3 rounded-2xl text-center transition-all ${
                  isSelected
                    ? 'bg-[#234E70] text-white shadow-xs'
                    : 'bg-amber-50/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-700/60'
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

      {/* Requirement 5: Quand la semaine est vide, afficher pour les délégués un message clair « Importe ton emploi du temps Pronote (.ics) » avec un bouton d'import */}
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
                className="inline-flex items-center px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold bg-amber-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-amber-100/60 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Ajouter un cours manuellement
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1A2026] border border-amber-900/10 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 mx-auto flex items-center justify-center mb-4">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Emploi du temps pas encore importé
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
              Les délégués de ta classe n'ont pas encore importé le fichier Pronote (.ics). Dès qu'il sera chargé, tes cours s'afficheront ici automatiquement.
            </p>
            <div className="mt-5">
              <button
                type="button"
                onClick={() => openModal('personalEvent', { date: currentDisplayedDayInfo.isoDate })}
                className="inline-flex items-center px-4 py-2 rounded-2xl text-xs font-bold bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-xs"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                + Ajouter un événement personnel
              </button>
            </div>
          </div>
        )
      ) : (
        /* Main Timetable Grid */
        viewMode === 'week' ? (
          /* WEEK VIEW: 5 columns for Lundi à Vendredi */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {weekDays.map((day) => {
              const { items } = getDaySchedule(day.dayOfWeek, day.isoDate);

              return (
                <div
                  key={day.dayOfWeek}
                  className={`flex flex-col rounded-3xl p-4 border transition-all ${
                    day.isToday
                      ? 'bg-amber-50/40 dark:bg-slate-900/90 border-[#234E70]/40 dark:border-sky-700 ring-2 ring-[#234E70]/20 shadow-xs'
                      : 'bg-white dark:bg-[#1A2026] border-amber-900/10 dark:border-slate-800/80 shadow-xs'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-900/5 dark:border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {day.name}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {day.formattedShort}
                      </h3>
                    </div>

                    {day.isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#234E70] text-white">
                        Aujourd'hui
                      </span>
                    )}
                  </div>

                  {/* Day items list */}
                  <div className="space-y-3 flex-1">
                    {items.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 dark:text-slate-500">
                        <p className="text-xs">Aucun cours prévu</p>
                        {isLeader && (
                          <button
                            type="button"
                            onClick={() => openModal('editCourse', { dayOfWeek: day.dayOfWeek })}
                            className="mt-2 text-[11px] text-[#234E70] dark:text-sky-400 font-semibold hover:underline"
                          >
                            + Ajouter un cours
                          </button>
                        )}
                      </div>
                    ) : (
                      items.map((item) => {
                        if (item.type === 'course') {
                          return (
                            <CourseCard
                              key={item.data.id}
                              course={item.data}
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

                  {/* Day bottom quick add */}
                  <div className="mt-3 pt-2 border-t border-amber-900/5 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <button
                      type="button"
                      onClick={() => openModal('personalEvent', { date: day.isoDate })}
                      className="hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] font-medium flex items-center"
                      title="Ajouter un mémo ou événement personnel ce jour"
                    >
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      + Note perso
                    </button>
                    <span className="text-[10px]">
                      {items.length} {items.length > 1 ? 'créneaux' : 'créneau'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* DAY VIEW: Focused single-day schedule */
          <div className="bg-white dark:bg-[#1A2026] rounded-3xl p-6 border border-amber-900/10 dark:border-slate-800 shadow-xs max-w-3xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b border-amber-900/5 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Vue détaillée du jour
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {currentDisplayedDayInfo.name} {currentDisplayedDayInfo.date.getDate()} {currentDisplayedDayInfo.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              {currentDisplayedDayInfo.isToday && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#234E70] text-white">
                  Aujourd'hui
                </span>
              )}
            </div>

            {/* Chronological list of courses & personal events */}
            <div className="mt-6 space-y-4">
              {(() => {
                const { items } = getDaySchedule(currentDisplayedDayInfo.dayOfWeek, currentDisplayedDayInfo.isoDate);
                if (items.length === 0) {
                  return (
                    <div className="py-16 text-center text-slate-400">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Aucun cours programmé ce jour</p>
                      <p className="text-xs mt-1">Profitez de votre journée ou organisez une séance de révision !</p>
                    </div>
                  );
                }
                return items.map((item) => {
                  if (item.type === 'course') {
                    return (
                      <CourseCard
                        key={item.data.id}
                        course={item.data}
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
        )
      )}
    </div>
  );
};
