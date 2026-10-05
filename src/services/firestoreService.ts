import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import { User, ClassInfo, Course, PersonalEvent, ClassInvitation, AuditLogItem, UserRole, ChatMessage, ChatPoll } from '../types';

export class FirestoreService {
  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  async getUser(userId: string): Promise<User | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      return snap.data() as User;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  async setUser(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const path = `users/${userId}`;
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    const path = `users/${userId}`;
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  async getClassMembers(classId: string): Promise<User[]> {
    const path = 'users';
    try {
      const q = query(collection(db, 'users'), where('classId', '==', classId));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as User);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  // -------------------------------------------------------------
  // CLASSES
  // -------------------------------------------------------------
  async getClass(classId: string): Promise<ClassInfo | null> {
    const path = `classes/${classId}`;
    try {
      const snap = await getDoc(doc(db, 'classes', classId));
      if (!snap.exists()) return null;
      return snap.data() as ClassInfo;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  async createClass(classData: ClassInfo, creatorUser: User): Promise<void> {
    const classPath = `classes/${classData.id}`;
    const userPath = `users/${creatorUser.id}`;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'classes', classData.id), classData);
      batch.update(doc(db, 'users', creatorUser.id), {
        classId: classData.id,
        role: 'DELEGATE'
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `${classPath} & ${userPath}`);
    }
  }

  async updateClass(classId: string, updates: Partial<ClassInfo>): Promise<void> {
    const path = `classes/${classId}`;
    try {
      await updateDoc(doc(db, 'classes', classId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  // -------------------------------------------------------------
  // COURSES (Subcollection under /classes/{classId}/courses)
  // -------------------------------------------------------------
  async getCourses(classId: string): Promise<Course[]> {
    const path = `classes/${classId}/courses`;
    try {
      const snap = await getDocs(collection(db, 'classes', classId, 'courses'));
      return snap.docs.map(d => d.data() as Course);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async setCourse(classId: string, course: Course): Promise<void> {
    const path = `classes/${classId}/courses/${course.id}`;
    try {
      await setDoc(doc(db, 'classes', classId, 'courses', course.id), course);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async updateCourse(classId: string, courseId: string, updates: Partial<Course>): Promise<void> {
    const path = `classes/${classId}/courses/${courseId}`;
    try {
      await updateDoc(doc(db, 'classes', classId, 'courses', courseId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async deleteCourse(classId: string, courseId: string): Promise<void> {
    const path = `classes/${classId}/courses/${courseId}`;
    try {
      await deleteDoc(doc(db, 'classes', classId, 'courses', courseId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  async batchReplaceCourses(classId: string, newCourses: Course[]): Promise<void> {
    const path = `classes/${classId}/courses`;
    try {
      // 1. Get existing courses
      const existingSnap = await getDocs(collection(db, 'classes', classId, 'courses'));
      const batch = writeBatch(db);

      // Delete old courses
      for (const d of existingSnap.docs) {
        batch.delete(d.ref);
      }

      // Add new courses
      for (const c of newCourses) {
        batch.set(doc(db, 'classes', classId, 'courses', c.id), c);
      }

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // -------------------------------------------------------------
  // INVITATIONS (Subcollection under /classes/{classId}/invitations)
  // -------------------------------------------------------------
  async getInvitations(classId: string): Promise<ClassInvitation[]> {
    const path = `classes/${classId}/invitations`;
    try {
      const snap = await getDocs(collection(db, 'classes', classId, 'invitations'));
      return snap.docs.map(d => d.data() as ClassInvitation);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async createInvitation(classId: string, invitation: ClassInvitation): Promise<void> {
    const path = `classes/${classId}/invitations/${invitation.id}`;
    try {
      await setDoc(doc(db, 'classes', classId, 'invitations', invitation.id), invitation);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async deleteInvitation(classId: string, invitationId: string): Promise<void> {
    const path = `classes/${classId}/invitations/${invitationId}`;
    try {
      await deleteDoc(doc(db, 'classes', classId, 'invitations', invitationId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  async getInvitationDetails(rawToken: string): Promise<{ invitation: ClassInvitation; classId: string; invitationId: string; className: string }> {
    const trimmed = rawToken.trim();
    let classId = '';
    let invitationId = '';

    if (trimmed.includes('__')) {
      const parts = trimmed.split('__');
      classId = parts[0];
      invitationId = parts[1];
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length >= 3 && parts[0] === 'KLASS') {
        classId = parts[1];
        invitationId = parts.slice(2).join('-');
      } else {
        classId = parts[0];
        invitationId = parts[1];
      }
    } else {
      throw new Error('Code d\'invitation invalide.');
    }

    const invRef = doc(db, 'classes', classId, 'invitations', invitationId);
    const invSnap = await getDoc(invRef);
    if (!invSnap.exists()) {
      throw new Error('Invitation introuvable ou expirée.');
    }

    const invitation = invSnap.data() as ClassInvitation;
    let className = invitation.className || '';

    if (!className) {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          className = classSnap.data().name || '';
        }
      } catch {
        className = 'votre classe';
      }
    }

    return {
      invitation,
      classId,
      invitationId,
      className: className || 'votre classe'
    };
  }

  async joinClassWithInvitationToken(rawToken: string, user: User): Promise<{ classInfo: ClassInfo; updatedUser: User }> {
    const trimmed = rawToken.trim();
    let classId = '';
    let invitationId = '';

    if (trimmed.includes('__')) {
      const parts = trimmed.split('__');
      classId = parts[0];
      invitationId = parts[1];
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length >= 3 && parts[0] === 'KLASS') {
        classId = parts[1];
        invitationId = parts.slice(2).join('-');
      } else {
        classId = parts[0];
        invitationId = parts[1];
      }
    } else {
      throw new Error('Code d\'invitation invalide. Utilisez le format complet fourni par votre délégué (ex: KLASS-c_xxx-inv_xxx).');
    }

    const invPath = `classes/${classId}/invitations/${invitationId}`;
    try {
      const invRef = doc(db, 'classes', classId, 'invitations', invitationId);
      const invSnap = await getDoc(invRef);
      if (!invSnap.exists()) {
        throw new Error('Invitation introuvable ou expirée.');
      }

      const invitation = invSnap.data() as ClassInvitation;
      if (invitation.status === 'ACCEPTED') {
        throw new Error('Cette invitation a déjà été utilisée.');
      }

      if (invitation.status === 'REVOKED') {
        throw new Error('Cette invitation a été révoquée.');
      }

      // Compare emails strictly in lowercase
      if (invitation.email) {
        const invEmail = invitation.email.trim().toLowerCase();
        const userEmail = (user.email || '').trim().toLowerCase();
        if (invEmail !== userEmail) {
          throw new Error(
            `Cette invitation est réservée à l'adresse e-mail ${invEmail}. Votre compte Google actuel est ${userEmail}.`
          );
        }
      }

      // Update user role and classId
      const targetRole: UserRole = invitation.roleTarget || 'STUDENT';
      const updatedUser: User = {
        ...user,
        classId,
        role: targetRole,
        joinedWithInvitationId: invitationId
      };

      // Atomic batch: mark invitation used and set user classId with joinedWithInvitationId
      const batch = writeBatch(db);
      batch.update(invRef, {
        status: 'ACCEPTED',
        isUsed: true,
        usedBy: user.id,
        acceptedAt: new Date().toISOString()
      });
      batch.update(doc(db, 'users', user.id), {
        classId,
        role: targetRole,
        joinedWithInvitationId: invitationId
      });
      await batch.commit();

      const classObj = await this.getClass(classId);
      if (!classObj) throw new Error('Classe introuvable.');

      // Add audit log
      await this.addAuditLog(classId, {
        id: 'log_' + Date.now(),
        classId,
        authorName: user.name,
        authorRole: targetRole === 'DEPUTY' ? 'Suppléant(e)' : 'Élève',
        action: 'Nouveau membre',
        details: `${user.name} a rejoint la classe via une invitation`,
        timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      });

      return { classInfo: classObj, updatedUser };
    } catch (err: any) {
      if (err.message && err.message.includes('permission')) {
        handleFirestoreError(err, OperationType.WRITE, invPath);
      }
      throw err;
    }
  }

  // -------------------------------------------------------------
  // AUDIT LOGS (Subcollection under /classes/{classId}/auditLogs)
  // -------------------------------------------------------------
  async getAuditLogs(classId: string): Promise<AuditLogItem[]> {
    const path = `classes/${classId}/auditLogs`;
    try {
      const snap = await getDocs(collection(db, 'classes', classId, 'auditLogs'));
      const logs = snap.docs.map(d => d.data() as AuditLogItem);
      // Sort in-memory to prevent complex composite index requirements
      return logs.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 50);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async addAuditLog(classId: string, log: AuditLogItem): Promise<void> {
    const path = `classes/${classId}/auditLogs/${log.id}`;
    try {
      await setDoc(doc(db, 'classes', classId, 'auditLogs', log.id), log);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  // -------------------------------------------------------------
  // PERSONAL EVENTS (Subcollection under /users/{userId}/personalEvents)
  // -------------------------------------------------------------
  async getPersonalEvents(userId: string): Promise<PersonalEvent[]> {
    const path = `users/${userId}/personalEvents`;
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'personalEvents'));
      return snap.docs.map(d => d.data() as PersonalEvent);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  }

  async addPersonalEvent(userId: string, event: PersonalEvent): Promise<void> {
    const path = `users/${userId}/personalEvents/${event.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'personalEvents', event.id), event);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  async updatePersonalEvent(userId: string, eventId: string, updates: Partial<PersonalEvent>): Promise<void> {
    const path = `users/${userId}/personalEvents/${eventId}`;
    try {
      await updateDoc(doc(db, 'users', userId, 'personalEvents', eventId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async deletePersonalEvent(userId: string, eventId: string): Promise<void> {
    const path = `users/${userId}/personalEvents/${eventId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'personalEvents', eventId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }

  // -------------------------------------------------------------
  // BACKUP & RESTORE (JSON)
  // -------------------------------------------------------------
  async exportClassBackup(classId: string, userEmail: string): Promise<any> {
    const classObj = await this.getClass(classId);
    if (!classObj) throw new Error('Classe introuvable.');

    const [courses, auditLogs, invitations] = await Promise.all([
      this.getCourses(classId),
      this.getAuditLogs(classId),
      this.getInvitations(classId)
    ]);

    return {
      app: 'Klass Lycée',
      storageEngine: 'Firebase Firestore',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      exportedBy: userEmail,
      classInfo: {
        name: classObj.name,
        schoolName: classObj.schoolName,
        academicYear: classObj.academicYear
      },
      courses,
      auditLogs,
      invitations
    };
  }

  async importClassBackup(classId: string, backupData: any, authorName: string): Promise<number> {
    if (!backupData || !backupData.classInfo || !Array.isArray(backupData.courses)) {
      throw new Error('Format de fichier de sauvegarde JSON invalide.');
    }

    const classObj = await this.getClass(classId);
    if (!classObj) throw new Error('Classe introuvable.');

    if (backupData.classInfo.name) classObj.name = backupData.classInfo.name;
    if (backupData.classInfo.schoolName) classObj.schoolName = backupData.classInfo.schoolName;
    await this.updateClass(classId, {
      name: classObj.name,
      schoolName: classObj.schoolName
    });

    const restoredCourses: Course[] = backupData.courses.map((c: any) => ({
      ...c,
      id: c.id || ('c_' + Math.random().toString(36).substring(2, 9)),
      classId
    }));

    await this.batchReplaceCourses(classId, restoredCourses);

    await this.addAuditLog(classId, {
      id: 'log_' + Date.now(),
      classId,
      authorName,
      authorRole: 'Délégué(e) titulaire',
      action: 'Restauration de sauvegarde Firestore',
      details: `${restoredCourses.length} cours restaurés depuis une sauvegarde JSON`,
      timestamp: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    });

    return restoredCourses.length;
  }

  // -------------------------------------------------------------
  // CHAT MESSAGES
  // -------------------------------------------------------------
  async sendChatMessage(classId: string, message: ChatMessage): Promise<void> {
    const path = `classes/${classId}/messages/${message.id}`;
    try {
      await setDoc(doc(db, 'classes', classId, 'messages', message.id), message);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  }

  async updateChatMessage(classId: string, messageId: string, updates: Partial<ChatMessage>): Promise<void> {
    const path = `classes/${classId}/messages/${messageId}`;
    try {
      await updateDoc(doc(db, 'classes', classId, 'messages', messageId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  async deleteChatMessage(classId: string, messageId: string): Promise<void> {
    const path = `classes/${classId}/messages/${messageId}`;
    try {
      await deleteDoc(doc(db, 'classes', classId, 'messages', messageId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  }
}

export const firestoreService = new FirestoreService();
