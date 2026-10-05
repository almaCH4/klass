import { Course, CourseStatusType, Homework, LessonSession } from '../types';

const SUBJECT_COLORS: Record<string, string> = {
  'maths': '#2563eb',
  'mathématiques': '#2563eb',
  'spé maths': '#1d4ed8',
  'philosophie': '#7c3aed',
  'philo': '#7c3aed',
  'histoire': '#d97706',
  'histoire-géo': '#d97706',
  'géographie': '#d97706',
  'hggsp': '#b45309',
  'physique': '#0284c7',
  'physique-chimie': '#0284c7',
  'svt': '#059669',
  'ses': '#db2777',
  'anglais': '#dc2626',
  'espagnol': '#ea580c',
  'allemand': '#475569',
  'eps': '#0d9488',
  'emc': '#65a30d',
  'français': '#9333ea',
  'littérature': '#9333ea',
  'nsi': '#4338ca',
  'italien': '#15803d'
};

export function getSubjectColor(subject: string): string {
  const norm = subject.toLowerCase().trim();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (norm.includes(key)) return color;
  }
  return '#234E70';
}

/**
 * Converts UTC timestamp with "Z" suffix (e.g., 20261005T060000Z) to Paris Local Time.
 * Handles CET (UTC+1 in winter) and CEST (UTC+2 in summer).
 */
export function parseIcsDateTime(rawStr: string): {
  dateObj: Date;
  dateIso: string;       // YYYY-MM-DD in Paris
  formattedFr: string;   // JJ/MM/AAAA
  dayOfWeek: number;     // 1 = Lundi, 2 = Mardi, ..., 7 = Dimanche
  timeStr: string;       // HH:MM in Paris
} {
  const clean = rawStr.trim();
  const match = clean.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    throw new Error(`Format de date iCal invalide: ${clean}`);
  }

  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  const h = parseInt(match[4], 10);
  const min = parseInt(match[5], 10);
  const s = parseInt(match[6], 10);

  const isUtc = clean.toUpperCase().endsWith('Z');
  const utcDate = isUtc
    ? new Date(Date.UTC(y, m, d, h, min, s))
    : new Date(y, m, d, h, min, s);

  // Format to Europe/Paris parts
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(utcDate);
  let yearP = '', monthP = '', dayP = '', hourP = '', minP = '';

  for (const part of parts) {
    if (part.type === 'year') yearP = part.value;
    if (part.type === 'month') monthP = part.value;
    if (part.type === 'day') dayP = part.value;
    if (part.type === 'hour') hourP = part.value;
    if (part.type === 'minute') minP = part.value;
  }

  if (hourP === '24') hourP = '00';

  const dateIso = `${yearP}-${monthP}-${dayP}`;
  const formattedFr = `${dayP}/${monthP}/${yearP}`;
  const timeStr = `${hourP}:${minP}`;

  const parisDateForDay = new Date(`${dateIso}T${timeStr}:00`);
  let dayOfWeek = parisDateForDay.getDay();
  if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sunday to 7

  return {
    dateObj: utcDate,
    dateIso,
    formattedFr,
    dayOfWeek,
    timeStr
  };
}

/**
 * Cleans Pronote HTML tags, decodes entities, and unescapes iCal characters.
 */
export function cleanHtmlDescription(rawHtml: string): string {
  if (!rawHtml) return '';

  return rawHtml
    // Unescape iCal backslash sequences
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    // Convert HTML breaks and paragraphs to line breaks
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&eacute;/gi, 'é')
    .replace(/&egrave;/gi, 'è')
    .replace(/&ecirc;/gi, 'ê')
    .replace(/&agrave;/gi, 'à')
    .replace(/&ccedil;/gi, 'ç')
    .replace(/&ocirc;/gi, 'ô')
    .replace(/&icirc;/gi, 'î')
    .replace(/&ucirc;/gi, 'û')
    .replace(/&iuml;/gi, 'ï')
    .replace(/&euml;/gi, 'ë')
    .replace(/&ugrave;/gi, 'ù')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Compress multiple spaces while preserving intentional newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts attached document names from cleaned description.
 */
