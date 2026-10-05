import React, { useState } from 'react';
import { Course } from '../../types';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Info,
  StickyNote,
  Edit2,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CourseCardProps {
  course: Course;
  layout?: 'day' | 'week';
  isCurrent?: boolean;
  isNext?: boolean;
  onEditNote?: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  layout = 'day',
  isCurrent = false,
  isNext = false,
  onEditNote,
  onEditCourse
}) => {
  const { isLeader, deleteCourse, openModal } = useApp();
  const [showFullNote, setShowFullNote] = useState(false);

  // Validate room: mask "Salle à définir", unknown or empty
  const hasValidRoom = Boolean(
    course.room &&
    !/salle\s+[àa]\s+d[ée]finir/i.test(course.room) &&
    !/inconnue/i.test(course.room) &&
    course.room.trim() !== '' &&
    course.room.trim().toLowerCase() !== 'salle'
  );

  // Validate teacher: never display "Professeur" alone, must be real name
  const cleanTeacher = (course.teacher || '')
    .replace(/^(?:Professeur|Enseignant(?:e)?)\s*:\s*/i, '')
    .trim();
  const hasValidTeacher = Boolean(
    cleanTeacher &&
    !/^professeur$/i.test(cleanTeacher) &&
    !/^enseignant$/i.test(cleanTeacher) &&
    cleanTeacher.length > 1
  );

  // Status badge styling
  const getStatusBadge = () => {
    if (!course.statusLabel) return null;
    let badgeBg = 'bg-amber-600';
    if (course.statusType === 'cancelled') badgeBg = 'bg-[#991B1B]';
    else if (course.statusType === 'room_change') badgeBg = 'bg-orange-600';
    else if (course.statusType === 'replacement') badgeBg = 'bg-sky-600';
    else if (course.statusType === 'exam') badgeBg = 'bg-rose-700';
    else if (course.statusType === 'exceptional') badgeBg = 'bg-purple-600';

    return (
      <span
        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full text-white shrink-0 shadow-2xs ${badgeBg}`}
      >
        {course.statusLabel}
      </span>
    );
  };

  // Group tag (e.g. [2-ESP B3]) - No "Tronc commun" badge
  const renderGroupBadge = () => {
    if (course.group) {
      return (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
          {course.group}
        </span>
      );
    }
    // Only show non-Tronc commun category if distinct and meaningful (e.g. Spécialité)
    if (course.category && !/tronc\s+commun/i.test(course.category)) {
      return (
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-slate-800/80 dark:text-slate-300 shrink-0">
          {course.category}
        </span>
      );
    }
    return null;
  };

  // ==========================================
  // COMPACT WEEK VIEW (for 5-column grid)
  // ==========================================
  if (layout === 'week') {
    return (
      <div
        className={`group relative rounded-xl p-2.5 transition-all text-xs border ${
          course.isCancelled
            ? 'bg-rose-50/70 dark:bg-rose-950/25 border-[#991B1B]/30'
            : isCurrent
            ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/30'
            : isNext
            ? 'bg-sky-50/60 dark:bg-sky-950/30 border-[#234E70] ring-1 ring-[#234E70]/30'
            : course.isModified
            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300'
            : 'bg-white dark:bg-[#1A2026] border-slate-200 dark:border-slate-800'
        }`}
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: course.isCancelled ? '#991B1B' : course.color || '#234E70'
        }}
      >
        <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
          <span>{course.startTime} - {course.endTime}</span>
          {isCurrent && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="En cours" />
          )}
          {course.statusLabel && (
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#991B1B] text-white shrink-0 truncate max-w-[80px]">
              {course.statusType === 'cancelled' ? 'Annulé' : course.statusLabel}
            </span>
          )}
        </div>

        <div className="mt-1 font-bold text-slate-900 dark:text-white truncate" title={course.subject}>
          <span className={course.isCancelled ? 'line-through text-[#991B1B]' : ''}>
            {course.subject}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-1 text-[10px] text-slate-500 dark:text-slate-400">
          {hasValidRoom ? (
            <span className="truncate font-medium">{course.room}</span>
          ) : (
            <span className="opacity-0">-</span>
          )}
          {course.group && (
            <span className="font-semibold text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
              {course.group}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // DAY VIEW (Single horizontal line per course)
  // ==========================================
  return (
    <div
      className={`group relative rounded-2xl p-3.5 sm:p-4 transition-all duration-150 border ${
        course.isCancelled
          ? 'bg-rose-50/70 dark:bg-rose-950/25 border-[#991B1B]/30'
          : isCurrent
          ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-xs'
          : isNext
          ? 'bg-sky-50/50 dark:bg-sky-950/30 border-[#234E70]/70 ring-2 ring-[#234E70]/20 shadow-xs'
          : course.isModified
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
          : 'bg-white dark:bg-[#1A2026] border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300'
      }`}
      style={{
        borderLeftWidth: '5px',
        borderLeftColor: course.isCancelled ? '#991B1B' : course.color || '#234E70'
      }}
    >
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Start and End Time (fixed width, neatly aligned) */}
        <div className="shrink-0 w-20 sm:w-24 text-left">
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
            {course.startTime}
            <span className="block text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-400">
              {course.endTime}
            </span>
          </div>

          {/* Current & Next Indicators */}
          {isCurrent && (
            <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1" />
              En cours
            </span>
          )}
          {isNext && (
            <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#234E70] text-white">
              Prochain
            </span>
          )}
        </div>

        {/* Center: Subject, Badges, Room, and Teacher */}
        <div className="flex-1 min-w-0">
          
          {/* Subject Line */}
          <div className="flex items-center flex-wrap gap-1.5">
            <h4
              className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                course.isCancelled
                  ? 'line-through text-[#991B1B] dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {course.subject}
            </h4>

            {/* Status Badges */}
            {getStatusBadge()}

            {/* Group Badge (No Tronc commun badge) */}
            {renderGroupBadge()}
          </div>

          {/* Subline: Room and Teacher in small */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
            {hasValidRoom && (
              <span className="flex items-center truncate">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <span className={course.statusType === 'room_change' ? 'font-bold text-orange-600 dark:text-orange-400' : ''}>
                  {course.room}
                </span>
                {course.originalRoom && (
                  <span className="line-through ml-1 text-slate-400 text-[10px]">
                    ({course.originalRoom})
                  </span>
                )}
              </span>
            )}

            {hasValidTeacher && (
              <span className="flex items-center truncate">
                <User className="w-3.5 h-3.5 mr-1 text-slate-400 shrink-0" />
                <span>{cleanTeacher}</span>
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions and Note toggle */}
        <div className="flex items-center space-x-1 shrink-0">
          {course.delegateNote && (
            <button
              type="button"
              onClick={() => setShowFullNote(!showFullNote)}
              className="p-1.5 rounded-xl text-[#234E70] dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Consulter la note du délégué"
            >
              <StickyNote className="w-4 h-4" />
            </button>
          )}

          {isLeader && (
            <div className="flex items-center space-x-0.5">
              <button
                type="button"
                onClick={() => onEditNote ? onEditNote(course) : openModal('editNote', course)}
                title="Ajouter ou modifier une note"
                className="p-1.5 rounded-xl text-slate-400 hover:text-[#234E70] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onEditCourse ? onEditCourse(course) : openModal('editCourse', course)}
                title="Modifier ce cours"
                className="p-1.5 rounded-xl text-slate-400 hover:text-[#234E70] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Supprimer le cours de ${course.subject} ?`)) {
                    deleteCourse(course.id);
                  }
                }}
                title="Supprimer ce cours"
                className="p-1.5 rounded-xl text-slate-400 hover:text-[#991B1B] hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation banner if reason specified */}
      {course.isCancelled && course.cancelReason && (
        <div className="mt-2 text-xs text-[#991B1B] dark:text-rose-300 font-medium">
          {course.cancelReason}
        </div>
      )}

      {/* Expandable Delegate Note Section */}
      {course.delegateNote && showFullNote && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[#234E70] dark:text-sky-300 font-bold mb-1">
            <span className="flex items-center">
              <StickyNote className="w-3.5 h-3.5 mr-1" />
              Note de {course.delegateNote.authorName} ({course.delegateNote.authorRole})
            </span>
            <span className="text-[10px] text-slate-400">{course.delegateNote.updatedAt}</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {course.delegateNote.text}
          </p>
        </div>
      )}
    </div>
  );
};
