import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  RefreshCw,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  PlusCircle,
  X
} from 'lucide-react';

export const PronoteSyncModal: React.FC = () => {
  const {
    currentClass,
    isLeader,
    syncPronoteIcal,
    importIcsData,
    openModal,
    closeModal
  } = useApp();

  const [icalUrl, setIcalUrl] = useState(currentClass?.pronoteIcalUrl || '');
  const [showFullUrl, setShowFullUrl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icalUrl.trim()) return;

    setIsSyncing(true);
    setFeedback(null);
    try {
      const ok = await syncPronoteIcal(icalUrl);
      if (ok) {
        setFeedback({
          type: 'success',
          text: `Synchronisation réussie ! Les cours, salles et annulations de la classe sont à jour.`
        });
      } else {
        setFeedback({
          type: 'error',
          text: 'Erreur lors de la lecture du flux iCal. Vérifiez le format du lien.'
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Impossible de contacter le serveur Pronote.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const result = await importIcsData(content);
          if (result.count > 0) {
            setFeedback({
              type: 'success',
              text: `${result.count} cours ont été importés avec succès depuis le fichier .ics !`
            });
          } else {
            setFeedback({
              type: 'error',
              text: 'Aucun cours valide trouvé dans ce fichier iCalendar.'
            });
          }
        } catch {
          setFeedback({
            type: 'error',
            text: 'Erreur lors du traitement du fichier .ics.'
          });
        }
      }
    };
    reader.readAsText(file);
  };

  const maskedUrl = icalUrl
    ? icalUrl.slice(0, 20) + '••••••••••••••••••••' + icalUrl.slice(-8)
    : 'Aucun lien configuré';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Synchronisation Pronote (iCal)
              </h3>
              <p className="text-xs text-slate-500">
                Abonnement automatique & import sécurisé
              </p>
            </div>
          </div>
          <button type="button" onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Status banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start space-x-3 text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Statut de la synchronisation</p>
              <p className="mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                Dernière synchro réussie : <span className="font-bold">{currentClass?.pronoteLastSynced || 'Jamais'}</span>.
                Le serveur relit le flux automatiquement pour détecter les cours annulés et les changements de salle.
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center justify-between ${
                feedback.type === 'success'
                  ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
              }`}
            >
              <span>{feedback.text}</span>
              <button type="button" onClick={() => setFeedback(null)} className="ml-2 font-bold">×</button>
            </div>
          )}

          {/* Form for leader */}
          {isLeader ? (
            <form onSubmit={handleSaveAndSync} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Lien d'abonnement iCal Pronote (Délégué uniquement)</span>
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <Lock className="w-2.5 h-2.5 mr-0.5 text-blue-500" />
                    Chiffré & Masqué aux élèves
                  </span>
                </label>

                <div className="relative">
                  <input
                    type={showFullUrl ? 'text' : 'password'}
                    placeholder="webcal://pronote.ac-paris.fr/ical/... ou https://..."
                    value={icalUrl}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFullUrl(!showFullUrl)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showFullUrl ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <p className="mt-1 text-[11px] text-slate-500">
                  Comment l'obtenir dans Pronote : Onglet <em>Emploi du temps</em> &gt; bouton <em>Paramètres / Icône Calendrier</em> &gt; <em>S'abonner au calendrier iCal</em>.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="submit"
                  disabled={isSyncing}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors flex items-center justify-center space-x-2 shadow-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Synchronisation en cours...' : 'Synchroniser maintenant'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <p className="font-semibold">Lien géré par les délégués</p>
              <p className="text-[11px] mt-0.5 text-slate-500">
                Le flux iCal est configuré de manière chiffrée par les délégués titulaires pour toute la classe.
              </p>
            </div>
          )}

          {/* Alternative Methods */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
              Méthodes de secours
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              
              {/* Import ICS file */}
              <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
                <Upload className="w-5 h-5 text-blue-500 mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200">Importer un fichier .ics</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Glissez ou sélectionnez un fichier exporté</span>
                <input type="file" accept=".ics,text/calendar" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Manual Course Add */}
              {isLeader && (
                <button
                  type="button"
                  onClick={() => {
                    closeModal();
                    openModal('editCourse');
                  }}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex flex-col items-center justify-center text-center transition-colors"
                >
                  <PlusCircle className="w-5 h-5 text-indigo-500 mb-1" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Saisie manuelle</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Ajouter un créneau manuellement</span>
                </button>
              )}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              <strong>Sécurité garantie :</strong> Aucun identifiant ni mot de passe Pronote n'est requis ni stocké. Seul le flux calendrier standardisé en lecture seule est utilisé.
            </p>
          </div>

        </div>

        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
