import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, ClassInfo, Course, PersonalEvent, ClassInvitation, AuditLogItem, ActiveTab, UserRole, Homework, LessonSession } from '../types';
import { firestoreService } from '../services/firestoreService';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { parseFullIcsContent } from '../utils/icsParser';

interface AppContextType {
  currentUser: User | null;
  currentClass: ClassInfo | null;
  courses: Course[];
  personalEvents: PersonalEvent[];
  invitations: ClassInvitation[];
  members: User[];
  auditLogs: AuditLogItem[];
  homework: Homework[];
  lessonSessions: LessonSession[];
  availableGroups: string[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  isLoading: boolean;
  
  // Auth & Roles
  loginWithGoogle: (credential?: string) => Promise<void>;
  logout: () => void;
  isDelegate: boolean;
  isDeputy: boolean;
  isLeader: boolean;
  
  // Profile
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  updatePrivateNotes: (notes: string) => Promise<string>;
  getPrivateNotes: () => Promise<{ text: string; lastSaved: string }>;
  toggleHideCategory: (category: string) => Promise<void>;
  
  // Class Management
  createClass: (name: string, schoolName: string, academicYear?: string) => Promise<void>;
  joinClassWithInvite: (token: string) => Promise<{ success: boolean; message: string }>;
  promoteMember: (userId: string, newRole: UserRole) => Promise<{ success: boolean; message: string }>;
  removeMember: (userId: string) => Promise<{ success: boolean; message: string }>;
  
  // Invitations
  createInvitation: (email: string, roleTarget?: UserRole) => Promise<{ success: boolean; message: string; invitation?: ClassInvitation }>;
  revokeInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  
  // Timetable
  addCourse: (course: Partial<Course>) => Promise<void>;
  updateCourse: (courseId: string, updates: Partial<Course>) => Promise<void>;
  deleteCourse: (courseId: string) => Promise<void>;
  updateDelegateNote: (courseId: string, noteText: string) => Promise<void>;
  syncPronoteIcal: (customUrl?: string) => Promise<{ success: boolean; message: string; count?: number }>;
  importIcsData: (icsString: string) => Promise<{ count: number; homeworkCount: number; sessionCount: number }>;
  
  // Homework & Catchup
  toggleHomeworkDone: (homeworkId: string) => Promise<void>;
  updateHomeworkDelegate: (homeworkId: string, updates: { delegateNote?: string; estimatedTime?: string; links?: { title: string; url: string }[] }) => Promise<void>;
  
  // Personal Events
  addPersonalEvent: (event: Partial<PersonalEvent>) => Promise<void>;
  updatePersonalEvent: (eventId: string, updates: Partial<PersonalEvent>) => Promise<void>;
  deletePersonalEvent: (eventId: string) => Promise<void>;
  
  // Modals management
  activeModal: string | null;
  modalData: any;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
  
  // Onboarding
  showOnboarding: boolean;
  finishOnboarding: () => void;
  
  // RGPD & Backup
  exportUserData: () => Promise<void>;
  exportClassBackup: () => Promise<void>;
  importClassBackup: (backup: any) => Promise<{ success: boolean; count: number }>;
  deleteAccount: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentClass, setCurrentClass] = useState<ClassInfo | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEvent[]>([]);
  const [invitations, setInvitations] = useState<ClassInvitation[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('timetable');
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('klass_theme_mode') as 'light' | 'dark') || 'light';
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Sync theme
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('klass_theme_mode', themeMode);
  }, [themeMode]);

  const setThemeMode = (mode: 'light' | 'dark') => {
    setThemeModeState(mode);
  };

  const isDelegate = currentUser?.role === 'DELEGATE';
  const isDeputy = currentUser?.role === 'DEPUTY';
  const isLeader = isDelegate || isDeputy;

  const homework: Homework[] = currentClass?.homeworkList || [];
  const lessonSessions: LessonSession[] = currentClass?.lessonSessions || [];
  const availableGroups: string[] = currentClass?.availableGroups || [];

  const openModal = (modalName: string, data?: any) => {
    setActiveModal(modalName);
    setModalData(data || null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData(null);
  };

  const finishOnboarding = () => {
    if (currentUser) {
      localStorage.setItem(`klass_onboarding_seen_${currentUser.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  // Refresh all state directly from Cloud Firestore
  const refreshData = useCallback(async () => {
    if (!currentUser) return;

    try {
      if (currentUser.classId) {
        const [classDoc, coursesDocs, membersDocs, logsDocs, personalDocs] = await Promise.all([
          firestoreService.getClass(currentUser.classId),
          firestoreService.getCourses(currentUser.classId),
          firestoreService.getClassMembers(currentUser.classId),
          firestoreService.getAuditLogs(currentUser.classId),
          firestoreService.getPersonalEvents(currentUser.id)
        ]);

        if (classDoc) setCurrentClass(classDoc);
        if (coursesDocs) setCourses(coursesDocs);
        if (membersDocs) setMembers(membersDocs);
        if (logsDocs) setAuditLogs(logsDocs);
        if (personalDocs) setPersonalEvents(personalDocs);

        if (currentUser.role === 'DELEGATE' || currentUser.role === 'DEPUTY') {
          const invDocs = await firestoreService.getInvitations(currentUser.classId);
          if (invDocs) setInvitations(invDocs);
        }
      } else {
        const personalDocs = await firestoreService.getPersonalEvents(currentUser.id);
        if (personalDocs) setPersonalEvents(personalDocs);
      }
    } catch (err) {
      console.error('Error refreshing Firestore data:', err);
    }
  }, [currentUser]);

  // Initial load via Firebase Auth State Listener (100% Client-Side)
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          let user = await firestoreService.getUser(fbUser.uid);
          if (!user) {
            const nameParts = (fbUser.displayName || fbUser.email?.split('@')[0] || 'Élève').split(' ');
            const firstName = nameParts[0] || 'Élève';
            const lastName = nameParts.slice(1).join(' ') || '';

            const createdUser: User = {
              id: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Élève',
              firstName,
              lastName,
              avatarUrl: fbUser.photoURL || '',
              avatar: fbUser.photoURL || undefined,
              role: 'STUDENT',
              classId: null,
              showBirthdayToClass: false,
              themeColor: 'blue',
              hiddenCategories: [],
              hiddenCourseCategories: [],
              completedHomeworkIds: [],
              createdAt: new Date().toISOString()
            };
            await firestoreService.setUser(createdUser);
            user = createdUser;
          }

          if (user) {
            setCurrentUser(user);
            const hasSeen = localStorage.getItem(`klass_onboarding_seen_${user.id}`);
            if (!hasSeen) {
              setShowOnboarding(true);
            }
          }
        } else {
          setCurrentUser(null);
          setActiveModal('googleAuth');
        }
      } catch (err) {
        console.error('Failed to initialize user session:', err);
        setActiveModal('googleAuth');
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Whenever currentUser changes, load their data
  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  // Live polling every 15 seconds so all students stay synchronized
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      refreshData();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser, refreshData]);

  // Auth: Direct Firebase Authentication
  const loginWithGoogle = async (credentialOrToken?: string) => {
    setIsLoading(true);
    try {
      let fbUser: any = null;
      if (credentialOrToken && typeof credentialOrToken === 'string') {
        const fbCred = GoogleAuthProvider.credential(credentialOrToken);
        const result = await signInWithCredential(auth, fbCred);
        fbUser = result.user;
      } else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        fbUser = result.user;
      }

      if (!fbUser) throw new Error('Impossible d\'obtenir le compte Google');

      let user = await firestoreService.getUser(fbUser.uid);
      if (!user) {
        const nameParts = (fbUser.displayName || fbUser.email?.split('@')[0] || 'Élève').split(' ');
        const firstName = nameParts[0] || 'Élève';
        const lastName = nameParts.slice(1).join(' ') || '';

        const createdUser: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Élève',
          firstName,
          lastName,
          avatarUrl: fbUser.photoURL || '',
          avatar: fbUser.photoURL || undefined,
          role: 'STUDENT',
          classId: null,
          showBirthdayToClass: false,
          themeColor: 'blue',
          hiddenCategories: [],
          hiddenCourseCategories: [],
          completedHomeworkIds: [],
          createdAt: new Date().toISOString()
        };
        await firestoreService.setUser(createdUser);
        user = createdUser;
      }

      if (user) {
        setCurrentUser(user);
        closeModal();

        if (!user.classId) {
          openModal('classCreationJoin');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem('klass_auth_user_id');
    setCurrentUser(null);
    setCurrentClass(null);
    setCourses([]);
    setPersonalEvents([]);
    setInvitations([]);
    setMembers([]);
    openModal('googleAuth');
  };

  // Profile
  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    await firestoreService.updateUser(currentUser.id, updates);
    setCurrentUser({ ...currentUser, ...updates });
  };

  const updatePrivateNotes = async (notes: string): Promise<string> => {
    if (!currentUser) return '';
    return 'Enregistré à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getPrivateNotes = async () => {
    return { text: '', lastSaved: '' };
  };

  const toggleHideCategory = async (category: string) => {
    if (!currentUser) return;
    const currentList: string[] = currentUser.hiddenCategories || currentUser.hiddenCourseCategories || [];
    const exists = currentList.includes(category);
    const updatedList = exists
      ? currentList.filter((c: string) => c !== category)
      : [...currentList, category];

    await updateUserProfile({ hiddenCategories: updatedList, hiddenCourseCategories: updatedList });
  };

  // Class Management (Direct Firestore)
  const createClass = async (name: string, schoolName: string, academicYear?: string) => {
    if (!currentUser) return;
    const newClassId = 'c_' + Math.random().toString(36).substring(2, 9);
    const newClass: ClassInfo = {
      id: newClassId,
      name,
      schoolName,
      academicYear: academicYear || '2026-2027',
      delegateIds: [currentUser.id],
      deputyIds: [],
      homeworkList: [],
      lessonSessions: [],
      availableGroups: []
    };

    await firestoreService.createClass(newClass, currentUser);
    await firestoreService.addAuditLog(newClassId, {
      id: 'log_' + Date.now(),
      classId: newClassId,
      authorName: currentUser.name,
      authorRole: 'Délégué(e) titulaire',
      action: 'Création de la classe',
      details: `Création de l'espace "${newClass.name}" au ${newClass.schoolName}`,
      timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });

    setCurrentClass(newClass);
    setCurrentUser({
      ...currentUser,
      classId: newClassId,
      role: 'DELEGATE'
    });
    closeModal();
    await refreshData();
  };

  const joinClassWithInvite = async (token: string) => {
    if (!currentUser) return { success: false, message: 'Veuillez vous connecter avec Google.' };
    try {
      const res = await firestoreService.joinClassWithInvitationToken(token, currentUser);
      setCurrentClass(res.classInfo);
      setCurrentUser(res.updatedUser);
      closeModal();
      await refreshData();
      return { success: true, message: `Félicitations ! Vous avez rejoint "${res.classInfo.name}" avec succès.` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Impossible de rejoindre la classe.' };
    }
  };

  const promoteMember = async (userId: string, newRole: UserRole) => {
    if (!currentUser?.classId) return { success: false, message: 'Aucune classe active' };
    try {
      await firestoreService.updateUser(userId, { role: newRole });
      await firestoreService.addAuditLog(currentUser.classId, {
        id: 'log_' + Date.now(),
        classId: currentUser.classId,
        authorName: currentUser.name,
        authorRole: 'Délégué(e) titulaire',
        action: 'Changement de rôle',
        details: `Attribution du rôle ${newRole === 'DELEGATE' ? 'Délégué titulaire' : newRole === 'DEPUTY' ? 'Suppléant' : 'Élève'}`,
        timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      await refreshData();
      const roleFr = newRole === 'DELEGATE' ? 'Délégué titulaire' : newRole === 'DEPUTY' ? 'Suppléant' : 'Élève';
      return { success: true, message: `Rôle mis à jour (${roleFr}).` };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur lors de la modification du rôle.' };
    }
  };

  const removeMember = async (userId: string) => {
    if (!currentUser?.classId) return { success: false, message: 'Aucune classe active' };
    try {
      await firestoreService.updateUser(userId, { classId: undefined, role: 'STUDENT' });
      await firestoreService.addAuditLog(currentUser.classId, {
        id: 'log_' + Date.now(),
        classId: currentUser.classId,
        authorName: currentUser.name,
        authorRole: 'Délégué(e) titulaire',
        action: 'Exclusion de classe',
        details: 'Un membre a été retiré de la classe',
        timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      await refreshData();
      return { success: true, message: 'Membre retiré de la classe avec succès.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur lors de l\'exclusion.' };
    }
  };

  // Invitations (Direct Firestore)
  const createInvitation = async (email: string, roleTarget?: UserRole) => {
    if (!currentUser?.classId) return { success: false, message: 'Aucune classe active' };
    const invId = 'inv_' + Math.random().toString(36).substring(2, 8);
    const code = `KLASS-${currentUser.classId}-${invId}`;
    const newInv: ClassInvitation = {
      id: invId,
      classId: currentUser.classId,
      email,
      roleTarget: roleTarget || 'STUDENT',
      token: code,
      code,
      invitedBy: currentUser.name,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    };

    try {
      await firestoreService.createInvitation(currentUser.classId, newInv);
      await firestoreService.addAuditLog(currentUser.classId, {
        id: 'log_' + Date.now(),
        classId: currentUser.classId,
        authorName: currentUser.name,
        authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
        action: 'Invitation émise',
        details: `Code généré pour ${email} (${roleTarget === 'DEPUTY' ? 'Suppléant' : 'Élève'})`,
        timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
      await refreshData();
      return { success: true, message: `Invitation créée pour ${email}.`, invitation: newInv };
    } catch (err: any) {
      return { success: false, message: err.message || 'Erreur d\'invitation.' };
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    if (!currentUser?.classId) return;
    await firestoreService.deleteInvitation(currentUser.classId, invitationId);
    await refreshData();
  };

  const resendInvitation = async (invitationId: string) => {
    await refreshData();
  };

  // Timetable
  const addCourse = async (courseData: Partial<Course>) => {
    if (!currentUser?.classId) return;
    const courseId = 'c_' + Math.random().toString(36).substring(2, 9);
    const course: Course = {
      id: courseId,
      classId: currentUser.classId,
      subject: courseData.subject || 'Cours',
      category: courseData.category || 'Tronc commun',
      group: courseData.group,
      teacher: courseData.teacher || 'Professeur',
      room: courseData.room || 'Salle à définir',
      dayOfWeek: courseData.dayOfWeek || 1,
      startTime: courseData.startTime || '08:00',
      endTime: courseData.endTime || '09:00',
      color: courseData.color || '#234E70',
      isCancelled: courseData.isCancelled || false,
      cancelReason: courseData.cancelReason,
      isModified: courseData.isModified || false,
      modifiedReason: courseData.modifiedReason,
      statusType: courseData.statusType || 'normal',
      statusLabel: courseData.statusLabel
    };

    await firestoreService.setCourse(currentUser.classId, course);
    await firestoreService.addAuditLog(currentUser.classId, {
      id: 'log_' + Date.now(),
      classId: currentUser.classId,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
      action: 'Ajout de cours',
      details: `Ajout du cours "${course.subject}" (${course.startTime}-${course.endTime})`,
      timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    await refreshData();
  };

  const updateCourse = async (courseId: string, updates: Partial<Course>) => {
    if (!currentUser?.classId) return;
    await firestoreService.updateCourse(currentUser.classId, courseId, updates);
    await firestoreService.addAuditLog(currentUser.classId, {
      id: 'log_' + Date.now(),
      classId: currentUser.classId,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
      action: 'Modification de cours',
      details: `Mise à jour du cours "${updates.subject || courseId}"`,
      timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    await refreshData();
  };

  const deleteCourse = async (courseId: string) => {
    if (!currentUser?.classId) return;
    const toDelete = courses.find(c => c.id === courseId);
    await firestoreService.deleteCourse(currentUser.classId, courseId);
    if (toDelete) {
      await firestoreService.addAuditLog(currentUser.classId, {
        id: 'log_' + Date.now(),
        classId: currentUser.classId,
        authorName: currentUser.name,
        authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
        action: 'Suppression de cours',
        details: `Suppression du cours "${toDelete.subject}"`,
        timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });
    }
    await refreshData();
  };

  const updateDelegateNote = async (courseId: string, noteText: string) => {
    if (!currentUser?.classId) return;
    const course = courses.find(c => c.id === courseId);
    const note = {
      id: 'n_' + Date.now(),
      courseId,
      text: noteText,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
      updatedAt: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    await firestoreService.updateCourse(currentUser.classId, courseId, { delegateNote: note });
    await firestoreService.addAuditLog(currentUser.classId, {
      id: 'log_' + Date.now(),
      classId: currentUser.classId,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
      action: 'Note délégué',
      details: `Note mise à jour sur le cours "${course?.subject || 'Cours'}"`,
      timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });
    await refreshData();
  };

  // Synchronisation Pronote automatique sécurisée via Worker Cloudflare /api/pronote
  const syncPronoteIcal = async (customUrl?: string): Promise<{ success: boolean; message: string; count?: number }> => {
    if (!currentClass || !currentUser) {
      return { success: false, message: 'Aucune classe active' };
    }

    try {
      let parsedCourses: Course[] = [];
      let parsedHomework: Homework[] = [];
      let parsedSessions: LessonSession[] = [];
      let parsedGroups: string[] = [];

      if (customUrl && customUrl.startsWith('http')) {
        const res = await fetch(customUrl);
        if (!res.ok) throw new Error(`Code HTTP ${res.status}`);
        const icsText = await res.text();
        if (!icsText || !icsText.includes('BEGIN:VCALENDAR')) {
          throw new Error('Le flux retourné ne contient pas de données iCalendar valides.');
        }
        const localParsed = parseFullIcsContent(icsText, currentClass.id);
        parsedCourses = localParsed.courses;
        parsedHomework = localParsed.homework;
        parsedSessions = localParsed.sessions;
        parsedGroups = localParsed.availableGroups;
      } else {
        // Exige un jeton d'identité Firebase valide (Authorization: Bearer)
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          throw new Error('Vous devez être authentifié avec votre compte Google pour synchroniser.');
        }

        const res = await fetch(`/api/pronote?classId=${encodeURIComponent(currentClass.id)}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Accept': 'application/json'
          }
        });

        const data: any = await res.json().catch(() => null);

        if (!res.ok || !data) {
          throw new Error(data?.error || `Erreur serveur (${res.status}) lors de la synchronisation.`);
        }

        if (!data.success) {
          throw new Error(data.error || 'Erreur lors de la synchronisation.');
        }

        parsedCourses = data.courses || [];
        parsedHomework = data.homework || [];
        parsedSessions = data.sessions || [];
        parsedGroups = data.availableGroups || [];
      }

      // Save sanitized courses to Firestore subcollection
      await firestoreService.batchReplaceCourses(currentClass.id, parsedCourses);

      // Formatted Paris time
      const nowParis = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());

      const syncTimestamp = `Aujourd'hui à ${nowParis}`;

      // Update class doc with homework, sessions, and available groups
      await firestoreService.updateClass(currentClass.id, {
        homeworkList: parsedHomework,
        lessonSessions: parsedSessions,
        availableGroups: parsedGroups,
        pronoteLastSynced: syncTimestamp,
        pronoteSyncStatus: 'success'
      });

      await firestoreService.addAuditLog(currentClass.id, {
        id: 'log_' + Date.now(),
        classId: currentClass.id,
        authorName: currentUser.name,
        authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
        action: 'Synchronisation Pronote',
        details: `${parsedCourses.length} cours, ${parsedHomework.length} devoirs et ${parsedSessions.length} séances synchronisés`,
        timestamp: syncTimestamp
      });

      await refreshData();
      return {
        success: true,
        message: `Synchronisation réussie : ${parsedCourses.length} cours, ${parsedHomework.length} devoirs et ${parsedSessions.length} séances mis à jour.`,
        count: parsedCourses.length
      };
    } catch (err: any) {
      console.error('Pronote sync failed:', err);
      return {
        success: false,
        message: err.message || 'Impossible de joindre Pronote.'
      };
    }
  };

  const importIcsData = async (icsString: string): Promise<{ count: number; homeworkCount: number; sessionCount: number }> => {
    if (!currentClass || !currentUser) throw new Error('Aucune classe active');
    const parsed = parseFullIcsContent(icsString, currentClass.id);

    await firestoreService.batchReplaceCourses(currentClass.id, parsed.courses);

    const nowParis = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());

    const syncTimestamp = `Aujourd'hui à ${nowParis}`;

    await firestoreService.updateClass(currentClass.id, {
      homeworkList: parsed.homework,
      lessonSessions: parsed.sessions,
      availableGroups: parsed.availableGroups,
      pronoteLastSynced: syncTimestamp,
      pronoteSyncStatus: 'success'
    });

    await firestoreService.addAuditLog(currentClass.id, {
      id: 'log_' + Date.now(),
      classId: currentClass.id,
      authorName: currentUser.name,
      authorRole: currentUser.role === 'DELEGATE' ? 'Délégué(e) titulaire' : 'Suppléant(e)',
      action: 'Import fichier .ics Pronote',
      details: `${parsed.courses.length} cours, ${parsed.homework.length} devoirs, ${parsed.sessions.length} séances importés depuis un fichier .ics`,
      timestamp: syncTimestamp
    });

    await refreshData();
    return {
      count: parsed.courses.length,
      homeworkCount: parsed.homework.length,
      sessionCount: parsed.sessions.length
    };
  };

  // Homework check/uncheck
  const toggleHomeworkDone = async (homeworkId: string) => {
    if (!currentUser) return;
    const currentCompleted = currentUser.completedHomeworkIds || [];
    const isDone = currentCompleted.includes(homeworkId);
    const updated = isDone
      ? currentCompleted.filter(id => id !== homeworkId)
      : [...currentCompleted, homeworkId];

    await firestoreService.updateUser(currentUser.id, {
      completedHomeworkIds: updated
    });
    setCurrentUser({
      ...currentUser,
      completedHomeworkIds: updated
    });
  };

  const updateHomeworkDelegate = async (
    homeworkId: string,
    updates: { delegateNote?: string; estimatedTime?: string; links?: { title: string; url: string }[] }
  ) => {
    if (!currentClass || !currentUser) return;
    const currentList = currentClass.homeworkList || [];
    const updatedList = currentList.map(hw => {
      if (hw.id === homeworkId) {
        return {
          ...hw,
          ...updates
        };
      }
      return hw;
    });

    await firestoreService.updateClass(currentClass.id, {
      homeworkList: updatedList
    });
    setCurrentClass({
      ...currentClass,
      homeworkList: updatedList
    });
  };

  // Personal Events
  const addPersonalEvent = async (eventData: Partial<PersonalEvent>) => {
    if (!currentUser) return;
    const eventId = 'pe_' + Math.random().toString(36).substring(2, 9);
    const event: PersonalEvent = {
      id: eventId,
      userId: currentUser.id,
      title: eventData.title || 'Événement',
      notes: eventData.notes || eventData.description,
      description: eventData.description,
      date: eventData.date || new Date().toISOString().slice(0, 10),
      startTime: eventData.startTime || '12:00',
      endTime: eventData.endTime || '13:00',
      category: eventData.category || 'Personnel',
      color: eventData.color || '#234E70',
      reminder: typeof eventData.reminder === 'string' ? eventData.reminder : 'none',
      createdAt: new Date().toISOString()
    };
    await firestoreService.addPersonalEvent(currentUser.id, event);
    await refreshData();
  };

  const updatePersonalEvent = async (eventId: string, updates: Partial<PersonalEvent>) => {
    if (!currentUser) return;
    await firestoreService.updatePersonalEvent(currentUser.id, eventId, updates);
    await refreshData();
  };

  const deletePersonalEvent = async (eventId: string) => {
    if (!currentUser) return;
    await firestoreService.deletePersonalEvent(currentUser.id, eventId);
    await refreshData();
  };

  // RGPD & Backup
  const exportUserData = async () => {
    if (!currentUser) return;
    const personal = await firestoreService.getPersonalEvents(currentUser.id);
    const data = {
      user: currentUser,
      personalEvents: personal,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `klass_donnees_${currentUser.firstName.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportClassBackup = async () => {
    if (!currentUser || !currentClass) return;
    const data = await firestoreService.exportClassBackup(currentClass.id, currentUser.email);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sauvegarde-klass-${encodeURIComponent(currentClass.name.toLowerCase().replace(/\s+/g, '-'))}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importClassBackup = async (backup: any) => {
    if (!currentClass || !currentUser) throw new Error('Aucune classe active');
    const count = await firestoreService.importClassBackup(currentClass.id, backup, currentUser.name);
    await refreshData();
    return { success: true, count };
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    const ok = window.confirm(`Supprimer définitivement votre compte (${currentUser.email}) ? Vos données personnelles seront effacées de Firestore.`);
    if (!ok) return;

    await firestoreService.deleteUser(currentUser.id);
    await logout();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentClass,
        courses,
        personalEvents,
        invitations,
        members,
        auditLogs,
        homework,
        lessonSessions,
        availableGroups,
        activeTab,
        setActiveTab,
        themeMode,
        setThemeMode,
        isLoading,
        loginWithGoogle,
        logout,
        isDelegate,
        isDeputy,
        isLeader,
        updateUserProfile,
        updatePrivateNotes,
        getPrivateNotes,
        toggleHideCategory,
        createClass,
        joinClassWithInvite,
        promoteMember,
        removeMember,
        createInvitation,
        revokeInvitation,
        resendInvitation,
        addCourse,
        updateCourse,
        deleteCourse,
        updateDelegateNote,
        syncPronoteIcal,
        importIcsData,
        toggleHomeworkDone,
        updateHomeworkDelegate,
        addPersonalEvent,
        updatePersonalEvent,
        deletePersonalEvent,
        activeModal,
        modalData,
        openModal,
        closeModal,
        showOnboarding,
        finishOnboarding,
        exportUserData,
        exportClassBackup,
        importClassBackup,
        deleteAccount,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
