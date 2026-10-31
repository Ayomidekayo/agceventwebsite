export const EVENT_DATE = '27 February 2027';
export const EVENT_TIME = '9:00 AM';
export const EVENT_VENUE = 'Lagos State University (LASU)';

export type PublicEventInfo = {
  title: string;
  theme: string;
  description: string;
  eventDate: string;
  startTime: string;
  venue: string;
  venueStatus: string;
  targetAttendance: number;
  registrationMode: string;
};

export function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EVENT_DATE;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Lagos',
  }).format(date);
}
