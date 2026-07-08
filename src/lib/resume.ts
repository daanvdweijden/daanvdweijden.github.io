// ---------------------------------------------------------------------------
// Helpers for src/data/resume.json — a JSON Resume (jsonresume.org/schema)
// file. Keeping it schema-compliant means the same file can be reused with
// any JSON Resume theme/tool, not just this site. Edit the JSON to update
// your CV; these functions just sort and format it for display.
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
  courses?: string[];
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
}

export const resume = resumeData as Resume;

const byStartDateDesc = (a: { startDate: string }, b: { startDate: string }) =>
  b.startDate.localeCompare(a.startDate);

export const educationSorted = () => [...resume.education].sort(byStartDateDesc);
export const workSorted = () => [...resume.work].sort(byStartDateDesc);
export const awardsSorted = () => [...resume.awards].sort((a, b) => b.date.localeCompare(a.date));

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
