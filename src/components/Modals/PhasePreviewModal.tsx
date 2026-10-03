import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, BookOpen, GraduationCap, Users, MessageSquare, CheckCircle, X } from 'lucide-react';

export const PhasePreviewModal: React.FC = () => {
  const { modalData, closeModal } = useApp();
  const tab = modalData?.tab;
  const phase = modalData?.phase || 2;

  const contentMap: Record<string, { title: string; subtitle: string; icon: React.ReactNode; features: string[] }> = {
    homework: {
      title: 'Module Devoirs (Phase 2)',
      subtitle: 'Organisation intelligente des devoirs de la classe',
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      features: [
        'Collage intelligent depuis Pronote avec analyse automatique (matière, date de rendu, consignes)',
        'Validation et complétion par les délégués (estimation du temps, documents attachés)',
        'Liste triée par date d\'échéance avec alerte visuelle pour le lendemain',
        'Case à cocher "Fait" personnelle pour chaque élève'
      ]
    },
    exams: {
      title: 'Module Contrôles & Évaluations (Phase 2)',
      subtitle: 'Anticiper les devoirs surveillés et bacs blancs',
      icon: <GraduationCap className="w-8 h-8 text-indigo-500" />,
      features: [
        'Bandeau "Prochains contrôles" en haut de la page',
        'Fiche détaillée au clic (chapitres au programme, liens de révision, fiches PDF)',
        'Compte à rebours et rappels personnalisés de révision',
        'Saisie collaborative par les délégués'
      ]
    },
    catchup: {
      title: 'Module Rattrapage pour absents (Phase 2)',
      subtitle: 'Plus aucun cours manqué en cas de maladie',
      icon: <Sparkles className="w-8 h-8 text-emerald-500" />,
      features: [
        'Dépôt au clic sur un cours du jour par les délégués (photos du tableau, fiches, PDF)',
        'Notes explicatives sur ce qui a été fait en classe',
        'Recherche et filtrage par matière et par date',
        'Aperçu haute résolution directement dans l\'application'
      ]
    },
    chat: {
      title: 'Groupe de classe (Phase 3)',
      subtitle: 'L\'espace de discussion sécurisé de la classe',
      icon: <Users className="w-8 h-8 text-purple-500" />,
      features: [
        'Un seul groupe de classe unifié type messagerie instantanée',
        'Bot de classe matinal : rappels des contrôles et anniversaires du jour',
        'Filtre automatique de gros mots (français, anglais, russe) modifiable par les délégués',
        'Outils de modération délégués (mise en sourdine, suppression, signalement)'
      ]
    },
    messages: {
      title: 'Messagerie directe avec les délégués (Phase 3)',
      subtitle: 'Échange confidentiel et prioritaire',
      icon: <MessageSquare className="w-8 h-8 text-amber-500" />,
      features: [
        'Écrire en privé aux délégués titulaires ou suppléants',
        'Option "Urgent" pour déclencher une notification prioritaire',
        'Boîte de réception pour les délégués (statuts non lu / traité)',
        'Section Sondages & QCM (formulaires de consultation)'
      ]
    }
  };

  const info = contentMap[tab] || {
    title: `Phase ${phase} - Bientôt disponible`,
    subtitle: 'Module en cours de développement',
    icon: <Sparkles className="w-8 h-8 text-blue-500" />,
    features: ['Fonctionnalité prévue pour les prochaines phases de livraison.']
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-8">
        
        <div className="flex justify-end">
          <button type="button" onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center mt-1">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/60 mx-auto flex items-center justify-center mb-4">
            {info.icon}
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 mb-2">
            Livraison en Phase {phase}
          </span>

          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {info.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {info.subtitle}
          </p>
        </div>

        <div className="mt-6 space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/60">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Ce qui est prévu pour ce module :
          </p>
          {info.features.map((feat, i) => (
            <div key={i} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400 italic">
          Nous respectons la consigne : « Construis l'application par phases. Fais uniquement la phase demandée, vérifie qu'elle fonctionne de bout en bout, puis attends que je te dise de passer à la suivante. »
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={closeModal}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            Retourner à la Phase 1 (Emploi du temps & Profil)
          </button>
        </div>

      </div>
    </div>
  );
};
