import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Layers, Eye, EyeOff, Check } from 'lucide-react';

export const OptionsFilterModal: React.FC = () => {
  const { courses, currentClass, currentUser, toggleHideCategory, closeModal } = useApp();

  // Combine categories and groups extracted from courses and class info
  const allGroupsAndOptions = useMemo(() => {
    const set = new Set<string>();

    if (currentClass?.availableGroups) {
      currentClass.availableGroups.forEach(g => set.add(g));
    }

    courses.forEach(c => {
      if (c.group) set.add(c.group);
      if (c.category && c.category !== 'Tronc commun') set.add(c.category);
    });

    return Array.from(set).sort();
  }, [courses, currentClass?.availableGroups]);

  const hiddenList = currentUser?.hiddenCourseCategories || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl max-w-md w-full border border-amber-900/10 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-900/10 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/50 dark:text-sky-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Mes options & groupes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Masquer les groupes et options qui ne vous concernent pas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Cochez les groupes et options que vous suivez (ex : LV2, spécialités, groupes de TP). Les cours non cochés seront masqués de votre emploi du temps et devoirs sans impacter vos camarades.
          </p>

          <div className="space-y-2">
            {allGroupsAndOptions.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <p className="font-semibold">Aucun groupe ou option détecté pour l'instant.</p>
                <p className="text-[11px] mt-1">Tous les cours actuels font partie du tronc commun.</p>
              </div>
            ) : (
              allGroupsAndOptions.map((item) => {
                const isHidden = hiddenList.includes(item);
                const isFollowed = !isHidden;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleHideCategory(item)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isFollowed
                        ? 'bg-amber-50/60 dark:bg-sky-950/30 border-[#234E70]/30 dark:border-sky-800 text-slate-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors shrink-0 ${
                          isFollowed
                            ? 'bg-[#234E70] border-[#234E70] text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isFollowed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-xs sm:text-sm truncate">{item}</span>
                    </div>

                    <span className="text-[11px] font-semibold flex items-center shrink-0 ml-2">
                      {isFollowed ? (
                        <span className="text-[#234E70] dark:text-sky-400 flex items-center">
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          <span>Visible</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 flex items-center">
                          <EyeOff className="w-3.5 h-3.5 mr-1" />
                          <span>Masqué</span>
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-amber-900/10 dark:border-slate-800 bg-[#FAF8F5]/80 dark:bg-slate-900/60 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-[#234E70] text-white text-xs font-bold hover:bg-[#1b3e59] shadow-xs transition-colors"
          >
            Terminé
          </button>
        </div>

      </div>
    </div>
  );
};
