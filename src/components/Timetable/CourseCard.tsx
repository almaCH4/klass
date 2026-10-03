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
  Sparkles
} from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onEditNote?: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onEditNote, onEditCourse }) => {
  const { isLeader, deleteCourse, openModal } = useApp();
  const [showFullNote, setShowFullNote] = useState(false);

  return (
    <div
      className={`group relative rounded-2xl p-4 transition-all duration-200 border ${
        course.isCancelled
          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 opacity-80'
          : course.isModified
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
          : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700/80 hover:shadow-md'
      }`}
      style={{
        borderLeftWidth: '6px',
        borderLeftColor: course.isCancelled ? '#f43f5e' : course.color || '#3b82f6'
      }}
    >
      {/* Top row: Subject, Time, and Status Badges */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center flex-wrap gap-1.5">
            <h4
              className={`text-base font-bold tracking-tight ${
                course.isCancelled
                  ? 'line-through text-rose-900 dark:text-rose-300'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {course.subject}
            </h4>

            {course.category && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {course.category}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {course.startTime} - {course.endTime}
            </span>
            <span className="flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span className={course.isModified ? 'font-bold text-amber-600 dark:text-amber-400' : ''}>
                {course.room}
              </span>
              {course.originalRoom && (
                <span className="line-through ml-1 text-slate-400 text-[10px]">
                  ({course.originalRoom})
                </span>
              )}
            </span>
            <span className="hidden sm:flex items-center">
              <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {course.teacher}
            </span>
          </div>
        </div>

        {/* Action icons for delegates */}
        {isLeader && (
          <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center space-x-1">
            <button
              type="button"
              onClick={() => onEditCourse ? onEditCourse(course) : openModal('editCourse', course)}
              title="Modifier ce cours"
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700"
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Banner */}
      {course.isCancelled && (
        <div className="mt-2 p-2.5 rounded-xl bg-rose-100/90 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Cours annulé</p>
            <p className="mt-0.5 text-rose-700 dark:text-rose-300">
              {course.cancelReason || 'Professeur absent. Heure de permanence ou libération.'}
            </p>
          </div>
        </div>
      )}

      {/* Modification Banner */}
      {course.isModified && !course.isCancelled && (
        <div className="mt-2 p-2 rounded-xl bg-amber-100/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Horaire ou salle réaménagé(e)</p>
            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
              {course.modifiedReason || `Déplacé en salle ${course.room}`}
            </p>
          </div>
        </div>
      )}

      {/* Delegate Note Section */}
      {course.delegateNote ? (
        <div className="mt-3 p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-300">
              <StickyNote className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
              Note de {course.delegateNote.authorName} ({course.delegateNote.authorRole})
            </span>
            <span className="text-[10px] text-slate-400">
              {course.delegateNote.updatedAt}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
            {course.delegateNote.text}
          </p>

          {isLeader && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onEditNote ? onEditNote(course) : openModal('editNote', course)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Modifier la consigne
              </button>
            </div>
          )}
        </div>
      ) : (
        isLeader && (
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
            <button
              type="button"
              onClick={() => onEditNote ? onEditNote(course) : openModal('editNote', course)}
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 flex items-center font-medium transition-colors"
            >
              <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
              + Ajouter une note du délégué pour la classe
            </button>
          </div>
        )
      )}
    </div>
  );
};
