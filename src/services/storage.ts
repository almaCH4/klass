import { User, ClassInfo, Course, PersonalEvent, ClassInvitation, AuditLogItem } from '../types';

const STORAGE_KEYS = {
  USERS: 'klass_users_v1',
  CURRENT_USER_ID: 'klass_current_user_id_v1',
  CLASSES: 'klass_classes_v1',
  ACTIVE_CLASS_ID: 'klass_active_class_id_v1',
  COURSES: 'klass_courses_v1',
  PERSONAL_EVENTS: 'klass_personal_events_v1',
  INVITATIONS: 'klass_invitations_v1',
  AUDIT_LOGS: 'klass_audit_logs_v1',
  ONBOARDING_SEEN: 'klass_onboarding_seen_v1',
  THEME_MODE: 'klass_theme_mode_v1'
};

export const INITIAL_DEMO_USERS: User[] = [
  {
    id: 'user_lea_martin',
    email: 'lea.martin@lycee-victorhugo.fr',
    name: 'Léa Martin',
    firstName: 'Léa',
    lastName: 'Martin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    role: 'DELEGATE', // Déléguée titulaire
    classId: 'class_term_3',
    birthday: '2008-04-18',
    showBirthdayToClass: true,
    themeColor: 'blue',
    hiddenCourseCategories: [],
    privateNotes: "Mes objectifs du trimestre :\n- Finir la fiche de révision de Philo sur la liberté\n- Préparer les points à aborder au conseil de classe (climatisation salle 204, dates des devoirs surveillés)\n- Rendez-vous délégués vendredi à 13h avec la CPE",
    privateNotesLastSaved: 'Aujourd\'hui à 10:48'
  },
  {
    id: 'user_thomas_dubois',
    email: 'thomas.dubois@lycee-victorhugo.fr',
    name: 'Thomas Dubois',
    firstName: 'Thomas',
    lastName: 'Dubois',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
    role: 'DEPUTY', // Délégué suppléant
    classId: 'class_term_3',
    birthday: '2008-11-25',
    showBirthdayToClass: false,
    themeColor: 'cyan',
    hiddenCourseCategories: ['Option facultative'],
    privateNotes: "Notes pour le voyage scolaire en Italie :\n- Relancer M. Fontaine pour les accords parentaux\n- Liste des allergies alimentaires",
    privateNotesLastSaved: 'Hier à 17:15'
  },
  {
    id: 'user_camille_bernard',
    email: 'camille.bernard@lycee-victorhugo.fr',
    name: 'Camille Bernard',
    firstName: 'Camille',
    lastName: 'Bernard',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    role: 'STUDENT', // Élève
    classId: 'class_term_3',
    birthday: '2008-07-09',
    showBirthdayToClass: true,
    themeColor: 'purple',
    hiddenCourseCategories: ['Spé NSI', 'Option LV2'],
    privateNotes: "- Relire le cours de maths sur les limites de suites\n- Penser à rendre le livre au CDI avant mardi prochain\n- Demander à Léa si elle a la correction du TP d'hier",
    privateNotesLastSaved: 'Aujourd\'hui à 09:30'
  },
  {
    id: 'user_lucas_petit',
    email: 'lucas.petit@lycee-victorhugo.fr',
    name: 'Lucas Petit',
    firstName: 'Lucas',
    lastName: 'Petit',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    role: 'STUDENT',
    classId: 'class_term_3',
    birthday: '2008-01-14',
    showBirthdayToClass: true,
    themeColor: 'emerald',
    hiddenCourseCategories: [],
    privateNotes: ""
  }
];

export const INITIAL_DEMO_CLASS: ClassInfo = {
  id: 'class_term_3',
  name: 'Terminale 3 - Spé Maths / SVT / SES',
  schoolName: 'Lycée Victor Hugo',
  academicYear: '2026-2027',
  delegateIds: ['user_lea_martin'],
  deputyIds: ['user_thomas_dubois'],
  pronoteIcalUrl: 'webcal://pronote.ac-paris.fr/ical/0750654e/Eleves/export_term3_auth_token_98f98c.ics',
  pronoteLastSynced: 'Aujourd\'hui à 10:45',
  pronoteSyncStatus: 'success'
};

