import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Layers, Eye, EyeOff, Check } from 'lucide-react';

export const OptionsFilterModal: React.FC = () => {
  const { courses, currentUser, toggleHideCategory, closeModal } = useApp();

  // Find all unique categories from class courses
  const allCategories = Array.from(
    new Set(courses.map(c => c.category).filter((c): c is string => Boolean(c) && c !== 'Tronc commun'))
  );

  const hiddenList = currentUser?.hiddenCourseCategories || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Mes options & spécialités
              </h3>
              <p className="text-xs text-slate-500">
                Masquer les cours qui ne vous concernent pas
              </p>
            </div>
          </div>
          <button type="button" onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            Cochez les options et spécialités que vous suivez. Les cours non cochés seront masqués de votre emploi du temps sans impacter les autres élèves.
          </p>

          <div className="space-y-2">
            {allCategories.length === 0 ? (
              <p className="text-slate-400 text-center py-4">
                Tous les cours actuels font partie du tronc commun.
              </p>
            ) : (
              allCategories.map((cat) => {
                const isHidden = hiddenList.includes(cat);
                const isFollowed = !isHidden;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleHideCategory(cat)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isFollowed
                        ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          isFollowed
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isFollowed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-sm">{cat}</span>
                    </div>

                    <span className="text-[11px] font-semibold flex items-center">
                      {isFollowed ? (
                        <>
                          <Eye className="w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400" />
                          <span>Visible</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          <span>Masqué</span>
                        </>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
          >
            Terminer
          </button>
        </div>

      </div>
    </div>
  );
};
