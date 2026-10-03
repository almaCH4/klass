import { Course } from '../types';

const SUBJECT_COLORS: Record<string, string> = {
  'maths': '#3b82f6',
  'mathématiques': '#3b82f6',
  'spé maths': '#2563eb',
  'philosophie': '#8b5cf6',
  'philo': '#8b5cf6',
  'histoire': '#f59e0b',
  'histoire-géo': '#f59e0b',
  'géographie': '#f59e0b',
  'hggsp': '#d97706',
  'physique': '#06b6d4',
  'physique-chimie': '#06b6d4',
  'svt': '#10b981',
  'ses': '#ec4899',
  'anglais': '#ef4444',
  'espagnol': '#f97316',
  'allemand': '#64748b',
  'eps': '#14b8a6',
  'emc': '#84cc16',
  'français': '#a855f7',
  'littérature': '#a855f7'
};

export function getSubjectColor(subject: string): string {
  const norm = subject.toLowerCase().trim();
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (norm.includes(key)) return color;
  }
  return '#6366f1';
}

export function parseIcsContent(icsData: string, classId: string): Course[] {
  const courses: Course[] = [];
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

    const isCancelled = /annul[ée]|supprim[ée]|cancelled/i.test(summary) ||
      /annul[ée]|absent/i.test(description) ||
      (statusMatch ? /cancelled/i.test(statusMatch[1]) : false);

    const isModified = /modifi[ée]|changement|déplac[ée]/i.test(summary) || /modifi[ée]/i.test(description);

    const cleanSubject = summary
      .replace(/\[.*?\]/g, '')
      .replace(/COURS ANNUL[É|E]\s*[:-]?/gi, '')
      .replace(/ANNUL[É|E]\s*[:-]?/gi, '')
      .replace(/MODIFI[É|E]\s*[:-]?/gi, '')
      .trim();

    let teacher = 'Professeur';
    if (description) {
      const profMatch = description.match(/(?:M\.|Mme|Mlle|Prof(?:esseur)?)\s+[A-Za-zÀ-ÿ\-]+/i);
      if (profMatch) teacher = profMatch[0];
    }

    const startMatch = dtstartRaw.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
    if (!startMatch) continue;

    const year = parseInt(startMatch[1], 10);
    const month = parseInt(startMatch[2], 10) - 1;
    const day = parseInt(startMatch[3], 10);
    const hours = parseInt(startMatch[4], 10);
    const minutes = parseInt(startMatch[5], 10);

    const d = new Date(year, month, day, hours, minutes);
    let dayOfWeek = d.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;

    const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    let endTime = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    if (dtendRaw) {
      const endMatch = dtendRaw.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
      if (endMatch) {
        endTime = `${endMatch[4].padStart(2, '0')}:${endMatch[5].padStart(2, '0')}`;
      }
    }

    let category = 'Tronc commun';
    if (/sp[ée]/i.test(cleanSubject) || /sp[ée]/i.test(description)) {
      category = 'Spécialité';
    } else if (/groupe|grp/i.test(description) || /groupe|grp/i.test(summary)) {
      category = 'Groupe';
    } else if (/option/i.test(description) || /option/i.test(summary)) {
      category = 'Option';
    }

    courses.push({
      id: 'c_' + Math.random().toString(36).substring(2, 10),
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
      modifiedReason: isModified ? 'Salle ou horaire réaménagé' : undefined
    });
  }

  return courses;
}