export const INITIAL_DEMO_COURSES: Course[] = [
  // Lundi (1)
  {
    id: 'c_lun_1',
    classId: 'class_term_3',
    subject: 'Philosophie',
    category: 'Tronc commun',
    teacher: 'Mme Lambert',
    room: 'Salle 204',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '10:00',
    color: '#8b5cf6',
    delegateNote: {
      authorName: 'Léa Martin',
      authorRole: 'Déléguée',
      text: '📌 Pensez à apporter le polycopié sur l\'Allégorie de la Caverne de Platon !',
      updatedAt: '01/10 à 18:20'
    }
  },
  {
    id: 'c_lun_2',
    classId: 'class_term_3',
    subject: 'Spécialité Mathématiques',
    category: 'Spécialité',
    teacher: 'M. Durand',
    room: 'Salle 302',
    dayOfWeek: 1,
    startTime: '10:15',
    endTime: '12:15',
    color: '#3b82f6'
  },
  {
    id: 'c_lun_3',
    classId: 'class_term_3',
    subject: 'Histoire-Géographie',
    category: 'Tronc commun',
    teacher: 'M. Fontaine',
    room: 'Salle 112',
    dayOfWeek: 1,
    startTime: '13:30',
    endTime: '15:30',
    color: '#f59e0b'
  },
  {
    id: 'c_lun_4',
    classId: 'class_term_3',
    subject: 'Anglais LV1',
    category: 'Tronc commun',
    teacher: 'Mme Evans',
    room: 'Salle Langues 2',
    dayOfWeek: 1,
    startTime: '15:45',
    endTime: '17:45',
    color: '#ef4444'
  },

  // Mardi (2)
  {
    id: 'c_mar_1',
    classId: 'class_term_3',
    subject: 'Spécialité SVT',
    category: 'Spécialité',
    teacher: 'Mme Caron',
    room: 'Labo SVT 1',
    dayOfWeek: 2,
    startTime: '08:00',
    endTime: '10:00',
    color: '#10b981'
  },
  {
    id: 'c_mar_2',
    classId: 'class_term_3',
    subject: 'Physique-Chimie',
    category: 'Spécialité',
    teacher: 'M. Mercier',
    room: 'Labo Physique 3',
    dayOfWeek: 2,
    startTime: '10:15',
    endTime: '12:15',
    color: '#06b6d4',
    isCancelled: true,
    cancelReason: 'Professeur absent (Formation académique) - Salle d\'étude autonome ouverte'
  },
  {
    id: 'c_mar_3',
    classId: 'class_term_3',
    subject: 'Français & Littérature',
    category: 'Tronc commun',
    teacher: 'Mme Rousseau',
    room: 'Salle 208',
    dayOfWeek: 2,
    startTime: '13:30',
    endTime: '15:30',
    color: '#a855f7'
  },
  {
    id: 'c_mar_4',
    classId: 'class_term_3',
    subject: 'EMC (Éducation Civique)',
    category: 'Tronc commun',
    teacher: 'M. Fontaine',
    room: 'Salle 112',
    dayOfWeek: 2,
    startTime: '15:45',
    endTime: '16:45',
    color: '#84cc16'
  },

  // Mercredi (3)
  {
    id: 'c_mer_1',
    classId: 'class_term_3',
    subject: 'Spécialité Mathématiques',
    category: 'Spécialité',
    teacher: 'M. Durand',
    room: 'Salle 302',
    dayOfWeek: 3,
    startTime: '08:00',
    endTime: '10:00',
    color: '#3b82f6',
    delegateNote: {
      authorName: 'Léa Martin',
      authorRole: 'Déléguée',
      text: '⚠️ Interro flash de 20 minutes sur le produit scalaire annoncée au dernier cours !',
      updatedAt: '02/10 à 08:05'
    }
  },
  {
    id: 'c_mer_2',
    classId: 'class_term_3',
    subject: 'Allemand LV2 / Espagnol LV2',
    category: 'Option LV2',
    teacher: 'Mme Becker / M. Lopez',
    room: 'Salle 105',
    dayOfWeek: 3,
    startTime: '10:15',
    endTime: '12:15',
    color: '#64748b'
  },

  // Jeudi (4)
  {
    id: 'c_jeu_1',
    classId: 'class_term_3',
    subject: 'EPS (Course d\'orientation)',
    category: 'Tronc commun',
    teacher: 'M. Martinez',
    room: 'Gymnase / Extérieur',
    dayOfWeek: 4,
    startTime: '08:00',
    endTime: '10:00',
    color: '#14b8a6',
    delegateNote: {
      authorName: 'Thomas Dubois',
      authorRole: 'Suppléant',
      text: '👟 Prévoir tenue de sport d\'extérieur chaude et chaussures propres obligatoires.',
      updatedAt: '01/10 à 19:30'
    }
  },
  {
    id: 'c_jeu_2',
    classId: 'class_term_3',
    subject: 'Philosophie',
    category: 'Tronc commun',
    teacher: 'Mme Lambert',
    room: 'Salle 204',
    dayOfWeek: 4,
    startTime: '10:15',
    endTime: '12:15',
    color: '#8b5cf6'
  },
  {
    id: 'c_jeu_3',
    classId: 'class_term_3',
    subject: 'Spécialité NSI',
    category: 'Spé NSI',
    teacher: 'M. Chen',
    room: 'Salle Info 2',
    originalRoom: 'Salle Info 4',
    dayOfWeek: 4,
    startTime: '13:30',
    endTime: '15:30',
    color: '#6366f1',
    isModified: true,
    modifiedReason: 'Changement de salle : vidéoprojecteur en panne en Salle 4, cours déplacé en Salle Info 2'
  },
  {
    id: 'c_jeu_4',
    classId: 'class_term_3',
    subject: 'SES (Sciences Éco & Sociales)',
    category: 'Tronc commun',
    teacher: 'Mme Girard',
    room: 'Salle 215',
    dayOfWeek: 4,
    startTime: '15:45',
    endTime: '17:45',
    color: '#ec4899'
  },

  // Vendredi (5)
  {
    id: 'c_ven_1',
    classId: 'class_term_3',
    subject: 'Histoire-Géo / HGGSP',
    category: 'Option HGGSP',
    teacher: 'M. Fontaine',
    room: 'Salle 112',
    dayOfWeek: 5,
    startTime: '08:00',
    endTime: '10:00',
    color: '#d97706'
  },
  {
    id: 'c_ven_2',
    classId: 'class_term_3',
    subject: 'Spécialité Mathématiques',
    category: 'Spécialité',
    teacher: 'M. Durand',
    room: 'Salle 302',
    dayOfWeek: 5,
    startTime: '10:15',
    endTime: '12:15',
    color: '#3b82f6',
    delegateNote: {
      authorName: 'Léa Martin',
      authorRole: 'Déléguée',
      text: '📥 Ramassage du Devoir Maison n°2 au début de l\'heure !',
      updatedAt: '30/09 à 21:00'
    }
  },
  {
    id: 'c_ven_3',
    classId: 'class_term_3',
    subject: 'Anglais LV1',
    category: 'Tronc commun',
    teacher: 'Mme Evans',
    room: 'Salle Langues 2',
    dayOfWeek: 5,
    startTime: '13:30',
    endTime: '15:30',
    color: '#ef4444'
  },
  {
    id: 'c_ven_4',
    classId: 'class_term_3',
    subject: 'Heure de Vie de Classe',
    category: 'Vie de classe',
    teacher: 'Léa & Thomas (Délégués) / M. Fontaine',
    room: 'Salle 204',
    dayOfWeek: 5,
    startTime: '15:45',
    endTime: '16:45',
    color: '#2563eb',
    delegateNote: {
      authorName: 'Léa Martin',
      authorRole: 'Déléguée',
      text: '🗳️ Ordre du jour : élection de la commission foyer et organisation de la photo de classe.',
      updatedAt: '02/10 à 07:30'
    }
  }
];

