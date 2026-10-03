import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, BookOpen, ShieldCheck, ArrowRight, Check, X } from 'lucide-react';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, finishOnboarding, closeModal } = useApp();
  const [step, setStep] = useState(0);

  if (!showOnboarding) return null;

  const screens = [
    {
      icon: <Calendar className="w-8 h-8 text-blue-500" />,
      tag: 'Écran 1 sur 3 • Emploi du temps',
      title: 'Votre emploi du temps Pronote synchronisé 24h/24',
      description:
        'Finies les mauvaises surprises ! L\'emploi du temps se met à jour automatiquement avec les cours annulés, les changements de salle et les notes d\'organisation des délégués.',
      color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
    },
    {
      icon: <BookOpen className="w-8 h-8 text-emerald-500" />,
      tag: 'Écran 2 sur 3 • Vie de classe',
      title: 'Tout pour réussir son année de lycée',
      description:
        'Devoirs à rendre, contrôles avec fiches de révision, rattrapage pour les absents et communication directe avec vos délégués titulaires et suppléants.',
      color: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-indigo-500" />,
      tag: 'Écran 3 sur 3 • Confidentialité & Sécurité',
      title: 'Espace 100% privé & conforme RGPD',
      description:
        'Votre bloc-notes personnel et vos événements privés ne sont visibles par personne d\'autre. Connexion sécurisée avec Google et aucune publicité.',
      color: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
    }
  ];

  const currentScreen = screens[step];

  const handleNext = () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      finishOnboarding();
      closeModal();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between min-h-[420px]">
        
        {/* Top bar with Skip button */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {currentScreen.tag}
          </span>
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Passer la visite
          </button>
        </div>

        {/* Center content */}
        <div className="my-6 text-center">
          <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-5 ${currentScreen.color}`}>
            {currentScreen.icon}
          </div>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currentScreen.title}
          </h3>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentScreen.description}
          </p>
        </div>

        {/* Dots indicators & Next button */}
        <div>
          <div className="flex items-center justify-center space-x-2 mb-6">
            {screens.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === i ? 'w-8 bg-blue-600' : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center space-x-3">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
              >
                Précédent
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm transition-all shadow-md shadow-blue-500/25 flex items-center justify-center space-x-2"
            >
              <span>{step === screens.length - 1 ? 'C\'est parti !' : 'Suivant'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
