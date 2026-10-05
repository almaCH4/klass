import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { firestoreService } from '../../services/firestoreService';
import { ClassInvitation } from '../../types';
import {
  School,
  UserPlus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Loader2,
  Lock
} from 'lucide-react';

export const ClassCreationJoinModal: React.FC = () => {
  const { createClass, joinClassWithInvite, currentUser, logout } = useApp();

  // Check URL or session storage for ?invite=
  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const param = new URLSearchParams(window.location.search).get('invite');
      if (param) {
        sessionStorage.setItem('klass_pending_invite', param);
        return param;
      }
      return sessionStorage.getItem('klass_pending_invite');
    }
    return null;
  });

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>(inviteToken ? 'join' : 'choose');
  const [manualToken, setManualToken] = useState('');
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // States for invite verification
  const [isVerifyingInvite, setIsVerifyingInvite] = useState(false);
  const [inviteData, setInviteData] = useState<{
    invitation: ClassInvitation;
    className: string;
    classId: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Fetch invitation details if token is present
  useEffect(() => {
    if (!inviteToken) return;

    let isMounted = true;
    setIsVerifyingInvite(true);
    setInviteError(null);

    firestoreService
      .getInvitationDetails(inviteToken)
      .then((data) => {
        if (!isMounted) return;
        setInviteData(data);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setInviteError(err.message || 'Invitation introuvable ou expirée.');
      })
      .finally(() => {
        if (isMounted) setIsVerifyingInvite(false);
      });

    return () => {
      isMounted = false;
    };
  }, [inviteToken]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !schoolName.trim()) return;
    await createClass(className.trim(), schoolName.trim());
  };

  const handleManualJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    setIsJoining(true);
    const res = await joinClassWithInvite(manualToken.trim());
    setIsJoining(false);

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      sessionStorage.removeItem('klass_pending_invite');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleConfirmDirectInvite = async () => {
    if (!inviteToken) return;

    setIsJoining(true);
    const res = await joinClassWithInvite(inviteToken);
    setIsJoining(false);

    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      sessionStorage.removeItem('klass_pending_invite');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  // =========================================================================
  // SCENARIO 1 : AVEC LIEN D'INVITATION (?invite=...)
  // Affiche uniquement "Rejoindre la classe [nom] en tant qu'[élève ou suppléant]"
  // Le choix « Je suis délégué d'une classe » N'APPARAÎT PAS !
  // =========================================================================
  if (inviteToken) {
    const roleTarget = inviteData?.invitation.roleTarget || (inviteData?.invitation as any)?.targetRole || 'STUDENT';
    const roleLabel = roleTarget === 'DEPUTY' ? 'suppléant' : 'élève';
    const displayClassName = inviteData?.className || 'votre classe';

    const expectedEmail = (inviteData?.invitation.email || '').trim().toLowerCase();
    const currentGoogleEmail = (currentUser?.email || '').trim().toLowerCase();
    const isEmailMatching = expectedEmail ? expectedEmail === currentGoogleEmail : true;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
          
          {/* Header Icon */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
              <School className="w-7 h-7" />
            </div>

            {isVerifyingInvite ? (
              <div className="py-6 flex flex-col items-center space-y-3">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 font-semibold">
                  Vérification de votre invitation en cours...
                </p>
              </div>
            ) : inviteError ? (
              <div className="space-y-3">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Invitation inaccessible
                </h2>
                <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs">
                  {inviteError}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.removeItem('klass_pending_invite');
                    setInviteToken(null);
                    setMode('choose');
                    if (typeof window !== 'undefined') {
                      window.history.replaceState({}, '', window.location.pathname);
                    }
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 underline"
                >
                  Continuer sans cette invitation
                </button>
              </div>
            ) : (
              <div>
                {/* Titre imposé : "Rejoindre la classe [nom] en tant qu'[élève ou suppléant]" */}
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                  Rejoindre la classe <span className="text-blue-600 dark:text-blue-400">{displayClassName}</span> en tant qu'<span className="capitalize">{roleLabel}</span>
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Invitation officielle émise par les délégués de votre classe.
                </p>
              </div>
            )}
          </div>

          {!isVerifyingInvite && !inviteError && (
            <div className="space-y-5">
              
              {/* Rôle imposé et non modifiable */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Rôle attribué par l'invitation
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                    <span>{roleTarget === 'DEPUTY' ? '🎖️ Délégué(e) suppléant(e)' : '🎓 Élève'}</span>
                  </span>
                  <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-200/70 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 mr-1" />
                    Non modifiable
                  </span>
                </div>
              </div>

              {/* Vérification de l'e-mail du compte Google connecté */}
              {expectedEmail && !isEmailMatching ? (
                /* ÉCHEC : L'e-mail ne correspond pas */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs space-y-2">
                    <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-extrabold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Adresse e-mail différente</span>
                    </div>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                      Cette invitation est strictement réservée à l'adresse e-mail :
                      <br />
                      <strong className="font-mono text-[11px] underline bg-amber-100/80 dark:bg-amber-900/60 px-1 py-0.5 rounded mt-1 inline-block">
                        {expectedEmail}
                      </strong>
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 text-[11px]">
                      Vous êtes actuellement connecté(e) avec votre compte Google :
                      <br />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {currentGoogleEmail}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Changer de compte Google ({expectedEmail})</span>
                  </button>
                </div>
              ) : (
                /* SUCCÈS : L'e-mail correspond */
                <div className="space-y-4">
                  {currentUser?.email && (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Compte Google validé : <strong>{currentGoogleEmail}</strong>
                      </span>
                    </div>
                  )}

                  {feedback && (
                    <div
                      className={`p-3 rounded-2xl text-xs ${
                        feedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {feedback.text}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isJoining}
                    onClick={handleConfirmDirectInvite}
                    className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Adhésion à la classe en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Rejoindre la classe {displayClassName} en tant qu'{roleLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    );
  }

  // =========================================================================
  // SCENARIO 2 : SANS LIEN D'INVITATION
  // Affiche le choix habituel : "Rejoindre une classe" OU "Je suis délégué"
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {mode === 'choose' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
                <School className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Bienvenue sur Klass
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Pour commencer, choisissez votre situation :
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Rejoindre une classe */}
              <button
                type="button"
                onClick={() => setMode('join')}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800/60 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all group flex items-start space-x-4"
              >
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center">
                    Rejoindre une classe
                    <ArrowRight className="w-4 h-4 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    J'ai reçu un code d'invitation de la part d'un délégué de ma classe.
                  </p>
                </div>
              </button>

              {/* Option 2: Je suis délégué (Uniquement sans lien d'invitation) */}
              <button
                type="button"
                onClick={() => setMode('create')}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-white dark:bg-slate-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all group flex items-start space-x-4"
              >
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center">
                    Je suis délégué d'une classe
                    <ArrowRight className="w-4 h-4 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600" />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Création d'un espace élève pour ma classe, choix du nom et invitation de mes camarades.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <form onSubmit={handleManualJoin} className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="text-xs text-slate-400 hover:text-slate-600 mb-2 font-semibold"
              >
                ← Retour
              </button>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Rejoindre ma classe
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Entrez le code personnel ou le lien reçu de votre délégué :
              </p>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-2xl text-xs ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {feedback.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Code d'invitation personnel
              </label>
              <input
                type="text"
                required
                placeholder="Ex: KLASS-c_123-inv_456"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining}
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
            >
              {isJoining ? 'Connexion en cours...' : 'Rejoindre la classe'}
            </button>
          </form>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="text-xs text-slate-400 hover:text-slate-600 mb-2 font-semibold"
              >
                ← Retour
              </button>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Créer l'espace de ma classe
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                En tant que créateur(trice), vous recevrez automatiquement le rôle de Délégué(e) titulaire (avec l'anneau bleu).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nom de la classe *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Première 2, Terminale 3 - Spé Maths/SVT..."
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Établissement (Lycée) *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Lycée Victor Hugo (Paris)"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-800 dark:text-blue-300 flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p>
                Vous pourrez ensuite générer des liens d'invitation sécurisés et synchroniser l'emploi du temps via Pronote.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Créer la classe & Accéder à l'espace
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
