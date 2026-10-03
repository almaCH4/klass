import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { School, UserPlus, Sparkles, ArrowRight, ShieldCheck, Check, X } from 'lucide-react';

export const ClassCreationJoinModal: React.FC = () => {
  const { createClass, joinClassWithInvite, closeModal } = useApp();

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [className, setClassName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !schoolName.trim()) return;

    await createClass(className.trim(), schoolName.trim());
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    const res = await joinClassWithInvite(inviteToken.trim());
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

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
                    J'ai reçu un lien ou un code d'invitation de la part d'un délégué de ma classe.
                  </p>
                </div>
              </button>

              {/* Option 2: Je suis délégué */}
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
          <form onSubmit={handleJoin} className="space-y-4">
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
                Lien ou code d'invitation personnel
              </label>
              <input
                type="text"
                required
                placeholder="Ex: tok_sarah_9f82bc4e ou collez le lien complet"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                💡 Astuce démo : le code <code className="text-blue-600 font-bold">tok_sarah_9f82bc4e</code> est prêt à être testé.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Rejoindre la classe
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
