import React from 'react';
import { useApp } from '../context/AppContext';
import { GoogleAuthModal } from './Modals/GoogleAuthModal';
import { OnboardingModal } from './Modals/OnboardingModal';
import { ClassCreationJoinModal } from './Modals/ClassCreationJoinModal';
import { PasswordGoogleModal } from './Modals/PasswordGoogleModal';
import { PrivacyRGPDModal } from './Modals/PrivacyRGPDModal';
import { AuditLogsModal } from './Modals/AuditLogsModal';
import { PhasePreviewModal } from './Modals/PhasePreviewModal';
import { DelegateManagementModal } from './Delegates/DelegateManagementModal';
import { CourseEditModal } from './Timetable/CourseEditModal';
import { DelegateNoteModal } from './Timetable/DelegateNoteModal';
import { PersonalEventModal } from './Timetable/PersonalEventModal';
import { PronoteSyncModal } from './Timetable/PronoteSyncModal';
import { OptionsFilterModal } from './Timetable/OptionsFilterModal';
import { BackupClassModal } from './Modals/BackupClassModal';

export const ModalManager: React.FC = () => {
  const { activeModal, showOnboarding } = useApp();

  return (
    <>
      {showOnboarding && <OnboardingModal />}
      {activeModal === 'googleAuth' && <GoogleAuthModal />}
      {activeModal === 'classCreationJoin' && <ClassCreationJoinModal />}
      {activeModal === 'onboarding' && <OnboardingModal />}
      {activeModal === 'passwordGoogle' && <PasswordGoogleModal />}
      {activeModal === 'privacyRGPD' && <PrivacyRGPDModal />}
      {activeModal === 'auditLogs' && <AuditLogsModal />}
      {activeModal === 'phasePreview' && <PhasePreviewModal />}
      {activeModal === 'delegateManagement' && <DelegateManagementModal />}
      {activeModal === 'editCourse' && <CourseEditModal />}
      {activeModal === 'editNote' && <DelegateNoteModal />}
      {activeModal === 'personalEvent' && <PersonalEventModal />}
      {activeModal === 'pronoteSync' && <PronoteSyncModal />}
      {activeModal === 'optionsFilter' && <OptionsFilterModal />}
      {activeModal === 'backupClass' && <BackupClassModal />}
    </>
  );
};
