import { format, parse, parseISO, isValid } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

/**
 * Formate une date selon le format spécifié
 */
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    
    return format(dateObj, formatStr, { locale: fr });
  } catch {
    return '';
  }
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Calcule l'âge en années
 */
export function calculateAge(birthDate: string | Date): number {
  try {
    const birth = typeof birthDate === 'string' ? parseISO(birthDate) : birthDate;
    if (!isValid(birth)) return 0;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return 0;
  }
}

/**
 * Calcule la date d'accouchement estimée (40 semaines après DDM)
 */
export function calculateDueDate(lastMenstruationDate: string | Date): Date {
  try {
    const lmd = typeof lastMenstruationDate === 'string' 
      ? parseISO(lastMenstruationDate) 
      : lastMenstruationDate;
    
    const dueDate = new Date(lmd);
    dueDate.setDate(dueDate.getDate() + 280); // 40 semaines
    
    return dueDate;
  } catch {
    return new Date();
  }
}

/**
 * Formate une date de manière sécurisée, gérant les Date, Timestamp Firestore, et strings
 */
export function formatDateSafe(
  date: string | Date | { toDate: () => Date } | null | undefined,
  formatStr: string = 'dd/MM/yyyy'
): string {
  if (!date) return '';
  
  try {
    let dateObj: Date;
    
    // Si c'est un Timestamp Firestore (avec méthode toDate)
    if (typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    }
    // Si c'est déjà une Date
    else if (date instanceof Date) {
      dateObj = date;
    }
    // Si c'est une string
    else if (typeof date === 'string') {
      dateObj = parseISO(date);
    }
    // Sinon, essayer de convertir
    else {
      dateObj = new Date(date as any);
    }
    
    // Vérifier si la date est valide
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, formatStr, { locale: fr });
  } catch {
    return '';
  }
}

