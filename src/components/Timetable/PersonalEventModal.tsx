import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PersonalEvent } from '../../types';
import { X, Lock, Bell, Clock, Calendar, Palette } from 'lucide-react';

export const PersonalEventModal: React.FC = () => {
  const { modalData, addPersonalEvent, updatePersonalEvent, closeModal } = useApp();
  const existingEvent: PersonalEvent | undefined = modalData?.id ? modalData : undefined;

  const [title, setTitle] = useState(existingEvent?.title || '');
  const [date, setDate] = useState(existingEvent?.date || modalData?.date || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(existingEvent?.startTime || '14:00');
  const [endTime, setEndTime] = useState(existingEvent?.endTime || '15:00');
  const [color, setColor] = useState(existingEvent?.color || '#6366f1');
  const [reminder, setReminder] = useState(existingEvent?.reminder || 'none');
  const [notes, setNotes] = useState(existingEvent?.notes || '');

  const COLORS = [
    { label: 'Indigo', hex: '#6366f1' },
    { label: 'Émeraude', hex: '#10b981' },
    { label: 'Ambre', hex: '#f59e0b' },
    { label: 'Rose', hex: '#ec4899' },
    { label: 'Cyan', hex: '#06b6d4' },
    { label: 'Violet', hex: '#8b5cf6' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (existingEvent) {
      updatePersonalEvent(existingEvent.id, {
        title,
        date,
        startTime,
        endTime,
        color,
        reminder,
        notes
      });
    } else {
      addPersonalEvent({
        title,
        date,
        startTime,
        endTime,
        color,
        reminder,
        notes
      });
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {existingEvent ? 'Modifier l\'événement personnel' : 'Ajouter un événement personnel'}
              </h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                🔒 Strictement privé (vous seul pouvez le voir)
              </p>
            </div>
          </div>
          <button type="button" onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Titre de l'événement *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Dentiste, Révision Bac blanc avec Hugo, Tennis..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rappel notification
              </label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="none">Aucun rappel</option>
                <option value="15min">15 minutes avant</option>
                <option value="1h">1 heure avant</option>
                <option value="1day">La veille (24h avant)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pastille couleur
              </label>
              <div className="flex items-center space-x-1.5 pt-1">
                {COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === c.hex ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Notes privées (optionnel)
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Emporter carte vitale, réviser chapitres 3 et 4..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-colors"
            >
              {existingEvent ? 'Mettre à jour' : 'Ajouter à mon agenda'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