function extractDocuments(cleanedText: string): string[] {
  const docs: string[] = [];
  const lines = cleanedText.split('\n');

  for (const line of lines) {
    const trimmedLine = line.trim();
    // Only match document label lines like "Pièce jointe : ...", "Documents joints : ...", "Fichiers : ..."
    const docMatch = trimmedLine.match(/^(?:pi[èe]ce[s]?\s*jointe[s]?|documents?\s*joints?|fichiers?\s*joints?|pi[èe]ces?\s*attach[ée]es?)\s*[:-]?\s*(.+)/i);
    if (docMatch && docMatch[1]) {
      const names = docMatch[1].split(/[,;]/);
      for (const name of names) {
        const trimmed = name.trim();
        if (trimmed && !docs.includes(trimmed)) {
          docs.push(trimmed);
        }
      }
    } else {
      // Check for standalone filenames ending with file extensions (e.g. fiche_cours.pdf)
      const extMatch = trimmedLine.match(/\b([a-zA-Z0-9_\-À-ÿ\s.]+\.(?:pdf|docx?|xlsx?|pptx?|odt|png|jpe?g))\b/i);
      if (extMatch && extMatch[1]) {
        const trimmed = extMatch[1].trim();
        if (!docs.includes(trimmed) && trimmed.length > 4) {
          docs.push(trimmed);
        }
      }
    }
  }

  return docs;
}

/**
 * Extracts homework items from cleaned description text.
 * Supports:
 * - "Pour le JJ/MM/AAAA : texte"
 * - "Donné le JJ/MM/AAAA : texte"
 * - "Donné le JJ/MM/AAAA pour le JJ/MM/AAAA : texte"
 */
function extractHomeworkFromDescription(
  cleanedText: string,
  subject: string,
  classId: string,
  group?: string,
  associatedDocs: string[] = []
): Homework[] {
  const homeworkList: Homework[] = [];

  // Match "Pour le JJ/MM/AAAA : <texte>"
  const regexPour = /Pour le\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s*[:-]?\s*([\s\S]*?)(?=(?:Pour le\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|Donn[ée] le\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|Contenu de la s[ée]ance|$))/gi;

  let match;
  while ((match = regexPour.exec(cleanedText)) !== null) {
    const rawDate = match[1].replace(/-/g, '/');
    let homeworkText = match[2].trim();

    if (!homeworkText) continue;

    // Remove any attached docs line from homework text
    homeworkText = homeworkText
      .replace(/(?:pi[èe]ce[s]?\s*jointe[s]?|document[s]?|fichier[s]?)\s*[:-]?\s*.+/i, '')
      .trim();

    // Convert JJ/MM/AAAA to YYYY-MM-DD for sorting
    const parts = rawDate.split('/');
    let dueDateIso = '';
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = '20' + year;
      dueDateIso = `${year}-${month}-${day}`;
    }

    // Try to find preceding "Donné le JJ/MM/AAAA"
    let givenDate: string | undefined;
    const givenMatch = cleanedText.match(/Donn[ée]\s+le\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i);
    if (givenMatch) {
      givenDate = givenMatch[1].replace(/-/g, '/');
    }

    const homeworkId = 'hw_' + Math.random().toString(36).substring(2, 9);

    homeworkList.push({
      id: homeworkId,
      classId,
      subject,
      dueDate: rawDate,
      dueDateIso,
      givenDate,
      description: homeworkText,
      documents: associatedDocs.length > 0 ? associatedDocs : undefined,
      group,
      createdAt: new Date().toISOString()
    });
  }

  // Also check if there is only "Donné le JJ/MM/AAAA : <texte>" without "Pour le"
  if (homeworkList.length === 0) {
    const regexDonne = /Donn[ée] le\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\s*[:-]?\s*([\s\S]*?)(?=(?:Donn[ée] le\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|Contenu de la s[ée]ance|$))/gi;
    let matchDonne;
    while ((matchDonne = regexDonne.exec(cleanedText)) !== null) {
      const rawGiven = matchDonne[1].replace(/-/g, '/');
      const text = matchDonne[2].trim();
      if (!text) continue;

      const homeworkId = 'hw_' + Math.random().toString(36).substring(2, 9);
      homeworkList.push({
        id: homeworkId,
        classId,
        subject,
        dueDate: rawGiven,
        givenDate: rawGiven,
        description: text,
        documents: associatedDocs.length > 0 ? associatedDocs : undefined,
        group,
        createdAt: new Date().toISOString()
      });
    }
  }

  return homeworkList;
}

/**
 * Extracts lesson content and title for student catchup from cleaned description.
 */
