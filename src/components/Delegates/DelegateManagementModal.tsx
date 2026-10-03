import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Mail,
  Copy,
  Check,
  RotateCw,
  XCircle,
  UserMinus,
  X
} from 'lucide-react';

export const DelegateManagementModal: React.FC = () => {
  const {
    currentClass,
    invitations,
    members,
    currentUser,
    createInvitation,
    revokeInvitation,
    resendInvitation,
    promoteMember,
    removeMember,
    closeModal,
    isDelegate
  } = useApp();

  const [emailInput, setEmailInput] = useState('');
  const [roleTarget, setRoleTarget] = useState<UserRole>('STUDENT');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'invites' | 'members'>('invites');

  // Filter invitations for current class
  const classInvitations = invitations.filter(i => i.classId === currentClass?.id);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    const res = await createInvitation(emailInput, roleTarget);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
      setEmailInput('');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const copyInviteLink = (token: string, inviteId: string) => {
    const origin = window.location.origin;
    const url = `${origin}?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePromote = async (userId: string, newRole: UserRole) => {
    const res = await promoteMember(userId, newRole);
    if (res.success) {
      setFeedback({ type: 'success', text: res.message });
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleRemove = async (userId: string) => {
    if (window.confirm('Voulez-vous vraiment retirer cet élève de la classe ?')) {
      const res = await removeMember(userId);
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    }
  };

  const titulairesCount = members.filter((m) => m.role === 'DELEGATE').length;
  const deputiesCount = members.filter((m) => m.role === 'DEPUTY').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Gestion de la classe & Invitations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentClass?.name} ({titulairesCount}/2 titulaires • {deputiesCount}/2 suppléants)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeModal}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs: Invitations vs Membres */}
        <div className="px-6 pt-3 flex space-x-2 border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveSubTab('invites')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'invites'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Invitations ({classInvitations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('members')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeSubTab === 'members'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Membres connectés ({members.length})
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            <span>{feedback.text}</span>
            <button type="button" onClick={() => setFeedback(null)} className="ml-2 font-bold">×</button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeSubTab === 'invites' ? (
            <>
              {/* Send Invite Form */}
              <form onSubmit={handleCreateInvite} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center">
                  <UserPlus className="w-4 h-4 mr-1.5 text-blue-500" />
                  Inviter un élève ou un délégué
                </h4>
                
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chaque invité reçoit un lien personnel sécurisé, utilisable uniquement avec son adresse e-mail Google.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="prenom.nom@lycee.fr ou gmail"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={roleTarget}
                    onChange={(e) => setRoleTarget(e.target.value as UserRole)}
                    className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="STUDENT">Rôle : Élève</option>
                    <option value="DEPUTY" disabled={deputiesCount >= 2}>
                      Rôle : Délégué suppléant {deputiesCount >= 2 ? '(Complet)' : ''}
                    </option>
                    <option value="DELEGATE" disabled={titulairesCount >= 2}>
                      Rôle : Délégué titulaire {titulairesCount >= 2 ? '(Complet)' : ''}
                    </option>
                  </select>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center space-x-1"
                  >
                    <span>Générer le lien</span>
                  </button>
                </div>
              </form>

              {/* Invitations List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Invitations en cours ({classInvitations.length})
                </h4>

                {classInvitations.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Aucune invitation envoyée pour le moment.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {classInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {inv.email}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                              {inv.roleTarget === 'DELEGATE' ? 'Délégué' : inv.roleTarget === 'DEPUTY' ? 'Suppléant' : 'Élève'}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center space-x-2 text-[11px] text-slate-500">
                            <span>Invité par {inv.invitedBy}</span>
                            <span>•</span>
                            {inv.status === 'ACCEPTED' ? (
                              <span className="text-emerald-600 font-bold">A rejoint la classe ✓</span>
                            ) : inv.status === 'REVOKED' ? (
                              <span className="text-rose-500 font-semibold">Révoquée</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">En attente de connexion</span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                          {inv.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => copyInviteLink(inv.token, inv.id)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium flex items-center space-x-1 transition-colors"
                                title="Copier le lien personnel"
                              >
                                {copiedId === inv.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-emerald-500 font-bold">Copié !</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copier le lien</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => resendInvitation(inv.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700"
                                title="Renvoyer l'invitation"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => revokeInvitation(inv.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700"
                                title="Révoquer l'invitation"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Members Tab */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
                <p className="font-bold">Règles des rôles de classe :</p>
                <p className="mt-0.5">
                  Une classe compte au maximum 2 délégués titulaires et 2 suppléants. Les délégués portent l'anneau bleu et ont tous les droits d'édition.
                </p>
              </div>

              <div className="space-y-2">
                {members.map((member) => {
                  const isCurrent = member.id === currentUser?.id;
                  const isMemberDelegate = member.role === 'DELEGATE';
                  const isMemberDeputy = member.role === 'DEPUTY';

                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${
                            isMemberDelegate ? 'delegate-ring' : isMemberDeputy ? 'deputy-ring' : 'ring-1 ring-slate-200'
                          }`}
                        >
                          <img
                            src={member.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(member.email)}`}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {member.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold">
                                Vous
                              </span>
                            )}
                          </div>
                          <p className="text-slate-400 text-[11px]">{member.email}</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            {isMemberDelegate ? '👑 Délégué(e) titulaire' : isMemberDeputy ? '🎖️ Suppléant(e)' : '🎓 Élève'}
                          </p>
                        </div>
                      </div>

                      {/* Role Actions (only available to Délégué titulaire) */}
                      {isDelegate && !isCurrent && (
                        <div className="flex items-center space-x-2 self-end sm:self-auto">
                          {member.role !== 'DELEGATE' && (
                            <button
                              type="button"
                              onClick={() => handlePromote(member.id, 'DELEGATE')}
                              disabled={titulairesCount >= 2}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold hover:bg-blue-100 disabled:opacity-40"
                              title="Nommer Délégué(e) titulaire"
                            >
                              Nommer Titulaire
                            </button>
                          )}

                          {member.role !== 'DEPUTY' && (
                            <button
                              type="button"
                              onClick={() => handlePromote(member.id, 'DEPUTY')}
                              disabled={deputiesCount >= 2}
                              className="px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 font-bold hover:bg-sky-100 disabled:opacity-40"
                              title="Nommer Suppléant(e)"
                            >
                              Nommer Suppléant
                            </button>
                          )}

                          {member.role !== 'STUDENT' && (
                            <button
                              type="button"
                              onClick={() => handlePromote(member.id, 'STUDENT')}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200"
                              title="Rétrograder en simple élève"
                            >
                              Rétrograder élève
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemove(member.id)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Retirer de la classe"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={closeModal}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
