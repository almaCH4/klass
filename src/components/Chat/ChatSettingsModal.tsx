import React, { useState } from 'react';
import { X, Settings, Shield, VolumeX, Volume2, Plus, Trash2, Check } from 'lucide-react';
import { ClassInfo, User } from '../../types';
import { DEFAULT_FRENCH_BAD_WORDS } from '../../utils/badWordsFilter';

interface ChatSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassInfo;
  members: User[];
  onUpdateClassSettings: (updates: Partial<ClassInfo>) => Promise<void>;
}

export const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  members,
  onUpdateClassSettings
}) => {
  const [description, setDescription] = useState(currentClass.chatDescription || '');
  const [badWords, setBadWords] = useState<string[]>(
    currentClass.badWordsList && currentClass.badWordsList.length > 0
      ? currentClass.badWordsList
      : DEFAULT_FRENCH_BAD_WORDS
  );
  const [newWordInput, setNewWordInput] = useState('');
  const [mutedIds, setMutedIds] = useState<string[]>(currentClass.mutedUserIds || []);
  const [activeTab, setActiveTab] = useState<'info' | 'badWords' | 'moderation'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddWord = () => {
    const trimmed = newWordInput.trim().toLowerCase();
    if (!trimmed || badWords.includes(trimmed)) return;
    setBadWords([...badWords, trimmed]);
    setNewWordInput('');
  };

  const handleRemoveWord = (word: string) => {
    setBadWords(badWords.filter(w => w !== word));
  };

  const handleResetDefaultBadWords = () => {
    setBadWords(DEFAULT_FRENCH_BAD_WORDS);
  };

  const handleToggleMute = (userId: string) => {
    if (mutedIds.includes(userId)) {
      setMutedIds(mutedIds.filter(id => id !== userId));
    } else {
      setMutedIds([...mutedIds, userId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdateClassSettings({
      chatDescription: description.trim(),
      badWordsList: badWords,
      mutedUserIds: mutedIds
    });
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950/60 dark:text-sky-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Gestion du groupe de classe
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab pills */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'info'
                ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Description
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('badWords')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'badWords'
                ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Filtre gros mots ({badWords.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('moderation')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'moderation'
                ? 'bg-white dark:bg-[#1A2026] text-[#234E70] dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sourdine ({mutedIds.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[220px] max-h-[360px] overflow-y-auto no-scrollbar space-y-3 py-1">
          {activeTab === 'info' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description du groupe
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                  placeholder="Ex : Espace d'échange et d'entraide de la Terminale 3. Respect, bienveillance et entraide mutuelle !"
                  className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Visible par tous les élèves en haut du chat.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'badWords' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ces mots français sont automatiquement masqués par des astérisques (ex : <code>m***e</code>) avant l'enregistrement.
              </p>

              {/* Add custom word */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newWordInput}
                  onChange={(e) => setNewWordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddWord();
                    }
                  }}
                  placeholder="Ajouter un mot à filtrer..."
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
                />
                <button
                  type="button"
                  onClick={handleAddWord}
                  className="px-3 py-1.5 text-xs font-bold bg-[#234E70] text-white rounded-xl hover:bg-[#1b3e59]"
                >
                  Ajouter
                </button>
              </div>

              {/* Bad words badges */}
              <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-1">
                {badWords.map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(word)}
                      className="ml-1 text-slate-400 hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleResetDefaultBadWords}
                  className="text-[11px] text-slate-500 hover:underline"
                >
                  Restaurer la liste française par défaut
                </button>
              </div>
            </div>
          )}

          {activeTab === 'moderation' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Un membre en sourdine peut toujours lire les messages, mais ne peut plus en envoyer.
              </p>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((member) => {
                  const isMuted = mutedIds.includes(member.id);
                  const isMemberLeader = member.role === 'DELEGATE' || member.role === 'DEPUTY';

                  return (
                    <div key={member.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={member.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(member.email)}`}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {member.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {isMemberLeader ? 'Délégué(e)' : 'Élève'}
                          </p>
                        </div>
                      </div>

                      {!isMemberLeader && (
                        <button
                          type="button"
                          onClick={() => handleToggleMute(member.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors ${
                            isMuted
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {isMuted ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5" />
                              <span>En sourdine</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>Actif</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center">
                <Check className="w-3.5 h-3.5 mr-1" />
                Modifications enregistrées !
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold bg-[#234E70] hover:bg-[#1b3e59] text-white rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
