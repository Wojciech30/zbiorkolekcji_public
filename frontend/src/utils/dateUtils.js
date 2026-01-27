/**
 * Format date as dd.mm.yyyy
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format relative time for "on platform since" display
 * @param {string|Date} dateString - Date to format
 * @returns {string} Relative time string in Polish
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffDays < 7) {
    return 'kilku dni';
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    if (weeks === 1) return 'tygodnia';
    return `${weeks} tygodni`;
  } else if (diffMonths < 2) {
    return 'miesiąca';
  } else if (diffMonths < 5) {
    return `${diffMonths} miesięcy`;
  } else if (diffMonths < 12) {
    return `${diffMonths} miesięcy`;
  } else if (diffYears === 1) {
    return 'roku';
  } else if (diffYears < 5) {
    return `${diffYears} lat`;
  } else {
    return `${diffYears} lat`;
  }
}

/**
 * Format date and time as dd.mm.yyyy HH:MM
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
