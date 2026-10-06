import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { firestoreService } from '../../services/firestoreService';
import {
  Calendar,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
  Clock,
  ExternalLink,
  X
} from 'lucide-react';

export const PronoteSyncModal: React.FC = () => {
  const {
    currentClass,
    currentUser,
    isLeader,
    syncPronoteIcal,
    closeModal
  } = useApp();

  const [icalUrl, setIcalUrl] = useState('');
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Charger le lien iCal enregistré dans classes/{classId}/settings/pronote (réservé aux délégués)
  useEffect(() => {
    if (!currentClass?.id || !isLeader) return;

    let isMounted = true;
    setIsLoadingSettings(true);

    firestoreService
      .getPronoteSettings(currentClass.id)
      .then((settings) => {
        if (!isMounted) return;
        if (settings?.icalUrl) {
          setIcalUrl(settings.icalUrl);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement lien Pronote délégué:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingSettings(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentClass?.id, isLeader]);

  // Sauvegarder le lien iCal UNIQUEMENT dans classes/{classId}/settings/pronote (protégé des élèves)
  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass?.id || !currentUser) return;

    const trimmedUrl = icalUrl.trim();
    if (!trimmedUrl) {
      setFeedback({ type: 'error', text: 'Veuillez saisir une URL iCal valide.' });
      return;
    }

    let isAllowedDomain = false;
    try {
      const parsedUrl = new URL(trimmedUrl);
      const host = parsedUrl.hostname.toLowerCase();
      isAllowedDomain = parsedUrl.protocol === 'https:' && (host === 'index-education.net' || host.endsWith('.index-education.net'));
    } catch {
      isAllowedDomain = false;
    }

    if (!isAllowedDomain) {
      setFeedback({
        type: 'error',
        text: 'L\'URL doit obligatoirement être en https:// et provenir du domaine index-education.net.'
      });
      return;
    }

    setIsSavingUrl(true);
    setFeedback(null);

    try {
      // 1. Enregistre uniquement dans classes/{classId}/settings/pronote
      await firestoreService.savePronoteSettings(currentClass.id, trimmedUrl, currentUser.name);
      // 2. Efface tout champ pronoteIcalUrl existant dans le document de classe
      await firestoreService.clearClassPronoteIcalUrl(currentClass.id);

      setFeedback({
        type: 'success',
        text: 'Lien d\'abonnement iCal enregistré dans les paramètres privés des délégués. Le champ public a été effacé.'
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Impossible d\'enregistrer le lien dans Firestore.'
      });
    } finally {
      setIsSavingUrl(false);
    }
  };

  // Déclencher la synchronisation immédiate
  const handleSyncNow = async () => {
    if (!currentClass?.id) return;
    setIsSyncing(true);
    setFeedback(null);

    try {
      const res = await syncPronoteIcal(icalUrl.trim() || undefined);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: res.message
        });
      } else {
        setFeedback({
          type: 'error',
          text: res.message
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err.message || 'Erreur lors de la synchronisation avec Pronote.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/60 dark:text-sky-400 font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Synchronisation Pronote
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Abonnement automatique de la classe (toutes les 15 min)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center justify-between border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
              }`}
            >
              <span>{feedback.text}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="ml-2 font-bold hover:opacity-75"
              >
                ×
              </button>
            </div>
          )}

          {/* Espace réservé aux délégués */}
          {isLeader ? (
            <div className="space-y-4">
              
              {/* 1. Configuration du lien iCal */}
              <form onSubmit={handleSaveUrl} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-[#234E70] dark:text-sky-400" />
                    <span>Lien d'abonnement iCal Pronote (URL unique)</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Délégués uniquement
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Collez ici le lien iCal exporté depuis l'interface Pronote de votre établissement (une seule fois pour toute la classe).
                </p>

                <div className="space-y-2">
                  <input
                    type="url"
                    required
                    placeholder="https://...index-education.net/pronote/ical/..."
                    value={icalUrl}
                    disabled={isLoadingSettings}
                    onChange={(e) => setIcalUrl(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70] font-mono"
                  />

                  <div className="flex items-center space-x-2">
                    <button
                      type="submit"
                      disabled={isSavingUrl || isLoadingSettings}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold transition-all flex items-center justify-center space-x-1.5 disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSavingUrl ? 'Enregistrement...' : 'Enregistrer le lien pour la classe'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncNow}
                      disabled={isSyncing || !icalUrl.trim()}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#234E70] hover:bg-[#1b3e59] text-white font-bold transition-all flex items-center justify-center space-x-1.5 shadow-xs active:scale-95 disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-start space-x-2 pt-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    Ce lien est enregistré dans le document privé <code>classes/{currentClass?.id}/settings/pronote</code>, inaccessible aux élèves (règles Firestore).
                  </span>
                </div>
              </form>

              {/* 2. Journal de synchronisation & Erreurs */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Journal de synchronisation serveur</span>
                </h4>

                {currentClass?.pronoteSyncStatus === 'error' ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1.5">
                    <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-200 font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Échec de la dernière tentative automatique</span>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 font-mono bg-white/70 dark:bg-black/30 p-2 rounded-xl">
                      {currentClass.pronoteSyncError || 'Erreur de connexion avec le serveur Pronote'}
                    </p>
                    {currentClass.pronoteLastSyncAttempt && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400">
                        Tentative à : {currentClass.pronoteLastSyncAttempt}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start space-x-2.5 text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Synchronisation automatique active (toutes les 15 min)</p>
                      <p className="mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-300">
                        Dernière mise à jour réussie : <span className="font-bold">{currentClass?.pronoteLastSynced || 'Récemment'}</span>.
                        La tâche planifiée Cloudflare Cron lit le lien toutes les 15 minutes et actualise l'emploi du temps de toute la classe.
                      </p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            /* Espace Élèves : Information claire, aucune action requise */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">Emploi du temps synchronisé automatiquement</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    Dernière synchronisation : <strong className="font-semibold">{currentClass?.pronoteLastSynced || 'À jour'}</strong>.
                    Le serveur de la classe relit automatiquement Pronote toutes les 15 minutes.
                  </p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                    💡 Vous n'avez aucune action d'import à faire : cliquez simplement sur le bouton <strong>↻ Actualiser</strong> sur la page pour recharger les dernières données.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Information Cloudflare Cron & Sécurité */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Tâche automatique Cloudflare Cron Trigger</span>
            </p>
            <p>
              Toutes les 15 minutes, le Worker Cloudflare sécurisé récupère le calendrier, analyse les cours et devoirs, et met à jour Firestore avec les secrets d'écriture serveur, sans aucun identifiant visible dans le code ou sur GitHub.
            </p>
          </div>

        </div>

        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
