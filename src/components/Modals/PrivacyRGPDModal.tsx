import React from 'react';
import { useApp } from '../../context/AppContext';
import { Shield, Download, Trash2, CheckCircle2, Lock, X } from 'lucide-react';

export const PrivacyRGPDModal: React.FC = () => {
  const { exportUserData, deleteAccount, closeModal } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Politique de confidentialité & RGPD
              </h3>
              <p className="text-xs text-slate-400">
                Protection renforcée des élèves et lycéens mineurs
              </p>
            </div>
          </div>
          <button type="button" onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
              Principes fondamentaux de l'application Klass
            </h4>
            <p className="text-[11px] text-slate-500">
              L'application a été conçue par et pour des lycéens dans le respect strict du Règlement Général sur la Protection des Données (RGPD 2016/679) et de la loi Informatique et Libertés.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Minimisation stricte des données :</strong> Seuls le nom, prénom et email scolaire sont traités. Aucune donnée sensible (santé, géolocalisation, opinions) n'est requise.
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Cloisonnement étanche des classes :</strong> Les élèves d'une classe ne peuvent en aucun cas accéder aux données, cours ou devoirs d'une autre classe.
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Bloc-notes et événements 100% privés :</strong> Vos notes personnelles et vos événements privés sont chiffrés et inaccessibles même aux délégués ou aux administrateurs.
              </div>
            </div>

            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 dark:text-white">Zéro pistage publicitaire :</strong> Aucun traceur, aucun cookie tiers, aucune revente de données.
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2">
              Exercer vos droits (Articles 15 à 21 du RGPD)
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={exportUserData}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-900 flex items-center justify-center space-x-1.5 hover:bg-blue-100"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger mes données (Droit à la portabilité)</span>
              </button>

              <button
                type="button"
                onClick={deleteAccount}
                className="py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900 flex items-center justify-center space-x-1.5 hover:bg-red-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Droit à l'oubli (Supprimer mon compte)</span>
              </button>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-400">
            <strong>Mentions Légales :</strong> Klass App • Hébergement Cloud européen certifié RGPD/ISO 27001 • Contact délégués via l'onglet Messagerie.
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