export const INITIAL_DEMO_PERSONAL_EVENTS: PersonalEvent[] = [
  {
    id: 'pe_1',
    userId: 'user_camille_bernard',
    title: 'Rendez-vous dentiste (Dr Valette)',
    date: '2026-10-07', // Mercredi
    startTime: '14:30',
    endTime: '15:30',
    color: '#10b981',
    reminder: '1h',
    notes: 'Penser à la carte vitale et au carnet de santé'
  },
  {
    id: 'pe_2',
    userId: 'user_camille_bernard',
    title: 'Entraînement de Tennis au club',
    date: '2026-10-08', // Jeudi
    startTime: '18:15',
    endTime: '19:45',
    color: '#f59e0b',
    reminder: '15min',
    notes: 'Tournoi amical inter-lycées le week-end prochain'
  },
  {
    id: 'pe_3',
    userId: 'user_camille_bernard',
    title: 'Révision bac blanc avec Hugo au CDI',
    date: '2026-10-09', // Vendredi
    startTime: '17:00',
    endTime: '18:30',
    color: '#8b5cf6',
    reminder: '1h',
    notes: 'Exercices annales de probabilités et suites'
  },
  {
    id: 'pe_4',
    userId: 'user_lea_martin',
    title: 'Entretien Délégués avec la Proviseure adjointe',
    date: '2026-10-06',
    startTime: '13:00',
    endTime: '13:30',
    color: '#2563eb',
    reminder: '15min',
    notes: 'Bilan sur les retards de cantine et les casiers de sport'
  }
];

export const INITIAL_DEMO_INVITATIONS: ClassInvitation[] = [
  {
    id: 'inv_1',
    classId: 'class_term_3',
    email: 'sarah.benali@lycee-victorhugo.fr',
    roleTarget: 'STUDENT',
    token: 'tok_sarah_9f82bc4e',
    invitedBy: 'Léa Martin',
    createdAt: '2026-09-30T14:20:00Z',
    status: 'PENDING'
  },
  {
    id: 'inv_2',
    classId: 'class_term_3',
    email: 'lucas.petit@lycee-victorhugo.fr',
    roleTarget: 'STUDENT',
    token: 'tok_lucas_1180da34',
    invitedBy: 'Léa Martin',
    createdAt: '2026-10-01T09:12:00Z',
    status: 'ACCEPTED',
    acceptedAt: '2026-10-01T10:04:00Z'
  },
  {
    id: 'inv_3',
    classId: 'class_term_3',
    email: 'antoine.moreau@lycee-victorhugo.fr',
    roleTarget: 'STUDENT',
    token: 'tok_antoine_7b66df91',
    invitedBy: 'Léa Martin',
    createdAt: '2026-10-02T08:15:00Z',
    status: 'PENDING'
  }
];

