import React from 'react';
import { PersonalEvent } from '../../types';
import { useApp } from '../../context/AppContext';
import { Lock, Clock, Bell, Trash2, Edit2 } from 'lucide-react';

interface PersonalEventCardProps {
  event: PersonalEvent;
  onEdit?: (event: PersonalEvent) => void;
}

export const PersonalEventCard: React.FC<PersonalEventCardProps> = ({ event, onEdit }) => {
  const { deletePersonalEvent, openModal } = useApp();

  const getReminderLabel = (rem: string) => {
    switch (rem) {
      case '15min': return 'Rappel 15 min';
      case '1h': return 'Rappel 1h';
      case '1day': return 'Rappel 24h';
      default: return null;
    }
  };

  const reminderLabel = getReminderLabel(event.reminder);

  return (
    <div
      className="group relative rounded-2xl p-3.5 bg-gradient-to-br from-indigo-50/50 to-purple-50/40 dark:from-indigo-950/20 dark:to-purple-950/20 border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 transition-all hover:shadow-sm"
      style={{
        borderLeftWidth: '5px',
        borderLeftStyle: 'solid',
        borderLeftColor: event.color || '#6366f1'
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-1.5">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300"
              title="Cet événement est 100% privé, vous seul(e) pouvez le voir"
            >
              <Lock className="w-2.5 h-2.5 mr-1" />
              Événement privé
            </span>
            {reminderLabel && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                <Bell className="w-2.5 h-2.5 mr-0.5" />
                {reminderLabel}
              </span>
            )}
          </div>

          <h5 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
            {event.title}
          </h5>

          <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-1 space-x-2">
            <span className="flex items-center font-medium">
              <Clock className="w-3 h-3 mr-1 text-slate-400" />
              {event.startTime} - {event.endTime}
            </span>
          </div>

          {event.notes && (
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 italic">
              {event.notes}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit ? onEdit(event) : openModal('personalEvent', event)}
            className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800"
            title="Modifier"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => deletePersonalEvent(event.id)}
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
