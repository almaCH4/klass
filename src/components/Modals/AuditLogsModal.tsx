import React from 'react';
import { useApp } from '../../context/AppContext';
import { History, Shield, Clock, X } from 'lucide-react';

export const AuditLogsModal: React.FC = () => {
  const { auditLogs, closeModal } = useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Journal des actions des délégués
              </h3>
              <p className="text-xs text-slate-400">
                Transparence & traçabilité des modifications de classe
              </p>
            </div>
          </div>
          <button type="button" onClick={closeModal} className="p-1 rounded-xl text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Aucune action enregistrée pour le moment.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {log.details}
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  Par {log.authorName} ({log.authorRole})
                </p>
              </div>
            ))
          )}
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