export const INITIAL_DEMO_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log_1',
    classId: 'class_term_3',
    authorName: 'Léa Martin',
    authorRole: 'Déléguée titulaire',
    action: 'Mise à jour d\'une note de cours',
    details: 'Ajout de la consigne sur le cours de Philosophie (Platon)',
    timestamp: 'Hier à 18:20'
  },
  {
    id: 'log_2',
    classId: 'class_term_3',
    authorName: 'Léa Martin',
    authorRole: 'Déléguée titulaire',
    action: 'Synchronisation Pronote',
    details: 'Mise à jour de l\'emploi du temps via iCal (22 cours synchronisés)',
    timestamp: 'Aujourd\'hui à 10:45'
  },
  {
    id: 'log_3',
    classId: 'class_term_3',
    authorName: 'Thomas Dubois',
    authorRole: 'Délégué suppléant',
    action: 'Mise à jour d\'une note de cours',
    details: 'Ajout de la consigne tenue de sport pour le cours d\'EPS',
    timestamp: 'Hier à 19:30'
  },
  {
    id: 'log_4',
    classId: 'class_term_3',
    authorName: 'Léa Martin',
    authorRole: 'Déléguée titulaire',
    action: 'Envoi d\'invitations',
    details: 'Génération de liens d\'invitation pour 3 élèves',
    timestamp: 'Hier à 09:15'
  }
];

class StorageService {
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      this.saveUsers(INITIAL_DEMO_USERS);
      return INITIAL_DEMO_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEMO_USERS;
    }
  }

  saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUserId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!id) {
      // Default to Léa Martin (Déléguée titulaire) so the user experiences the full suite right away!
      const defaultId = 'user_lea_martin';
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, defaultId);
      return defaultId;
    }
    return id;
  }

  setCurrentUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  }

  getClasses(): ClassInfo[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!raw) {
      this.saveClasses([INITIAL_DEMO_CLASS]);
      return [INITIAL_DEMO_CLASS];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [INITIAL_DEMO_CLASS];
    }
  }

  saveClasses(classes: ClassInfo[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  getActiveClassId(): string | null {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS_ID);
    if (!id) {
      const defaultId = 'class_term_3';
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS_ID, defaultId);
      return defaultId;
    }
    return id;
  }

  setActiveClassId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CLASS_ID);
    }
  }

  getCourses(): Course[] {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (!raw) {
      this.saveCourses(INITIAL_DEMO_COURSES);
      return INITIAL_DEMO_COURSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEMO_COURSES;
    }
  }

  saveCourses(courses: Course[]): void {
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
  }

  getPersonalEvents(): PersonalEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_EVENTS);
    if (!raw) {
      this.savePersonalEvents(INITIAL_DEMO_PERSONAL_EVENTS);
      return INITIAL_DEMO_PERSONAL_EVENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEMO_PERSONAL_EVENTS;
    }
  }

  savePersonalEvents(events: PersonalEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.PERSONAL_EVENTS, JSON.stringify(events));
  }

  getInvitations(): ClassInvitation[] {
    const raw = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    if (!raw) {
      this.saveInvitations(INITIAL_DEMO_INVITATIONS);
      return INITIAL_DEMO_INVITATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEMO_INVITATIONS;
    }
  }

  saveInvitations(invitations: ClassInvitation[]): void {
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
  }

  getAuditLogs(): AuditLogItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      this.saveAuditLogs(INITIAL_DEMO_AUDIT_LOGS);
      return INITIAL_DEMO_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEMO_AUDIT_LOGS;
    }
  }

  saveAuditLogs(logs: AuditLogItem[]): void {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  isOnboardingSeen(userId: string): boolean {
    const raw = localStorage.getItem(`${STORAGE_KEYS.ONBOARDING_SEEN}_${userId}`);
    return raw === 'true';
  }

  setOnboardingSeen(userId: string, seen: boolean): void {
    localStorage.setItem(`${STORAGE_KEYS.ONBOARDING_SEEN}_${userId}`, seen ? 'true' : 'false');
  }

  getThemeMode(): 'light' | 'dark' {
    const val = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    if (val === 'dark' || val === 'light') return val;
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  setThemeMode(mode: 'light' | 'dark'): void {
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  }
}

export const storage = new StorageService();
