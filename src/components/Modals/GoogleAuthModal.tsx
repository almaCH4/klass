import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { School, Shield, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
    __googleGisInitialized?: boolean;
  }
}

// Exact Google OAuth Client ID provided by user
const EXACT_GOOGLE_CLIENT_ID = '109916380019-l7j3slhmc8glrnrh8kojucoj9dog6i2n.apps.googleusercontent.com';

// Global callback dispatcher so initialize() only needs to be called once in the window lifecycle
let globalLoginHandler: ((credential: string) => Promise<void>) | null = null;

export const GoogleAuthModal: React.FC = () => {
  const { loginWithGoogle } = useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gisStatus, setGisStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);

  // Dedicated detached DOM mount point for Google GSI (keeps React DOM separate to avoid NotFoundError)
  const googleSlotRef = useRef<HTMLDivElement>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || EXACT_GOOGLE_CLIENT_ID;

  const handleDirectPopupLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Fenêtre de connexion fermée. Veuillez réessayer.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('Ce domaine n\'est pas encore autorisé dans votre console Firebase (Authentication > Paramètres > Domaines autorisés).');
      } else {
        setError(err.message || 'Échec de la connexion Google Firebase.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Keep globalLoginHandler pointing to the current component instance
  useEffect(() => {
    globalLoginHandler = async (credential: string) => {
      setLoading(true);
      setError(null);
      try {
        await loginWithGoogle(credential);
      } catch (err: any) {
        setError(err.message || 'Échec de la validation de votre compte Google.');
      } finally {
        setLoading(false);
      }
    };

    return () => {
      globalLoginHandler = null;
    };
  }, [loginWithGoogle]);

  useEffect(() => {
    let timeout: any = null;
    let isDisposed = false;

    // Timeout: if Google button is not rendered within 3.5 seconds, show error message
    timeout = setTimeout(() => {
      if (!isDisposed && gisStatus === 'loading') {
        setGisStatus('error');
      }
    }, 3500);

    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id || !googleSlotRef.current || isDisposed) {
        return;
      }

      try {
        // Execute google.accounts.id.initialize strictly once
        if (!window.__googleGisInitialized) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response.credential && globalLoginHandler) {
                await globalLoginHandler(response.credential);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true
          });
          window.__googleGisInitialized = true;
        }

        // Clean mount into dedicated slot without React reconciliation conflict
        const slot = googleSlotRef.current;
        slot.innerHTML = '';
        const btnContainer = document.createElement('div');
        slot.appendChild(btnContainer);

        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: 320,
          locale: 'fr'
        });

        setGisStatus('ready');

        // Optional One-Tap prompt
        try {
          window.google.accounts.id.prompt();
        } catch {
          // ignore prompt failures
        }
      } catch (err: any) {
        console.error('Google GSI initialization error:', err);
        setGisStatus('error');
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogleSignIn();
        }
      }, 200);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
        isDisposed = true;
      };
    }

    return () => {
      clearTimeout(timeout);
      isDisposed = true;
    };
  }, [googleClientId, loginWithGoogle, retryCount]);

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
            Espace connecté de classe • Authentification Google officielle
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Erreur d'authentification</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Google Official Login Section */}
        <div className="mt-7 space-y-4">
          
          <div className="text-center text-xs text-slate-600 dark:text-slate-300 font-medium">
            Seule la connexion sécurisée par compte Google certifié est autorisée :
          </div>

          {/* Mount slot strictly untouched by React children */}
          <div className="flex flex-col items-center justify-center space-y-3 my-2">
            <div ref={googleSlotRef} className="flex justify-center" />

            <div className="flex items-center space-x-2 w-full max-w-[320px]">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">ou</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            </div>

            <button
              type="button"
              onClick={handleDirectPopupLogin}
              disabled={loading}
              className="w-full max-w-[320px] py-2.5 px-4 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Ouvrir la fenêtre Google (Firebase)</span>
            </button>
          </div>

          {/* Loading state indicator */}
          {gisStatus === 'loading' && !loading && (
            <div className="flex items-center justify-center space-x-2 text-xs text-slate-400 py-1">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Chargement du bouton officiel Google...</span>
            </div>
          )}

          {/* Token verification state */}
          {loading && (
            <div className="flex items-center justify-center space-x-2 text-xs text-blue-600 font-semibold py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authentification Firebase en cours...</span>
            </div>
          )}

          {/* Clear error message if Google button cannot be rendered */}
          {gisStatus === 'error' && !loading && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center space-y-3 animate-in fade-in">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  Le service de connexion Google n'a pas pu être chargé
                </p>
                <p className="text-[11px] text-slate-500">
                  Votre ID Client Google (<code>109916380019-...</code>) est peut-être en cours de propagation sur les serveurs Google, ou les origines JavaScript autorisées doivent être validées dans votre Google Cloud Console.
                </p>
                <p className="text-[11px] font-semibold text-blue-600 pt-1">
                  Veuillez patienter quelques instants et réessayer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGisStatus('loading');
                  setRetryCount(c => c + 1);
                }}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Réessayer la connexion</span>
              </button>
            </div>
          )}

          {/* Information on Roles */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1.5">
            <p className="flex items-start">
              <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">•</span>
              <span><strong>Création d'espace :</strong> le premier compte Google vérifié qui crée la classe devient automatiquement <strong>Délégué(e) titulaire</strong> (avec l'anneau bleu).</span>
            </p>
            <p className="flex items-start">
              <span className="font-bold text-blue-600 dark:text-blue-400 mr-1.5">•</span>
              <span><strong>Élèves :</strong> rejoignent avec leur compte Google via l'invitation transmise par le délégué.</span>
            </p>
          </div>

          {/* RGPD Guarantee */}
          <div className="pt-1 text-center text-[10px] text-slate-400 flex items-center justify-center space-x-1">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span>Firebase Authentication • Fournisseur Google direct • RGPD conforme</span>
          </div>

        </div>

      </div>
    </div>
  );
};
