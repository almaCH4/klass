import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatMessage, ChatPoll, UserRole, ClassInfo, User } from '../../types';
import { firestoreService } from '../../services/firestoreService';
import { db } from '../../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { filterFrenchBadWords } from '../../utils/badWordsFilter';
import { PollCreatorModal } from './PollCreatorModal';
import { ChatSettingsModal } from './ChatSettingsModal';
import { ReportModal } from './ReportModal';
import {
  Send,
  Smile,
  Reply,
  Copy,
  Pin,
  Trash2,
  AlertTriangle,
  BarChart2,
  Settings,
  X,
  VolumeX,
  Check,
  CheckCheck,
  ChevronDown,
  Info,
  Bot,
  Cake,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Users
} from 'lucide-react';

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥', '🎉'];

/**
 * Formats timestamp into HH:mm in Paris
 */
function formatMessageTime(timestampMs: number): string {
  try {
    return new Date(timestampMs).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

/**
 * Returns date label for separators: "Aujourd'hui", "Hier", or "Lundi 5 octobre"
 */
function getMessageDateLabel(timestampMs: number): string {
  const d = new Date(timestampMs);
  const now = new Date();

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return "Aujourd'hui";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Hier';

  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

/**
 * Parses URLs inside text and renders clickable links
 */
function renderMessageText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold hover:opacity-80 break-all inline-flex items-center"
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 ml-0.5 inline shrink-0" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

export const ClassChatView: React.FC = () => {
  const {
    currentUser,
    currentClass,
    members,
    isLeader,
    updateClassInfo
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLimit, setMessagesLimit] = useState(50);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);

  // Modals
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [activeReportDetails, setActiveReportDetails] = useState<ChatMessage | null>(null);

  // Bot birthday message dismissed for the session
  const [dismissBotMessage, setDismissBotMessage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Is current user muted by delegates?
  const isMuted = Boolean(
    currentUser &&
    currentClass?.mutedUserIds &&
    currentClass.mutedUserIds.includes(currentUser.id)
  );

  // ==========================================
  // SINGLE REAL-TIME LISTENER FOR MESSAGES
  // Charges les 'messagesLimit' derniers messages
  // ==========================================
  useEffect(() => {
    if (!currentClass?.id) return;

    const messagesCol = collection(db, 'classes', currentClass.id, 'messages');
    const q = query(messagesCol, orderBy('timestampMs', 'desc'), limit(messagesLimit));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: ChatMessage[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push(docSnap.data() as ChatMessage);
        });
        // Sort chronologically ascending for display
        fetched.sort((a, b) => a.timestampMs - b.timestampMs);
        setMessages(fetched);
      },
      (error) => {
        console.error('Erreur écouteur messages:', error);
      }
    );

    return () => unsubscribe();
  }, [currentClass?.id, messagesLimit]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // ==========================================
  // BOT DE CLASSE (Calculé localement, non enregistré)
  // Anniversaires du jour (jour et mois uniquement)
  // ==========================================
  const todaysBirthdayMembers = useMemo(() => {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentDay = String(now.getDate()).padStart(2, '0');

    return members.filter((m) => {
      if (!m.birthday) return false;
      // Format can be YYYY-MM-DD or DD/MM/YYYY or MM-DD
      let bMonth = '';
      let bDay = '';

      if (m.birthday.includes('-')) {
        const parts = m.birthday.split('-');
        if (parts.length === 3) {
          bMonth = parts[1].padStart(2, '0');
          bDay = parts[2].padStart(2, '0');
        } else if (parts.length === 2) {
          bMonth = parts[0].padStart(2, '0');
          bDay = parts[1].padStart(2, '0');
        }
      } else if (m.birthday.includes('/')) {
        const parts = m.birthday.split('/');
        if (parts.length >= 2) {
          bDay = parts[0].padStart(2, '0');
          bMonth = parts[1].padStart(2, '0');
        }
      }

      return bMonth === currentMonth && bDay === currentDay;
    });
  }, [members]);

  // Pinned message
  const pinnedMessage = useMemo(() => {
    if (!currentClass?.pinnedMessageId) {
      return messages.find((m) => m.isPinned && !m.isDeleted);
    }
    return (
      messages.find((m) => m.id === currentClass.pinnedMessageId && !m.isDeleted) ||
      messages.find((m) => m.isPinned && !m.isDeleted)
    );
  }, [messages, currentClass?.pinnedMessageId]);

  // ==========================================
  // SEND MESSAGE
  // ==========================================
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentClass || !currentUser || isMuted) return;

    const trimmed = inputText.trim();
    if (!trimmed) return;

    if (trimmed.length > 2200) {
      alert('Votre message dépasse la limite de 2 200 caractères.');
      return;
    }

    // Filter bad words in French before storing
    const sanitizedText = filterFrenchBadWords(trimmed, currentClass.badWordsList);

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const senderName = currentUser.name?.trim() || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'Élève';
    const newMsg: ChatMessage = {
      id: messageId,
      classId: currentClass.id,
      senderId: currentUser.id,
      senderName,
      senderAvatar: currentUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser.email || currentUser.id)}`,
      senderRole: currentUser.role || 'STUDENT',
      text: sanitizedText,
      createdAt: now.toISOString(),
      timestampMs: now.getTime(),
      type: 'text',
      reactions: {}
    };

    if (replyingTo) {
      newMsg.replyTo = {
        id: replyingTo.id,
        senderName: replyingTo.senderName,
        text: replyingTo.text.substring(0, 120)
      };
    }

    setInputText('');
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setChatError(null);

    try {
      await firestoreService.sendChatMessage(currentClass.id, newMsg);
    } catch (err: any) {
      console.error('Erreur envoi message:', err);
      const code = err.message?.match(/\[(.*?)\]/)?.[1] || err.code || 'chat/error';
      setChatError(`[${code}] Impossible d'envoyer le message. Veuillez vérifier vos autorisations.`);
      setTimeout(() => setChatError(null), 5000);
    }
  };

  // ==========================================
  // CREATE POLL
  // ==========================================
  const handleCreatePoll = async (poll: ChatPoll) => {
    if (!currentClass || !currentUser || !isLeader) return;

    const messageId = `poll_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();

    const sanitizedQuestion = filterFrenchBadWords(poll.question, currentClass.badWordsList);
    const sanitizedOptions = poll.options.map(o => ({
      ...o,
      text: filterFrenchBadWords(o.text, currentClass.badWordsList)
    }));

    const newMsg: ChatMessage = {
      id: messageId,
      classId: currentClass.id,
      senderId: currentUser.id,
      senderName: currentUser.name || `${currentUser.firstName} ${currentUser.lastName}`.trim(),
      senderAvatar: currentUser.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(currentUser.email)}`,
      senderRole: currentUser.role,
      text: `📊 Sondage : ${sanitizedQuestion}`,
      createdAt: now.toISOString(),
      timestampMs: now.getTime(),
      type: 'poll',
      poll: {
        ...poll,
        question: sanitizedQuestion,
        options: sanitizedOptions
      },
      reactions: {}
    };

    try {
      await firestoreService.sendChatMessage(currentClass.id, newMsg);
    } catch (err: any) {
      console.error('Erreur création sondage:', err);
    }
  };

  // ==========================================
  // VOTE IN POLL (Indexed by UID)
  // ==========================================
  const handleVotePoll = async (msg: ChatMessage, optionId: string) => {
    if (!currentClass || !currentUser || !msg.poll) return;

    const poll = msg.poll;
    const isMultiple = poll.isMultipleChoice;
    const userId = currentUser.id;

    // Récupère les votes actuels de l'utilisateur
    const currentVotes = (poll.votes?.[userId] || []) as string[];
    let updatedVotes: string[] = [];

    if (isMultiple) {
      if (currentVotes.includes(optionId)) {
        updatedVotes = currentVotes.filter(id => id !== optionId);
      } else {
        updatedVotes = [...currentVotes, optionId];
      }
    } else {
      if (currentVotes.includes(optionId)) {
        updatedVotes = [];
      } else {
        updatedVotes = [optionId];
      }
    }

    const updatedPollVotes = {
      ...(poll.votes || {}),
      [userId]: updatedVotes
    };
    if (updatedVotes.length === 0) {
      delete updatedPollVotes[userId];
    }

    try {
      await firestoreService.updateChatMessage(currentClass.id, msg.id, {
        poll: {
          question: poll.question, // Invariable
          options: poll.options,   // Invariable
          isMultipleChoice: poll.isMultipleChoice,
          createdAt: poll.createdAt,
          votes: updatedPollVotes
        }
      });
    } catch (err) {
      console.error('Erreur vote sondage:', err);
    }
  };

  // ==========================================
  // EMOJI REACTIONS (Indexed by UID)
  // ==========================================
  const handleToggleReaction = async (msg: ChatMessage, emoji: string) => {
    if (!currentClass || !currentUser) return;

    const userId = currentUser.id;
    let userEmojis: string[] = [];

    if (msg.reactions && Array.isArray(msg.reactions[userId])) {
      userEmojis = [...msg.reactions[userId]];
    } else if (msg.reactions) {
      // Rétrocompatibilité avec l'ancienne structure emoji -> uids
      for (const [em, uids] of Object.entries(msg.reactions)) {
        if (Array.isArray(uids) && uids.includes(userId)) {
          userEmojis.push(em);
        }
      }
    }

    let updatedUserEmojis: string[] = [];
    if (userEmojis.includes(emoji)) {
      updatedUserEmojis = userEmojis.filter(e => e !== emoji);
    } else {
      updatedUserEmojis = [...userEmojis, emoji];
    }

    const updatedReactions = {
      ...(msg.reactions || {}),
      [userId]: updatedUserEmojis
    };
    if (updatedUserEmojis.length === 0) {
      delete updatedReactions[userId];
    }

    try {
      await firestoreService.updateChatMessage(currentClass.id, msg.id, {
        reactions: updatedReactions
      });
    } catch (err) {
      console.error('Erreur réaction:', err);
    }
  };

  // Confirmation de lecture automatique indexée par UID
  const handleMarkAsRead = async (msg: ChatMessage) => {
    if (!currentClass || !currentUser || msg.readBy?.[currentUser.id]) return;
    const updatedReadBy = {
      ...(msg.readBy || {}),
      [currentUser.id]: new Date().toISOString()
    };
    try {
      await firestoreService.updateChatMessage(currentClass.id, msg.id, {
        readBy: updatedReadBy
      });
    } catch {
      // Ignorer silencieusement
    }
  };

  // ==========================================
  // COPY TEXT
  // ==========================================
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback('Texte copié !');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // ==========================================
  // PIN / UNPIN MESSAGE (Delegates only)
  // ==========================================
  const handleTogglePin = async (msg: ChatMessage) => {
    if (!currentClass || !isLeader) return;

    const isCurrentlyPinned = msg.isPinned || currentClass.pinnedMessageId === msg.id;

    if (isCurrentlyPinned) {
      await firestoreService.updateChatMessage(currentClass.id, msg.id, {
        isPinned: false,
        pinnedAt: undefined,
        pinnedBy: undefined
      });
      await firestoreService.updateClass(currentClass.id, {
        pinnedMessageId: undefined
      });
    } else {
      await firestoreService.updateChatMessage(currentClass.id, msg.id, {
        isPinned: true,
        pinnedAt: new Date().toISOString(),
        pinnedBy: currentUser?.name || 'Délégué'
      });
      await firestoreService.updateClass(currentClass.id, {
        pinnedMessageId: msg.id
      });
    }
  };

  // ==========================================
  // DELETE MESSAGE (Delegates only)
  // ==========================================
  const handleDeleteMessage = async (msg: ChatMessage) => {
    if (!currentClass || !isLeader) return;
    if (window.confirm('Supprimer définitivement ce message pour tout le groupe ?')) {
      try {
        await firestoreService.deleteChatMessage(currentClass.id, msg.id);
      } catch (err) {
        console.error('Erreur suppression message:', err);
      }
    }
  };

  // ==========================================
  // REPORT MESSAGE
  // ==========================================
  const handleReportMessage = async (messageId: string, reason: string) => {
    if (!currentClass || !currentUser) return;

    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const existingReports = msg.reports || [];
    const updatedReports = [
      ...existingReports,
      {
        userId: currentUser.id,
        reason,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    ];

    try {
      await firestoreService.updateChatMessage(currentClass.id, messageId, {
        reports: updatedReports
      });
      setCopyFeedback('Message signalé aux délégués.');
      setTimeout(() => setCopyFeedback(null), 3000);
    } catch (err) {
      console.error('Erreur signalement message:', err);
    }
  };

  // Scroll to a specific message ID
  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-500');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-500'), 2000);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[580px] max-h-[880px] bg-[#EFEAE2] dark:bg-[#0C1317] rounded-3xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden relative">
      
      {/* Toast feedback */}
      {copyFeedback && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 text-white text-xs font-bold shadow-lg animate-in fade-in">
          {copyFeedback}
        </div>
      )}

      {/* ==================================================== */}
      {/* WHATSAPP-LIKE TOP HEADER */}
      {/* ==================================================== */}
      <div className="bg-[#FAF8F5] dark:bg-[#1A2026] px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between z-10 shrink-0">
        
        {/* Left: Group Avatar & Info */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[#234E70] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                Groupe {currentClass?.name || 'de classe'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0">
                {members.length} membres
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
              {currentClass?.chatDescription || 'Discussions et entraide de la classe'}
            </p>
          </div>
        </div>

        {/* Right: Actions (Sondage, Paramètres, Modération) */}
        <div className="flex items-center space-x-1.5 shrink-0">
          {isLeader && (
            <>
              <button
                type="button"
                onClick={() => setIsPollModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#234E70] text-white hover:bg-[#1b3e59] shadow-xs transition-transform active:scale-95"
                title="Créer un sondage"
              >
                <BarChart2 className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">+ Sondage</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Description, filtre gros mots & sourdine"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}

          {!isLeader && currentClass?.chatDescription && (
            <button
              type="button"
              onClick={() => alert(`Description du groupe :\n${currentClass.chatDescription}`)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Informations du groupe"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* BANDEAU MESSAGE ÉPINGLÉ (Délégués uniquement pour épingler) */}
      {/* ==================================================== */}
      {pinnedMessage && (
        <div className="bg-amber-50/95 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-900/60 px-4 py-2 text-xs flex items-center justify-between gap-2 z-10 shrink-0 animate-in fade-in">
          <button
            type="button"
            onClick={() => scrollToMessage(pinnedMessage.id)}
            className="flex items-center space-x-2 text-left min-w-0 flex-1 hover:opacity-80"
          >
            <Pin className="w-3.5 h-3.5 text-[#234E70] dark:text-sky-400 shrink-0 rotate-45" />
            <div className="min-w-0">
              <span className="font-extrabold text-amber-900 dark:text-amber-200 mr-1.5">
                Message épinglé :
              </span>
              <span className="text-amber-800 dark:text-amber-300 truncate inline-block max-w-sm sm:max-w-xl align-bottom">
                « {pinnedMessage.text} »
              </span>
            </div>
          </button>

          {isLeader && (
            <button
              type="button"
              onClick={() => handleTogglePin(pinnedMessage)}
              className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline shrink-0"
              title="Désépingler ce message"
            >
              Désépingler
            </button>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MESSAGE DU BOT DE CLASSE (Affiché le matin, calculé localement) */}
      {/* ==================================================== */}
      {!dismissBotMessage && (
        <div className="bg-sky-50/90 dark:bg-sky-950/60 border-b border-sky-200 dark:border-sky-900/60 px-4 py-2.5 text-xs flex items-center justify-between gap-3 z-10 shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#234E70] text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-sky-950 dark:text-sky-200 text-xs">
              {todaysBirthdayMembers.length > 0 ? (
                <span>
                  🎉 <strong>Joyeux anniversaire à {todaysBirthdayMembers.map(m => m.name).join(', ')}</strong> aujourd'hui ! Toute la classe te souhaite une excellente journée ! 🎂🎈
                </span>
              ) : (
                <span>
                  🤖 <strong>Bot Klass</strong> : Bonjour à toute la classe ! Passez une excellente journée de cours.
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissBotMessage(true)}
            className="p-1 rounded text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900"
            title="Masquer le message du bot"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ==================================================== */}
      {/* MESSAGES LIST (WhatsApp-like background & bubbles) */}
      {/* ==================================================== */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar"
        style={{
          backgroundImage: 'radial-gradient(#234E7015 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Pagination: Charger messages précédents */}
        {messages.length >= messagesLimit && (
          <div className="text-center pb-2">
            <button
              type="button"
              onClick={() => setMessagesLimit(prev => prev + 50)}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-white transition-all"
            >
              Charger les messages précédents
            </button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center mx-auto mb-2 text-[#234E70] dark:text-sky-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Bienvenue dans le groupe de classe !
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Échangez des devoirs, posez vos questions et entraidez-vous.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === currentUser?.id;
            const isSenderLeader = msg.senderRole === 'DELEGATE' || msg.senderRole === 'DEPUTY';
            const showDateSeparator =
              index === 0 ||
              getMessageDateLabel(msg.timestampMs) !== getMessageDateLabel(messages[index - 1].timestampMs);

            return (
              <React.Fragment key={msg.id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xs capitalize">
                      {getMessageDateLabel(msg.timestampMs)}
                    </span>
                  </div>
                )}

                {/* Message Row */}
                <div
                  id={`msg-${msg.id}`}
                  className={`group relative flex items-end gap-2 transition-all duration-300 ${
                    isMe ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {/* Avatar for other members (with blue ring for delegates) */}
                  {!isMe && (
                    <div className="shrink-0 mb-1">
                      <img
                        src={msg.senderAvatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(msg.senderName)}`}
                        alt={msg.senderName}
                        className={`w-7 h-7 rounded-full object-cover shadow-2xs ${
                          isSenderLeader
                            ? 'ring-2 ring-[#234E70] dark:ring-sky-400 ring-offset-1 ring-offset-[#EFEAE2] dark:ring-offset-[#0C1317]'
                            : 'ring-1 ring-slate-300 dark:ring-slate-700'
                        }`}
                        title={msg.senderName + (isSenderLeader ? ' (Délégué)' : '')}
                      />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`relative max-w-[85%] sm:max-w-md rounded-2xl px-3.5 py-2 shadow-xs transition-all ${
                      isMe
                        ? 'bg-[#234E70] text-white rounded-br-xs'
                        : 'bg-white dark:bg-[#1A2026] text-slate-900 dark:text-white rounded-bl-xs border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Sender Name for incoming messages */}
                    {!isMe && (
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="text-xs font-extrabold text-[#234E70] dark:text-sky-400 truncate">
                          {msg.senderName}
                        </span>
                        {isSenderLeader && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#234E70]/10 text-[#234E70] dark:bg-sky-950 dark:text-sky-300 border border-[#234E70]/20">
                            👑 Délégué
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quoted Message (Reply Preview) */}
                    {msg.replyTo && (
                      <div
                        onClick={() => scrollToMessage(msg.replyTo!.id)}
                        className={`mb-1.5 p-2 rounded-xl text-xs cursor-pointer border-l-4 transition-opacity hover:opacity-90 ${
                          isMe
                            ? 'bg-white/10 border-white text-white'
                            : 'bg-slate-100 dark:bg-slate-800 border-[#234E70] dark:border-sky-400 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <p className="font-bold text-[11px] opacity-90">{msg.replyTo.senderName}</p>
                        <p className="line-clamp-1 text-[11px] opacity-80">{msg.replyTo.text}</p>
                      </div>
                    )}

                    {/* Main content: Poll OR Text */}
                    {msg.type === 'poll' && msg.poll ? (
                      <div className="space-y-2.5 my-1">
                        <div className="flex items-center space-x-1.5 font-extrabold text-sm pb-1 border-b border-white/20 dark:border-slate-700">
                          <BarChart2 className="w-4 h-4 shrink-0" />
                          <span>{msg.poll.question}</span>
                        </div>

                        {/* Poll options list */}
                        <div className="space-y-1.5">
                          {(() => {
                            const totalVotes = Object.values(msg.poll.votes || {}).reduce((acc, userOpts) => acc + (Array.isArray(userOpts) ? userOpts.length : 0), 0) ||
                              msg.poll.options.reduce((acc, o) => acc + (o.voterIds?.length || 0), 0);

                            return msg.poll.options.map((opt) => {
                              const optVotes = Object.values(msg.poll!.votes || {}).filter(userOpts => Array.isArray(userOpts) && userOpts.includes(opt.id)).length +
                                (opt.voterIds?.length || 0);
                              const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                              const hasVoted = Boolean(currentUser && (msg.poll!.votes?.[currentUser.id]?.includes(opt.id) || opt.voterIds?.includes(currentUser.id)));

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleVotePoll(msg, opt.id)}
                                  className={`w-full text-left p-2 rounded-xl text-xs relative overflow-hidden transition-all border ${
                                    hasVoted
                                      ? isMe
                                        ? 'border-white bg-white/20 font-bold'
                                        : 'border-[#234E70] dark:border-sky-400 bg-sky-50/50 dark:bg-sky-950/40 font-bold'
                                      : isMe
                                      ? 'border-white/20 bg-white/10 hover:bg-white/15'
                                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100'
                                  }`}
                                >
                                  {/* Percentage bar background */}
                                  <div
                                    className={`absolute top-0 bottom-0 left-0 transition-all ${
                                      isMe ? 'bg-white/20' : 'bg-[#234E70]/15 dark:bg-sky-400/20'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />

                                  <div className="relative z-10 flex items-center justify-between gap-2">
                                    <span className="flex items-center space-x-1.5 truncate">
                                      {hasVoted && <Check className="w-3.5 h-3.5 shrink-0" />}
                                      <span className="truncate">{opt.text}</span>
                                    </span>
                                    <span className="shrink-0 text-[11px] font-semibold opacity-80">
                                      {optVotes} ({percent}%)
                                    </span>
                                  </div>
                                </button>
                              );
                            });
                          })()}
                        </div>

                        <div className="flex items-center justify-between text-[10px] opacity-75 pt-1">
                          <span>
                            {msg.poll.isMultipleChoice ? 'Choix multiple' : 'Choix unique'}
                          </span>
                          <span>
                            {Object.values(msg.poll.votes || {}).reduce((acc, userOpts) => acc + (Array.isArray(userOpts) ? userOpts.length : 0), 0) ||
                             msg.poll.options.reduce((acc, o) => acc + (o.voterIds?.length || 0), 0)} vote(s)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm whitespace-pre-line leading-relaxed break-words">
                        {renderMessageText(msg.text)}
                      </p>
                    )}

                    {/* Footer: Time + Pinned Indicator + Report Warning */}
                    <div className="flex items-center justify-end space-x-1.5 mt-1 text-[10px] opacity-75">
                      {msg.isPinned && (
                        <span title="Message épinglé">
                          <Pin className="w-3 h-3 rotate-45 text-amber-300 dark:text-amber-400" />
                        </span>
                      )}
                      <span>{formatMessageTime(msg.timestampMs)}</span>
                      {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                    </div>

                    {/* Report warning for delegates */}
                    {isLeader && msg.reports && msg.reports.length > 0 && (
                      <div className="mt-1.5 p-1.5 rounded-lg bg-rose-500/20 text-[#991B1B] dark:text-rose-300 text-[10px] font-bold flex items-center justify-between">
                        <span className="flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Signalé par {msg.reports.length} élève(s)
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveReportDetails(msg)}
                          className="underline ml-2"
                        >
                          Voir détails
                        </button>
                      </div>
                    )}

                    {/* Reaction Pills on Bubble Edge (Supports UID-indexed maps) */}
                    {(() => {
                      if (!msg.reactions) return null;
                      const counts: Record<string, number> = {};
                      const myReacted = new Set<string>();

                      for (const [key, val] of Object.entries(msg.reactions)) {
                        if (Array.isArray(val)) {
                          if (val.length > 0 && typeof val[0] === 'string' && val[0].length <= 8) {
                            // Map indexée par UID : key = userId, val = emojis[]
                            val.forEach(em => {
                              counts[em] = (counts[em] || 0) + 1;
                              if (currentUser && key === currentUser.id) myReacted.add(em);
                            });
                          } else {
                            // Ancienne structure : key = emoji, val = uids[]
                            const emoji = key;
                            counts[emoji] = (counts[emoji] || 0) + val.length;
                            if (currentUser && val.includes(currentUser.id)) myReacted.add(emoji);
                          }
                        }
                      }

                      const entries = Object.entries(counts);
                      if (entries.length === 0) return null;

                      return (
                        <div className="flex flex-wrap gap-1 mt-1.5 pt-1 border-t border-black/10 dark:border-white/10">
                          {entries.map(([emoji, count]) => {
                            const hasReacted = myReacted.has(emoji);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg, emoji)}
                                className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-xs transition-all ${
                                  hasReacted
                                    ? isMe
                                      ? 'bg-white/30 text-white font-bold'
                                      : 'bg-[#234E70]/15 dark:bg-sky-400/20 text-[#234E70] dark:text-sky-300 font-bold border border-[#234E70]/30'
                                    : isMe
                                    ? 'bg-white/15 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px]">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Hover Actions Toolbar */}
                  <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center space-x-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs p-1 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80">
                    
                    {/* Quick Reactions */}
                    <div className="flex items-center space-x-0.5 pr-1 border-r border-slate-200 dark:border-slate-700">
                      {COMMON_EMOJIS.slice(0, 3).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleToggleReaction(msg, emoji)}
                          className="hover:scale-125 transition-transform text-xs p-0.5"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Reply (citation) */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(msg);
                        inputRef.current?.focus();
                      }}
                      className="p-1 text-slate-500 hover:text-[#234E70] dark:text-slate-400 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Répondre (citation)"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>

                    {/* Copy text */}
                    <button
                      type="button"
                      onClick={() => handleCopyText(msg.text)}
                      className="p-1 text-slate-500 hover:text-[#234E70] dark:text-slate-400 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Copier le texte"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Pin message (Delegates only) */}
                    {isLeader && (
                      <button
                        type="button"
                        onClick={() => handleTogglePin(msg)}
                        className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          msg.isPinned
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-500 hover:text-[#234E70] dark:text-slate-400 dark:hover:text-sky-400'
                        }`}
                        title={msg.isPinned ? 'Désépingler' : 'Épingler ce message'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Report message (Members only for others' messages) */}
                    {!isMe && (
                      <button
                        type="button"
                        onClick={() => setReportingMessage(msg)}
                        className="p-1 text-slate-400 hover:text-[#991B1B] rounded-lg hover:bg-rose-50 dark:hover:bg-slate-700"
                        title="Signaler ce message"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete message (Delegates only) */}
                    {isLeader && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(msg)}
                        className="p-1 text-slate-400 hover:text-[#991B1B] rounded-lg hover:bg-rose-50 dark:hover:bg-slate-700"
                        title="Supprimer ce message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ==================================================== */}
      {/* REPLY-TO PREVIEW BAR (Above input) */}
      {/* ==================================================== */}
      {replyingTo && (
        <div className="bg-slate-100 dark:bg-slate-800/90 px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-2 min-w-0">
            <Reply className="w-4 h-4 text-[#234E70] dark:text-sky-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-[#234E70] dark:text-sky-400">
                Réponse à {replyingTo.senderName} :
              </span>
              <span className="text-slate-600 dark:text-slate-300 ml-1 truncate inline-block max-w-xs sm:max-w-md align-bottom">
                {replyingTo.text}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Emoji Bar */}
      {showEmojiPicker && (
        <div className="bg-white dark:bg-[#1A2026] px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-3 overflow-x-auto no-scrollbar">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                setInputText(prev => prev + emoji);
                inputRef.current?.focus();
              }}
              className="text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* WHATSAPP-LIKE BOTTOM INPUT BAR */}
      {/* ==================================================== */}
      <div className="bg-[#FAF8F5] dark:bg-[#1A2026] p-3 border-t border-slate-200 dark:border-slate-800 z-10 shrink-0">
        {chatError && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center justify-between">
            <span>{chatError}</span>
            <button type="button" onClick={() => setChatError(null)} className="ml-2 font-bold hover:opacity-80">×</button>
          </div>
        )}
        {isMuted ? (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center justify-center space-x-2 border border-rose-200 dark:border-rose-900">
            <VolumeX className="w-4 h-4 shrink-0" />
            <span>Vous avez été mis en sourdine par les délégués de la classe. Vous ne pouvez pas envoyer de message.</span>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="space-y-1">
            <div className="flex items-center space-x-2">
              {/* Emoji drawer toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 rounded-2xl transition-colors ${
                  showEmojiPicker
                    ? 'bg-[#234E70] text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Ajouter un emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Votre message (texte, emojis, liens)..."
                maxLength={2200}
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
              />

              {/* Character counter if long */}
              {inputText.length > 1800 && (
                <span className="text-[10px] font-bold text-slate-400">
                  {inputText.length}/2200
                </span>
              )}

              {/* Send button */}
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-2xl bg-[#234E70] hover:bg-[#1b3e59] text-white disabled:opacity-40 transition-transform active:scale-95 shadow-xs shrink-0"
                title="Envoyer le message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-0.5">
              <span>Texte, emojis et liens uniquement • Ni photos ni fichiers</span>
              <span>2 200 caractères max</span>
            </div>
          </form>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODALS */}
      {/* ==================================================== */}
      <PollCreatorModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onCreatePoll={handleCreatePoll}
      />

      {currentClass && (
        <ChatSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          currentClass={currentClass}
          members={members}
          onUpdateClassSettings={async (updates) => {
            await updateClassInfo(updates);
          }}
        />
      )}

      <ReportModal
        isOpen={Boolean(reportingMessage)}
        message={reportingMessage}
        onClose={() => setReportingMessage(null)}
        onSubmitReport={handleReportMessage}
      />

      {/* Report details inspector modal for delegates */}
      {activeReportDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-[#1A2026] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-[#991B1B] dark:text-rose-400 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Signalements ({activeReportDetails.reports?.length || 0})
              </h3>
              <button
                type="button"
                onClick={() => setActiveReportDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 italic p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
              « {activeReportDetails.text} »
            </p>

            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {activeReportDetails.reports?.map((rep, i) => (
                <div key={i} className="text-xs p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300">
                  <p className="font-semibold">{rep.reason}</p>
                  <p className="text-[10px] opacity-75">{rep.timestamp}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={async () => {
                  if (currentClass) {
                    await handleDeleteMessage(activeReportDetails);
                    setActiveReportDetails(null);
                  }
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#991B1B] text-white hover:bg-rose-800"
              >
                Supprimer le message
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
