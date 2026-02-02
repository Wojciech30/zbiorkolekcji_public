/**
 * @fileoverview Utility do formatowania dat
 * @description Funkcje formatujące daty do polskiego formatu.
 * 
 * @module utils/dateUtils
 * 
 * @exports
 * - formatDate(date) - dd.mm.yyyy
 * - formatRelativeTime(date) - "od X dni/miesięcy/lat"
 * - formatDateTime(date) - dd.mm.yyyy HH:MM
 */

/**
 * Formatuje datę jako dd.mm.yyyy
 * @param {string|Date} dateString - Data do sformatowania
 * @returns {string} Sformatowana data
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
 * Formatuje relatywny czas ("od X dni/miesięcy/lat")
 * @param {string|Date} dateString - Data do sformatowania
 * @returns {string} Relatywny czas po polsku
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
  } else if (diffMonths < 12) {
    return `${diffMonths} miesięcy`;
  } else if (diffYears === 1) {
    return 'roku';
  } else {
    return `${diffYears} lat`;
  }
}

/**
 * Formatuje datę i czas jako dd.mm.yyyy HH:MM
 * @param {string|Date} dateString - Data do sformatowania
 * @returns {string} Sformatowana data i czas
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
