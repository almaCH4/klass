import React from 'react';
import { useApp } from '../../context/AppContext';
import { KeyRound, ExternalLink, ShieldCheck, CheckCircle2, X } from 'lucide-react';

export const PasswordGoogleModal: React.FC = () => {
  const { currentUser, closeModal } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
        
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Réglages du mot de passe
            </h3>
          </div>
          <button type="button" onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200">
            <p className="font-bold flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1.5 text-blue-600 dark:text-blue-400" />
              Authentification sécurisée par Google
            </p>
            <p className="mt-1 text-[11px] text-blue-800 dark:text-blue-300">
              Votre compte Klass est directement rattaché à votre adresse <strong>{currentUser?.email}</strong> via le protocole Google Identity.
            </p>
          </div>

          <p>
            Pour garantir la sécurité absolue de vos données et éviter tout vol d'identifiant, <strong>aucun mot de passe n'est stocké sur l'application Klass</strong>.
          </p>

          <p>
            Si vous souhaitez modifier votre mot de passe, activer la double-authentification (2FA) ou consulter vos appareils connectés, cela s'effectue directement sur le tableau de bord de sécurité de votre compte Google :
          </p>

          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-colors"
          >
            <span>Accéder à la sécurité de mon compte Google</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <div className="pt-2 text-[11px] text-slate-400 space-y-1">
            <p className="flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500 shrink-0" />
              Protection contre le hameçonnage (anti-phishing)
            </p>
            <p className="flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500 shrink-0" />
              Zéro mot de passe en clair dans la base de données
            </p>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
          >
            Compris
          </button>
        </div>

      </div>
    </div>
  );
};
