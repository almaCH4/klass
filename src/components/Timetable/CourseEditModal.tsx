import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { getSubjectColor } from '../../services/icalParser';
import { X, Calendar, Clock, MapPin, User, AlertTriangle, Info, Palette } from 'lucide-react';

export const CourseEditModal: React.FC = () => {
  const { modalData, addCourse, updateCourse, closeModal } = useApp();
  const existingCourse: Course | undefined = modalData?.id ? modalData : undefined;

  const [subject, setSubject] = useState(existingCourse?.subject || '');
  const [category, setCategory] = useState(existingCourse?.category || 'Tronc commun');
  const [teacher, setTeacher] = useState(existingCourse?.teacher || '');
  const [room, setRoom] = useState(existingCourse?.room || '');
  const [dayOfWeek, setDayOfWeek] = useState<number>(existingCourse?.dayOfWeek || modalData?.dayOfWeek || 1);
  const [startTime, setStartTime] = useState(existingCourse?.startTime || '08:00');
  const [endTime, setEndTime] = useState(existingCourse?.endTime || '10:00');
  const [color, setColor] = useState(existingCourse?.color || getSubjectColor(existingCourse?.subject || 'maths'));
  
  const [isCancelled, setIsCancelled] = useState(existingCourse?.isCancelled || false);
  const [cancelReason, setCancelReason] = useState(existingCourse?.cancelReason || '');
  const [isModified, setIsModified] = useState(existingCourse?.isModified || false);
  const [modifiedReason, setModifiedReason] = useState(existingCourse?.modifiedReason || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    if (existingCourse) {
      updateCourse(existingCourse.id, {
        subject,
        category,
        teacher,
        room,
        dayOfWeek,
        startTime,
        endTime,
        color,
        isCancelled,
        cancelReason: isCancelled ? cancelReason || 'Professeur absent' : undefined,
        isModified,
        modifiedReason: isModified ? modifiedReason || 'Horaire ou salle modifiée' : undefined
      });
    } else {
      addCourse({
        subject,
        category,
        teacher,
        room,
        dayOfWeek,
        startTime,
        endTime,
        color: color || getSubjectColor(subject),
        isCancelled,
        cancelReason: isCancelled ? cancelReason : undefined,
        isModified,
        modifiedReason: isModified ? modifiedReason : undefined
      });
    }
    closeModal();
  };

  const handleSubjectChange = (val: string) => {
    setSubject(val);
    if (!existingCourse) {
      setColor(getSubjectColor(val));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {existingCourse ? 'Modifier le cours' : 'Ajouter un cours (Saisie de secours)'}
          </h3>
          <button
            type="button"
            onClick={closeModal}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Matière *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Mathématiques, Philosophie..."
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Catégorie / Groupe
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tronc commun">Tronc commun</option>
                <option value="Spécialité">Spécialité</option>
                <option value="Spé Maths">Spé Maths</option>
                <option value="Spé SVT">Spé SVT</option>
                <option value="Spé NSI">Spé NSI</option>
                <option value="Option LV2">Option LV2</option>
                <option value="Option HGGSP">Option HGGSP</option>
                <option value="Vie de classe">Vie de classe</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Jour de la semaine
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Lundi</option>
                <option value={2}>Mardi</option>
                <option value={3}>Mercredi</option>
                <option value={4}>Jeudi</option>
                <option value={5}>Vendredi</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Heure début
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Heure fin
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Salle
              </label>
              <input
                type="text"
                placeholder="Ex: Salle 204"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Professeur
              </label>
              <input
                type="text"
                placeholder="Ex: Mme Lambert"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Cancellation section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-rose-600 dark:text-rose-400">
              <input
                type="checkbox"
                checked={isCancelled}
                onChange={(e) => setIsCancelled(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              <span className="flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                Déclarer ce cours comme annulé
              </span>
            </label>

            {isCancelled && (
              <input
                type="text"
                placeholder="Motif (ex: Professeur absent, formation...)"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            )}
          </div>

          {/* Modification section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <label className="flex items-center space-x-2 cursor-pointer font-bold text-amber-600 dark:text-amber-400">
              <input
                type="checkbox"
                checked={isModified}
                onChange={(e) => setIsModified(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="flex items-center">
                <Info className="w-3.5 h-3.5 mr-1" />
                Déclarer un aménagement ou changement de salle
              </span>
            </label>

            {isModified && (
              <input
                type="text"
                placeholder="Explication (ex: Salle changée en Salle Info 2)"
                value={modifiedReason}
                onChange={(e) => setModifiedReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
              {existingCourse ? 'Mettre à jour' : 'Enregistrer le cours'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
