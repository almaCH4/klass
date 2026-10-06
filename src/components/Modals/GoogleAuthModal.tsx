import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { School, Shield, Loader2, AlertCircle } from 'lucide-react';

export const GoogleAuthModal: React.FC = () => {
  const { loginWithGoogle } = useApp();
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; code?: string } | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setErrorDetails(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Erreur Firebase Auth:', err);
      const code = err.code || 'auth/unknown';
      let message = err.message || 'Échec de la connexion avec Google.';

      if (code === 'auth/popup-closed-by-user') {
        message = 'La fenêtre de connexion a été fermée avant la fin de l\'authentification.';
      } else if (code === 'auth/unauthorized-domain') {
        message = 'Ce domaine n\'est pas encore autorisé dans votre console Firebase (Authentication > Paramètres > Domaines autorisés).';
      } else if (code === 'auth/popup-blocked') {
        message = 'La fenêtre contextuelle a été bloquée par votre navigateur. Autorisez les pop-ups pour continuer.';
      }

      setErrorDetails({ message, code });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
            <School className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Klass Lycée
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Espace connecté de classe • Authentification Google sécurisée
          </p>
        </div>

        {errorDetails && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-900 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Erreur d'authentification</p>
              <p>{errorDetails.message}</p>
              {errorDetails.code && (
                <p className="font-mono text-[10px] bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded text-rose-700 dark:text-rose-300 inline-block">
                  Code : {errorDetails.code}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Unique Single Google Login Button */}
        <div className="mt-7 space-y-4">
          <div className="text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
            Connectez-vous avec votre compte Google pour accéder à votre classe :
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={loading}
              className="w-full max-w-[340px] py-3 px-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-extrabold flex items-center justify-center space-x-3 transition-all shadow-md active:scale-95 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Se connecter avec Google</span>
                </>
              )}
            </button>
          </div>

          {/* RGPD & Security */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1 text-center">
            <div className="flex items-center justify-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Authentification officielle Firebase Google • Données chiffrées</span>
            </div>
            <p>Conforme aux règles de confidentialité RGPD pour les établissements scolaires.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
