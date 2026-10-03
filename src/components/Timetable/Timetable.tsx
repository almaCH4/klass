import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CourseCard } from './CourseCard';
import { PersonalEventCard } from './PersonalEventCard';
import { Course, PersonalEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Lock,
  Layers,
  Sparkles,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertCircle
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
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay(); // 0 is Sun, 1 is Mon...
    return today >= 1 && today <= 5 ? today : 1; // Default to Mon-Fri
  });

  // Week offset (0 = current week)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Compute dates for the displayed week
  const weekDays = useMemo(() => {
    // Current date is 2026-10-02 (Friday)
    const baseDate = new Date();
    // Adjust base date with weekOffset * 7 days
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
        isToday: weekOffset === 0 && d.getDay() === new Date().getDay()
      });
    }
    return days;
  }, [weekOffset]);

  // Current time representation
  const now = new Date();
  const currentHourMinute = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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

    // Combine courses & personal events for sorted chronological view
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Banner / Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Pronote Status */}
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Emploi du temps de la classe
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Semaine du {weekDays[0].formattedShort} au {weekDays[4].formattedShort} 2026
                </p>
              </div>
            </div>

            {/* Pronote Sync Pill */}
            <div className="mt-3 flex items-center flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openModal('pronoteSync')}
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                title="Gérer la synchronisation Pronote / iCal"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Pronote synchro : {currentClass?.pronoteLastSynced || 'Connecté'}
                </span>
                <SlidersHorizontal className="w-3 h-3 ml-1 text-emerald-600 dark:text-emerald-400" />
              </button>

              {isLeader && (
                <button
                  type="button"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                  {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
                </button>
              )}

              {/* Options filter indicator */}
              <button
                type="button"
                onClick={() => openModal('optionsFilter')}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200"
              >
                <Layers className="w-3 h-3 text-slate-400" />
                <span>Mes options & groupes</span>
                {(currentUser?.hiddenCourseCategories?.length || 0) > 0 && (
                  <span className="ml-1 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {currentUser?.hiddenCourseCategories?.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Navigation Controls & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* View Mode Toggle: Day / Week */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Semaine
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Jour
              </button>
            </div>

            {/* Week navigation */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                title="Semaine précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                  weekOffset === 0
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                Aujourd'hui
              </button>

              <button
                type="button"
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
                title="Semaine suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Add buttons */}
            <button
              type="button"
              onClick={() => openModal('personalEvent', { date: currentDisplayedDayInfo.isoDate })}
              className="inline-flex items-center px-3.5 py-2 rounded-2xl text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              + Événement perso
            </button>

            {isLeader && (
              <button
                type="button"
                onClick={() => openModal('editCourse')}
                className="inline-flex items-center px-3.5 py-2 rounded-2xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                + Ajouter cours
              </button>
            )}
          </div>
        </div>

        {/* Day pills when in 'day' view or mobile quick switch */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between overflow-x-auto gap-2 pb-1">
          {weekDays.map((d) => {
            const isSelected = selectedDay === d.dayOfWeek;
            return (
              <button
                key={d.dayOfWeek}
                type="button"
                onClick={() => {
                  setSelectedDay(d.dayOfWeek);
                  if (viewMode === 'week' && window.innerWidth < 768) {
                    // on small mobile, auto-toggle to day view for clean reading
                    setViewMode('day');
                  }
                }}
                className={`flex-1 min-w-[70px] py-2 px-3 rounded-2xl text-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                  {d.name.slice(0, 3)}
                </p>
                <p className="text-sm font-extrabold mt-0.5">
                  {d.date.getDate()}
                </p>
                {d.isToday && (
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Timetable Content */}
      {viewMode === 'week' ? (
        /* WEEK VIEW: 5 columns for Lundi à Vendredi */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {weekDays.map((day) => {
            const { items } = getDaySchedule(day.dayOfWeek, day.isoDate);

            return (
              <div
                key={day.dayOfWeek}
                className={`flex flex-col rounded-3xl p-4 border transition-all ${
                  day.isToday
                    ? 'bg-blue-50/30 dark:bg-blue-950/15 border-blue-300 dark:border-blue-900 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {day.name}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {day.formattedShort}
                    </h3>
                  </div>

                  {day.isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                      Aujourd'hui
                    </span>
                  )}
                </div>

                {/* Day items list */}
                <div className="space-y-3 flex-1">
                  {items.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <p className="text-xs">Aucun cours prévu</p>
                      {isLeader && (
                        <button
                          type="button"
                          onClick={() => openModal('editCourse', { dayOfWeek: day.dayOfWeek })}
                          className="mt-2 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
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
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => openModal('personalEvent', { date: day.isoDate })}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 text-[11px] flex items-center"
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
        /* DAY VIEW: Focused single-day schedule with full details & time marker */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-w-3xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vue détaillée du jour
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {currentDisplayedDayInfo.name} {currentDisplayedDayInfo.date.getDate()} {currentDisplayedDayInfo.date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            {currentDisplayedDayInfo.isToday && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
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
                    <p className="text-base font-semibold">Aucun cours programmé ce jour</p>
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
      )}
    </div>
  );
};
