// ---------------------------------------------------------------------------
// Helpers for src/data/resume.json — a JSON Resume (jsonresume.org/schema)
// file. The standard sections stay schema-compliant so the file can be reused
// with any JSON Resume theme/tool; `presentations`, `supervision`, `teaching`
// and `visits` are extensions the schema has no slot for, which other themes
// simply ignore. The LaTeX CV in cv/cv.tex is the source of truth for the
// content; edit the JSON to match it. These functions only sort and format.
// ---------------------------------------------------------------------------
import resumeData from '../data/resume.json';

export interface EducationItem {
  institution: string;
  area?: string;
  studyType?: string;
  startDate: string;
  endDate?: string;
  score?: string;
  summary?: string;
  thesis?: string;
  thesisNote?: string;
}

export interface WorkItem {
  name: string;
  location?: string;
  position: string;
  startDate: string;
  endDate?: string;
  summary?: string;
}

export interface AwardItem {
  title: string;
  date: string;
  awarder?: string;
  summary?: string;
}

export interface PresentationItem {
  title: string;
  venue: string;
  date: string;
  note?: string;
}

export interface SupervisionItem {
  students: string;
  title: string;
  kind: string;
  institution: string;
  startDate: string;
  endDate: string;
  note?: string;
}

export interface TeachingItem {
  course: string;
  role: string;
  detail?: string;
  institution: string;
  /** Display label, e.g. "Fall 2024, Fall 2025" -- terms don't fit YYYY-MM. */
  term: string;
  /** Sort key only; never displayed. */
  date: string;
}

export interface VisitItem {
  position: string;
  institution: string;
  location?: string;
  term: string;
  date: string;
  summary?: string;
}

export interface VolunteerItem {
  position: string;
  organization: string;
  term: string;
  date: string;
  summary?: string;
}

export interface LanguageItem {
  language: string;
  fluency: string;
}

export interface Resume {
  basics: {
    name: string;
    label: string;
    email: string;
    location: { city: string; region?: string; countryCode?: string };
    profiles: { network: string; url: string }[];
  };
  education: EducationItem[];
  work: WorkItem[];
  awards: AwardItem[];
  presentations: PresentationItem[];
  supervision: SupervisionItem[];
  teaching: TeachingItem[];
  visits: VisitItem[];
  volunteer: VolunteerItem[];
  languages: LanguageItem[];
}

export const resume = resumeData as Resume;

const byStartDateDesc = (a: { startDate: string }, b: { startDate: string }) =>
  b.startDate.localeCompare(a.startDate);

export const educationSorted = () => [...resume.education].sort(byStartDateDesc);
export const workSorted = () => [...resume.work].sort(byStartDateDesc);
const byDateDesc = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

export const awardsSorted = () => [...resume.awards].sort(byDateDesc);
export const presentationsSorted = () => [...resume.presentations].sort(byDateDesc);
export const teachingSorted = () => [...resume.teaching].sort(byDateDesc);
export const visitsSorted = () => [...resume.visits].sort(byDateDesc);
export const volunteerSorted = () => [...resume.volunteer].sort(byDateDesc);
/** Supervision reads by completion, so it sorts on the end date, not the start. */
export const supervisionSorted = () =>
  [...resume.supervision].sort((a, b) => b.endDate.localeCompare(a.endDate));

/** "2023-09" → "2023.09"; blank/missing end date reads as "Present". */
const fmt = (isoMonth: string) => isoMonth.replace('-', '.');

export function dateRange(startDate: string, endDate?: string): string {
  return `${fmt(startDate)} – ${endDate ? fmt(endDate) : 'Present'}`;
}

export const formatDate = (isoMonth: string) => fmt(isoMonth);

/** ISO 3166 country code → display name, e.g. "CH" → "Switzerland". */
export function countryName(code?: string): string {
  if (!code) return '';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
