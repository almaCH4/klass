import { Course } from '../types';

/**
 * Standard colors assigned to subjects in French high schools
 */
const SUBJECT_COLORS: Record<string, string> = {
  'maths': '#3b82f6', // Bleu
  'mathématiques': '#3b82f6',
  'spé maths': '#2563eb',
  'philosophie': '#8b5cf6', // Violet
  'philo': '#8b5cf6',
  'histoire': '#f59e0b', // Ambre
  'histoire-géo': '#f59e0b',
  'géographie': '#f59e0b',
  'hggsp': '#d97706',
  'physique': '#06b6d4', // Cyan
  'physique-chimie': '#06b6d4',
  'svt': '#10b981', // Émeraude
  'biologie': '#10b981',
  'ses': '#ec4899', // Rose
  'anglais': '#ef4444', // Rouge
  'espagnol': '#f97316', // Orange
  'allemand': '#64748b', // Gris ardoise
  'eps': '#14b8a6', // Teal
  'nsi': '#6366f1', // Indigo
  'emc': '#84cc16', // Lime
  'français': '#a855f7',
  'littérature': '#a855f7'
};

export function getSubjectColor(subject: string): string {
  const norm = subject.toLowerCase().trim();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (norm.includes(key)) {
      return color;
    }
  }
  // Default fallback colors
  return '#6366f1';
}

/**
 * Parse an iCalendar (.ics) string from Pronote or another calendar service
 */
export function parseIcsContent(icsData: string, classId: string): Partial<Course>[] {
  const courses: Partial<Course>[] = [];
  const events = icsData.split(/BEGIN:VEVENT/i);

  for (let i = 1; i < events.length; i++) {
    const eventBlock = events[i].split(/END:VEVENT/i)[0];
    if (!eventBlock) continue;

    const summaryMatch = eventBlock.match(/SUMMARY(?::|;[^:]*:)(.*)/i);
    const locationMatch = eventBlock.match(/LOCATION(?::|;[^:]*:)(.*)/i);
    const descriptionMatch = eventBlock.match(/DESCRIPTION(?::|;[^:]*:)(.*)/i);
    const dtstartMatch = eventBlock.match(/DTSTART(?::|;[^:]*:)(.*)/i);
    const dtendMatch = eventBlock.match(/DTEND(?::|;[^:]*:)(.*)/i);
    const statusMatch = eventBlock.match(/STATUS(?::|;[^:]*:)(.*)/i);

    const summary = summaryMatch ? summaryMatch[1].replace(/\\,/g, ',').replace(/\\n/g, ' ').trim() : 'Cours';
    const location = locationMatch ? locationMatch[1].replace(/\\,/g, ',').trim() : 'Salle à définir';
    const description = descriptionMatch ? descriptionMatch[1].replace(/\\,/g, ',').replace(/\\n/g, ' ').trim() : '';

    const dtstartRaw = dtstartMatch ? dtstartMatch[1].trim() : '';
    const dtendRaw = dtendMatch ? dtendMatch[1].trim() : '';

    if (!dtstartRaw) continue;

    // Detect cancelation
    const isCancelled = /annul[ée]|supprim[ée]|cancelled/i.test(summary) ||
      /annul[ée]|absent/i.test(description) ||
      (statusMatch ? /cancelled/i.test(statusMatch[1]) : false);

    // Detect modification
    const isModified = /modifi[ée]|changement|déplac[ée]/i.test(summary) || /modifi[ée]/i.test(description);

    // Clean subject name
    let cleanSubject = summary
      .replace(/\[.*?\]/g, '')
      .replace(/COURS ANNUL[É|E]\s*[:-]?/gi, '')
      .replace(/ANNUL[É|E]\s*[:-]?/gi, '')
      .replace(/MODIFI[É|E]\s*[:-]?/gi, '')
      .trim();

    // Guess teacher from description or summary
    let teacher = 'Professeur';
    if (description) {
      const profMatch = description.match(/(?:M\.|Mme|Mlle|Prof(?:esseur)?)\s+[A-Za-zÀ-ÿ\-]+/i);
      if (profMatch) {
        teacher = profMatch[0];
      }
    }

    // Parse date & time
    const parsedStart = parseIcsDate(dtstartRaw);
    const parsedEnd = dtendRaw ? parseIcsDate(dtendRaw) : null;

    if (!parsedStart) continue;

    const dayOfWeek = parsedStart.dayOfWeek; // 1 to 5
    const startTime = `${String(parsedStart.hours).padStart(2, '0')}:${String(parsedStart.minutes).padStart(2, '0')}`;
    const endTime = parsedEnd
      ? `${String(parsedEnd.hours).padStart(2, '0')}:${String(parsedEnd.minutes).padStart(2, '0')}`
      : `${String(parsedStart.hours + 1).padStart(2, '0')}:${String(parsedStart.minutes).padStart(2, '0')}`;

    // Detect category/group (e.g. Spé Maths, Groupe 1)
    let category = 'Tronc commun';
    if (/sp[ée]/i.test(cleanSubject) || /sp[ée]/i.test(description)) {
      category = 'Spécialité';
    } else if (/groupe|grp/i.test(description) || /groupe|grp/i.test(summary)) {
      category = 'Groupe réduit';
    } else if (/option/i.test(description) || /option/i.test(summary)) {
      category = 'Option facultative';
    }

    courses.push({
      classId,
      subject: cleanSubject || 'Cours',
      category,
      teacher,
      room: location,
      dayOfWeek,
      startTime,
      endTime,
      color: getSubjectColor(cleanSubject),
      isCancelled,
      cancelReason: isCancelled ? 'Professeur absent ou cours annulé' : undefined,
      isModified,
      modifiedReason: isModified ? 'Salle ou horaire réaménagé' : undefined,
    });
  }

  return courses;
}

function parseIcsDate(dateStr: string): { dayOfWeek: number; hours: number; minutes: number; date: Date } | null {
  // Format: 20261005T083000Z or 20261005T083000
  const match = dateStr.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hours = parseInt(match[4], 10);
  const minutes = parseInt(match[5], 10);

  const d = new Date(year, month, day, hours, minutes);
  let dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday
  if (dayOfWeek === 0) dayOfWeek = 7; // Convert Sunday to 7

  return { dayOfWeek, hours, minutes, date: d };
}
