import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { ChatMessage } from '../../types';

interface ReportModalProps {
  isOpen: boolean;
  message: ChatMessage | null;
  onClose: () => void;
  onSubmitReport: (messageId: string, reason: string) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  message,
  onClose,
  onSubmitReport
}) => {
  const [reason, setReason] = useState('Contenu inapproprié ou irrespectueux');
  const [customDetails, setCustomDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !message) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fullReason = customDetails.trim() ? `${reason} : ${customDetails.trim()}` : reason;
    await onSubmitReport(message.id, fullReason);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-[#991B1B] dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Signaler ce message
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message preview snippet */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
          <p className="font-bold text-slate-900 dark:text-white mb-0.5">{message.senderName} :</p>
          <p className="line-clamp-2 italic">« {message.text} »</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Motif du signalement
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
            >
              <option value="Contenu inapproprié ou irrespectueux">Contenu inapproprié ou irrespectueux</option>
              <option value="Insulte ou comportement toxique">Insulte ou comportement toxique</option>
              <option value="Spam ou pollution du groupe">Spam ou pollution du groupe</option>
              <option value="Autre motif">Autre motif</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Détails complémentaires (optionnel)
            </label>
            <textarea
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              rows={2}
              placeholder="Précisez si besoin pour les délégués..."
              maxLength={200}
              className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            Ce signalement sera transmis directement aux délégués de la classe pour modération.
          </p>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold bg-[#991B1B] hover:bg-rose-800 text-white rounded-xl shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? 'Envoi...' : 'Envoyer le signalement'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