function extractLessonSession(
  cleanedText: string,
  subject: string,
  classId: string,
  dateIso: string,
  formattedFr: string,
  group?: string,
  teacher?: string,
  associatedDocs: string[] = []
): LessonSession | null {
  // Extract title if present (e.g., "Titre : ...", "Chapitre : ...")
  let title: string | undefined;
  const titleMatch = cleanedText.match(/(?:Titre|Th[èe]me|Chapitre)\s*[:-]?\s*([^\n\r]+)/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // Check for "Contenu de la séance :"
  const sessionMatch = cleanedText.match(/Contenu de la s[ée]ance\s*[:-]?\s*([\s\S]*?)(?=(?:Pour le\s+\d|Donn[ée]\s+le|(?:\n|^)\s*(?:pi[èe]ce[s]?\s*jointe[s]?|documents?\s*joints?)|$))/i);
  let sessionContent = sessionMatch ? sessionMatch[1].trim() : '';

  // If no explicit "Contenu de la séance", but there is text not starting with "Pour le"
  if (!sessionContent && cleanedText) {
    const withoutHomework = cleanedText
      .replace(/Pour le\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}[\s\S]*/gi, '')
      .replace(/Donn[ée]\s+le\s+\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}[\s\S]*/gi, '')
      .replace(/(?:^|\n)\s*(?:pi[èe]ce[s]?\s*jointe[s]?|documents?\s*joints?)\s*[:-]?.+/gi, '')
      .trim();
    if (withoutHomework.length > 5) {
      sessionContent = withoutHomework;
    }
  }

  if (!sessionContent) return null;

  return {
    id: 'ls_' + Math.random().toString(36).substring(2, 9),
    classId,
    subject,
    date: formattedFr,
    dateIso,
    title,
    content: sessionContent,
    documents: associatedDocs.length > 0 ? associatedDocs : undefined,
    group,
    teacher
  };
}

export interface ParsedIcsResult {
  courses: Course[];
  homework: Homework[];
  sessions: LessonSession[];
  availableGroups: string[];
}

/**
 * Master parser for Pronote iCalendar files.
 * Ignores X-WR-CALNAME and X-WR-CALDESC to protect personal information.
 */
