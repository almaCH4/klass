import React, { useState } from 'react';
import { Course } from '../../types';
import { useApp } from '../../context/AppContext';
import { compressImageToDataUrl } from '../../utils/imageCompressor';
import {
  X,
  FileText,
  Clock,
  MapPin,
  User as UserIcon,
  Sparkles,
  Link as LinkIcon,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  Edit2,
  Check,
  Calendar,
  AlertCircle,
  Eye,
  StickyNote,
  BookOpen
} from 'lucide-react';

interface CourseCatchupModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourseCatchupModal: React.FC<CourseCatchupModalProps> = ({
  course,
  isOpen,
  onClose
}) => {
  const { isLeader, currentUser, updateCourse } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [lessonSummary, setLessonSummary] = useState('');
  const [adviceNote, setAdviceNote] = useState('');
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [images, setImages] = useState<{ id: string; name: string; dataUrl: string; addedBy?: string; addedAt?: string }[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Sync state when course changes
  React.useEffect(() => {
    if (course) {
      setLessonSummary(course.catchupData?.lessonSummary || '');
      setAdviceNote(course.catchupData?.adviceNote || course.delegateNote?.text || '');
      setLinks(course.catchupData?.links || []);
      setImages(course.catchupData?.images || []);
      setIsEditing(false);
      setNewLinkTitle('');
      setNewLinkUrl('');
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const hasValidRoom = Boolean(
    course.room &&
    !/salle\s+[àa]\s+d[ée]finir/i.test(course.room) &&
    !/inconnue/i.test(course.room) &&
    course.room.trim() !== ''
  );

  const cleanTeacher = (course.teacher || '').replace(/^(?:Professeur|Enseignant(?:e)?)\s*:\s*/i, '').trim();
  const hasValidTeacher = Boolean(
    cleanTeacher &&
    !/^professeur$/i.test(cleanTeacher) &&
    !/^enseignant$/i.test(cleanTeacher) &&
    cleanTeacher.length > 1
  );

  const formattedDate = course.date
    ? new Date(course.date + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : `Jour ${course.dayOfWeek}`;

  const handleAddLink = () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) return;
    const url = newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`;
    setLinks([...links, { title: newLinkTitle.trim(), url }]);
    setNewLinkTitle('');
    setNewLinkUrl('');
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 4) {
      alert('Vous pouvez ajouter au maximum 4 photos par cours pour respecter la limite de taille.');
      return;
    }

    try {
      setIsUploadingImage(true);
      const compressedDataUrl = await compressImageToDataUrl(file, 450);
      const newImg = {
        id: 'img_' + Math.random().toString(36).substring(2, 8),
        name: file.name.substring(0, 30),
        dataUrl: compressedDataUrl,
        addedBy: currentUser?.name || 'Délégué',
        addedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setImages(prev => [...prev, newImg]);
    } catch (err: any) {
      alert("Impossible de compresser l'image : " + (err.message || 'erreur inconnue'));
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (imgId: string) => {
    setImages(images.filter(img => img.id !== imgId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const updatedCatchupData = {
      lessonSummary: lessonSummary.trim() || undefined,
      adviceNote: adviceNote.trim() || undefined,
      links: links.length > 0 ? links : undefined,
      images: images.length > 0 ? images : undefined,
      updatedAt: 'Aujourd\'hui à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      updatedBy: currentUser?.name || 'Délégué'
    };

    await updateCourse(course.id, {
      catchupData: updatedCatchupData,
      lessonContent: course.lessonContent
    });

    setIsSaving(false);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-[#1A2026] rounded-3xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto no-scrollbar">
        
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                style={{ backgroundColor: course.color || '#234E70' }}
              >
                {course.subject}
              </span>
              {course.group && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {course.group}
                </span>
              )}
              {course.statusLabel && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#991B1B] text-white">
                  {course.statusLabel}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white capitalize">
              Fiche de cours : {course.subject}
            </h2>

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center capitalize">
                <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {formattedDate}
              </span>
              <span className="flex items-center font-semibold text-slate-700 dark:text-slate-200">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {course.startTime} - {course.endTime}
              </span>
              {hasValidRoom && (
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {course.room}
                </span>
              )}
              {hasValidTeacher && (
                <span className="flex items-center">
                  <UserIcon className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {cleanTeacher}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            {isLeader && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-[#234E70] text-white hover:bg-[#1b3e59] shadow-xs transition-transform active:scale-95"
              >
                <Edit2 className="w-3 h-3 mr-1.5" />
                <span>Modifier la fiche</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center space-x-2 border border-emerald-200">
            <Check className="w-4 h-4" />
            <span>Fiche de cours enregistrée avec succès ! Visible par toute la classe.</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* 1. CONTENU OFFICIEL PRONOTE (LECTURE SEULE) */}
        {/* ==================================================== */}
        <div className="rounded-2xl p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600 dark:text-sky-400" />
              Contenu de séance Pronote
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-sky-950 dark:text-sky-300">
              Pronote officiel (Lecture seule)
            </span>
          </div>

          {course.lessonContent ? (
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {course.lessonContent}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Aucun résumé ou cahier de texte de séance n'a été publié sur Pronote pour ce créneau.
            </p>
          )}

          {/* Documents joints Pronote */}
          {course.documents && course.documents.length > 0 && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Documents joints distribués :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {course.documents.map((docName, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    <span>{docName}</span>
                    <span className="ml-1 text-[10px] text-slate-400">(sur Pronote)</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* 2. ZONE DES DÉLÉGUÉS (ENTRAIDE DE CLASSE) */}
        {/* ==================================================== */}
        <div className="rounded-2xl p-4 bg-sky-50/40 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/60 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#234E70] dark:text-sky-300 uppercase tracking-wider flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-[#234E70] dark:text-sky-400" />
              Zone d'entraide de la classe (Délégués)
            </span>
            {course.catchupData?.updatedAt && (
              <span className="text-[10px] text-slate-400">
                Mis à jour {course.catchupData.updatedAt} par {course.catchupData.updatedBy}
              </span>
            )}
          </div>

          {isEditing ? (
            /* ================= EDIT MODE (Délégués) ================= */
            <div className="space-y-4">
              
              {/* Texte du cours du jour */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Résumé du cours du jour (notions, chapitres, exercices faits) :
                </label>
                <textarea
                  value={lessonSummary}
                  onChange={(e) => setLessonSummary(e.target.value)}
                  rows={4}
                  placeholder="Ex : Nous avons commencé le chapitre 3 sur la dérivation (page 45). Exercices 12 et 14 corrigés au tableau."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl bg-white dark:bg-[#1A2026] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
                />
              </div>

              {/* Note de conseil / rappel */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Conseil ou rappel pour la prochaine séance :
                </label>
                <input
                  type="text"
                  value={adviceNote}
                  onChange={(e) => setAdviceNote(e.target.value)}
                  placeholder="Ex : Apporter impérativement la calculatrice TI pour le TP !"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1A2026] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#234E70]"
                />
              </div>

              {/* Liens partagés (Google Drive, etc.) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Liens utiles (Dossier Google Drive, fiche méthode, etc.) :
                </label>
                
                {links.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#1A2026] border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <LinkIcon className="w-3.5 h-3.5 text-[#234E70] dark:text-sky-400 shrink-0" />
                      <span className="font-bold text-slate-900 dark:text-white truncate">{link.title}</span>
                      <span className="text-[11px] text-slate-400 truncate">({link.url})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="Titre (ex : Google Drive du cours)"
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2026] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#1A2026] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-3 py-1.5 text-xs font-bold bg-[#234E70] text-white rounded-xl hover:bg-[#1b3e59] shrink-0"
                  >
                    + Ajouter le lien
                  </button>
                </div>
              </div>

              {/* Photos de tableau / fiches de cours */}
              <div className="space-y-2 pt-2 border-t border-sky-200 dark:border-sky-900/60">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Photos du tableau ou fiches manuscrites (compressées automatiquement &lt; 500 Ko) :
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800">
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(img.id)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700"
                          title="Supprimer la photo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {images.length < 4 && (
                  <label className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#1A2026] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer shadow-2xs">
                    <ImageIcon className="w-4 h-4 text-[#234E70] dark:text-sky-400" />
                    <span>{isUploadingImage ? 'Compression en cours...' : '+ Importer une photo (tableau, schéma)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                )}
                <p className="text-[10px] text-slate-400">
                  Images compressées côté client et stockées gratuitement dans Firestore (max 4 photos).
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-sky-200 dark:border-sky-900/60">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-white/80 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-bold bg-[#234E70] hover:bg-[#1b3e59] text-white rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Enregistrement...' : 'Enregistrer la fiche'}
                </button>
              </div>

            </div>
          ) : (
            /* ================= READ MODE (Tous les élèves) ================= */
            <div className="space-y-3.5">
              
              {/* Résumé du cours */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ce qui a été fait en classe :
                </p>
                {course.catchupData?.lessonSummary ? (
                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {course.catchupData.lessonSummary}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Aucun résumé rédigé pour le moment par les délégués.
                  </p>
                )}
              </div>

              {/* Conseil / Rappel */}
              {(course.catchupData?.adviceNote || course.delegateNote?.text) && (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-0.5">
                  <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center">
                    <StickyNote className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                    Rappel & Conseil pour le prochain cours :
                  </span>
                  <p className="text-amber-800 dark:text-amber-300">
                    {course.catchupData?.adviceNote || course.delegateNote?.text}
                  </p>
                </div>
              )}

              {/* Liens partagés */}
              {course.catchupData?.links && course.catchupData.links.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Liens utiles & Ressources :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {course.catchupData.links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A2026] text-xs font-bold text-[#234E70] dark:text-sky-400 border border-slate-200 dark:border-slate-700 shadow-2xs hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        <span>{link.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Photos de tableau / fiches */}
              {course.catchupData?.images && course.catchupData.images.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Photos du tableau / Schémas :
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {course.catchupData.images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setLightboxImage(img.dataUrl)}
                        className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-2xs hover:scale-105 transition-transform"
                      >
                        <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>Agrandir</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl"
          >
            Fermer
          </button>
        </div>

      </div>

      {/* Lightbox Modal for Fullscreen Image */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={lightboxImage} alt="Agrandissement du cours" className="max-w-full max-h-[90vh] object-contain rounded-xl" />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
