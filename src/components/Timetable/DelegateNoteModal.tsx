import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { X, StickyNote, Sparkles } from 'lucide-react';

export const DelegateNoteModal: React.FC = () => {
  const { modalData, updateDelegateNote, closeModal } = useApp();
  const course: Course = modalData;

  const [noteText, setNoteText] = useState(course?.delegateNote?.text || '');

  if (!course) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDelegateNote(course.id, noteText);
    closeModal();
  };

  const PRESETS = [
    '📌 Apporter calculatrice graphique et règle',
    '📖 Livre de cours page ... à ramener',
    '📥 Devoir maison à rendre au début du cours',
    '⚠️ Contrôle flash / interrogations annoncées',
    '👟 Tenue de sport complète obligatoire'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <StickyNote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Note du délégué
              </h3>
              <p className="text-xs text-slate-500">
                {course.subject} ({course.startTime} - {course.endTime})
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
              Consigne ou rappel visible par tous les élèves :
            </label>
            <textarea
              required
              rows={4}
              placeholder="Ex: Pensez à apporter le polycopié n°3 et les feutres pour le schéma..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full p-3 rounded-2xl bg-blue-50/30 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-blue-500" />
              Suggestions rapides :
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNoteText(p)}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 text-[11px] text-slate-600 dark:text-slate-300 text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            {course.delegateNote && (
              <button
                type="button"
                onClick={() => {
                  updateDelegateNote(course.id, '');
                  closeModal();
                }}
                className="text-xs font-semibold text-rose-500 hover:underline"
              >
                Supprimer la note
              </button>
            )}

            <div className="flex space-x-2 ml-auto">
              <button
                type="button"
                onClick={closeModal}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
              >
                Enregistrer la note
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