export function parseFullIcsContent(icsData: string, classId: string): ParsedIcsResult {
  const courses: Course[] = [];
  const homework: Homework[] = [];
  const sessions: LessonSession[] = [];
  const groupsSet = new Set<string>();

  // 1. RFC 5545 Line Unfolding (unfolds lines wrapped with CRLF + space/tab or LF + space/tab)
  const unfoldedIcs = icsData.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');

  // 2. Split on VEVENT blocks (automatically ignores root calendar headers X-WR-CALNAME and X-WR-CALDESC)
  const events = unfoldedIcs.split(/BEGIN:VEVENT/i);

  for (let i = 1; i < events.length; i++) {
    const eventBlock = events[i].split(/END:VEVENT/i)[0];
    if (!eventBlock) continue;

    // Extract fields
    const summaryMatch = eventBlock.match(/SUMMARY(?::|;[^:]*:)(.*)/i);
    const locationMatch = eventBlock.match(/LOCATION(?::|;[^:]*:)(.*)/i);
    const descriptionMatch = eventBlock.match(/DESCRIPTION(?::|;[^:]*:)(.*)/i);
    const categoriesMatch = eventBlock.match(/CATEGORIES(?::|;[^:]*:)(.*)/i);
    const dtstartMatch = eventBlock.match(/DTSTART(?::|;[^:]*:)(.*)/i);
    const dtendMatch = eventBlock.match(/DTEND(?::|;[^:]*:)(.*)/i);
    const statusMatch = eventBlock.match(/STATUS(?::|;[^:]*:)(.*)/i);

    const rawSummary = summaryMatch ? summaryMatch[1].trim() : 'Cours';
    const rawLocation = locationMatch ? locationMatch[1].replace(/\\,/g, ',').trim() : 'Salle à définir';
    const rawDescription = descriptionMatch ? descriptionMatch[1].trim() : '';
    const rawCategories = categoriesMatch ? categoriesMatch[1].trim() : '';

    const dtstartRaw = dtstartMatch ? dtstartMatch[1].trim() : '';
    const dtendRaw = dtendMatch ? dtendMatch[1].trim() : '';
    if (!dtstartRaw) continue;

    // Convert UTC to Paris Timezone
    let startInfo;
    try {
      startInfo = parseIcsDateTime(dtstartRaw);
    } catch {
      continue;
    }

    let endTime = `${String((parseInt(startInfo.timeStr.split(':')[0], 10) + 1) % 24).padStart(2, '0')}:${startInfo.timeStr.split(':')[1]}`;
    if (dtendRaw) {
      try {
        const endInfo = parseIcsDateTime(dtendRaw);
        endTime = endInfo.timeStr;
      } catch {}
    }

    // Clean description HTML
    const cleanedDescription = cleanHtmlDescription(rawDescription);

    // Extract Group from SUMMARY or DESCRIPTION (e.g., [2-ESP B3], [1-SPE MATHS])
    let group: string | undefined;
    const groupMatch = rawSummary.match(/\[([^\]]+)\]/) || cleanedDescription.match(/\[([^\]]+)\]/);
    if (groupMatch) {
      group = `[${groupMatch[1].trim()}]`;
      groupsSet.add(group);
    }

    // Determine status badge from CATEGORIES, STATUS, or text
    // Handled categories: « Cours - Cours annulé », « Cours modifié », « Changement de salle », « Remplacement », « Exceptionnel », « Examen »
    let statusType: CourseStatusType = 'normal';
    let statusLabel: string | undefined;
    let isCancelled = false;
    let isModified = false;
    let cancelReason: string | undefined;
    let modifiedReason: string | undefined;

    const catNorm = rawCategories.toLowerCase();
    const sumNorm = rawSummary.toLowerCase();

    if (
      catNorm.includes('cours - cours annulé') ||
      catNorm.includes('cours annulé') ||
      catNorm.includes('annulé') ||
      catNorm.includes('annule') ||
      sumNorm.includes('cours annulé') ||
      sumNorm.includes('annulé') ||
      sumNorm.includes('annule') ||
      (statusMatch && /cancelled/i.test(statusMatch[1]))
    ) {
      statusType = 'cancelled';
      statusLabel = 'Cours annulé';
      isCancelled = true;
      cancelReason = 'Professeur absent ou cours annulé';
    } else if (catNorm.includes('changement de salle') || sumNorm.includes('changement de salle')) {
      statusType = 'room_change';
      statusLabel = 'Changement de salle';
      isModified = true;
      modifiedReason = `Changement de salle : ${rawLocation}`;
    } else if (
      catNorm.includes('cours modifié') ||
      catNorm.includes('cours modifie') ||
      catNorm.includes('modifié') ||
      catNorm.includes('modifie') ||
      sumNorm.includes('cours modifié')
    ) {
      statusType = 'modified';
      statusLabel = 'Cours modifié';
      isModified = true;
      modifiedReason = 'Horaire ou salle réaménagé';
    } else if (catNorm.includes('remplacement') || sumNorm.includes('remplacement')) {
      statusType = 'replacement';
      statusLabel = 'Remplacement';
      isModified = true;
      modifiedReason = 'Remplacement de professeur';
    } else if (catNorm.includes('exceptionnel') || sumNorm.includes('exceptionnel')) {
      statusType = 'exceptional';
      statusLabel = 'Exceptionnel';
    } else if (
      catNorm.includes('examen') ||
      sumNorm.includes('examen') ||
      sumNorm.includes('contrôle') ||
      sumNorm.includes('devoir surveillé') ||
      catNorm.includes('contrôle')
    ) {
      statusType = 'exam';
      statusLabel = 'Examen';
    }

    // Extract Subject Name
    let cleanSubject = rawSummary
      .replace(/\[.*?\]/g, '')
      .replace(/COURS ANNUL[É|E]\s*[:-]?/gi, '')
      .replace(/ANNUL[É|E]\s*[:-]?/gi, '')
      .replace(/MODIFI[É|E]\s*[:-]?/gi, '')
      .replace(/CHANGEMENT DE SALLE\s*[:-]?/gi, '')
      .replace(/REMPLACEMENT\s*[:-]?/gi, '')
      .replace(/EXCEPTIONNEL\s*[:-]?/gi, '')
      .trim();

    // Often Pronote SUMMARY is: "SUBJECT - TEACHER - ROOM [GROUP]"
    if (cleanSubject.includes(' - ')) {
      const parts = cleanSubject.split(' - ');
      cleanSubject = parts[0].trim();
    }

    // Extract Teacher: real teacher name from "Professeur : ..." in description or summary
    let teacher = '';
    const descTeacherMatch =
      cleanedDescription.match(/(?:Professeur|Enseignant(?:e)?)\s*:\s*([^\n\r,<]+)/i) ||
      rawDescription.match(/(?:Professeur|Enseignant(?:e)?)\s*:\s*([^\n\r,<]+)/i);

    if (descTeacherMatch && descTeacherMatch[1]) {
      teacher = descTeacherMatch[1].trim();
    }

    if (!teacher) {
      const titleTeacherMatch =
        cleanedDescription.match(/(?:M\.|Mme|Mlle|Prof\.)\s+[A-Za-zÀ-ÿ\-]+(?:\s+[A-Za-zÀ-ÿ\-]+)?/i) ||
        rawSummary.match(/(?:M\.|Mme|Mlle|Prof\.)\s+[A-Za-zÀ-ÿ\-]+(?:\s+[A-Za-zÀ-ÿ\-]+)?/i);
      if (titleTeacherMatch) {
        teacher = titleTeacherMatch[0].trim();
      }
    }

    // Clean any prefix and never leave lone "Professeur"
    teacher = teacher.replace(/^(?:Professeur|Enseignant(?:e)?)\s*:\s*/i, '').trim();
    if (/^Professeur$/i.test(teacher) || /^Enseignant$/i.test(teacher) || teacher.length <= 1) {
      teacher = '';
    }

    // Clean room: mask "Salle à définir" or empty
    let cleanRoom = rawLocation;
    if (/salle\s+[àa]\s+d[ée]finir/i.test(cleanRoom) || /inconnue/i.test(cleanRoom) || cleanRoom.toLowerCase() === 'salle') {
      cleanRoom = '';
    }

    // Extract attached documents
    const docs = extractDocuments(cleanedDescription);

    // Extract homework
    const courseHomework = extractHomeworkFromDescription(cleanedDescription, cleanSubject, classId, group, docs);
    for (const hw of courseHomework) {
      homework.push(hw);
    }

    // Extract lesson session for catchup
    const session = extractLessonSession(
      cleanedDescription,
      cleanSubject,
      classId,
      startInfo.dateIso,
      startInfo.formattedFr,
      group,
      teacher,
      docs
    );
    if (session) {
      sessions.push(session);
    }

    // Determine category
    let category = '';
    if (group) {
      category = group;
    } else if (/sp[ée]/i.test(cleanSubject)) {
      category = 'Spécialité';
    } else if (/option/i.test(cleanSubject)) {
      category = 'Option';
    }

    // Deduplicate courses: même matière, même début, même fin, même date
    const courseKey = `${cleanSubject.trim().toLowerCase()}_${startInfo.timeStr}_${endTime}_${startInfo.dateIso}`;
    const alreadyExists = courses.some(
      c =>
        c.subject.trim().toLowerCase() === cleanSubject.trim().toLowerCase() &&
        c.startTime === startInfo.timeStr &&
        c.endTime === endTime &&
        c.date === startInfo.dateIso
    );
    if (alreadyExists) {
      continue;
    }

    courses.push({
      id: 'c_' + Math.random().toString(36).substring(2, 10),
      classId,
      subject: cleanSubject || 'Cours',
      category: category || undefined,
      group,
      teacher,
      room: cleanRoom,
      dayOfWeek: startInfo.dayOfWeek,
      date: startInfo.dateIso,
      startTime: startInfo.timeStr,
      endTime,
      color: getSubjectColor(cleanSubject),
      isCancelled,
      cancelReason,
      isModified,
      modifiedReason,
      statusType,
      statusLabel,
      lessonContent: session ? session.content : undefined,
      documents: docs.length > 0 ? docs : undefined
    });
  }

  // Deduplicate homework: même matière + même date « Pour le » + même texte
  const seenHwKeys = new Set<string>();
  const uniqueHomework: Homework[] = [];
  for (const hw of homework) {
    const key = `${hw.subject.trim().toLowerCase()}_${hw.dueDateIso || hw.dueDate}_${hw.description.trim().toLowerCase()}`;
    if (!seenHwKeys.has(key)) {
      seenHwKeys.add(key);
      uniqueHomework.push(hw);
    }
  }

  // Sort homework by due date ascending
  uniqueHomework.sort((a, b) => {
    if (a.dueDateIso && b.dueDateIso) {
      return a.dueDateIso.localeCompare(b.dueDateIso);
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  // Sort sessions by date descending
  sessions.sort((a, b) => {
    if (a.dateIso && b.dateIso) {
      return b.dateIso.localeCompare(a.dateIso);
    }
    return b.date.localeCompare(a.date);
  });

  return {
    courses,
    homework: uniqueHomework,
    sessions,
    availableGroups: Array.from(groupsSet)
  };
}

/**
 * Backward compatibility parser wrapper for courses.
 */
export function parseIcsContent(icsData: string, classId: string): Course[] {
  const result = parseFullIcsContent(icsData, classId);
  return result.courses;
}
