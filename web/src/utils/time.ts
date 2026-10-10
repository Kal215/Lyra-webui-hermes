export function formatTimeAgo(dateInput: Date | number | string, lang: 'id' | 'en'): string {
  let date: Date;
  
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (typeof dateInput === 'number') {
    // Treat as seconds if it's too small to be a recent ms timestamp (e.g. < 10000000000)
    const ms = dateInput < 10000000000 ? dateInput * 1000 : dateInput;
    date = new Date(ms);
  } else {
    date = new Date(dateInput);
  }

  if (isNaN(date.getTime())) {
    return lang === 'id' ? 'Waktu tidak tersedia' : 'Time unavailable';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Fallback for absurd time (e.g. 50 years ago)
  if (diffInSeconds > 1000000000) {
    return lang === 'id' ? 'Waktu tidak tersedia' : 'Time unavailable';
  }

  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour');
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day');
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month');
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return rtf.format(-diffInYears, 'year');
}
