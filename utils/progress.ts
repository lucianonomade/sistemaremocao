import { OrganStatus } from '../types';

/**
 * Counts the number of business days (Mon-Fri) between two dates.
 * @param startDate The start date.
 * @param endDate The end date (default: now).
 * @returns Number of business days.
 */
function countBusinessDays(startDate: Date, endDate: Date = new Date()): number {
  let count = 0;
  let currentDate = new Date(startDate);

  // Normalize to start of day to avoid time discrepancies
  currentDate.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (currentDate < end) {
    const dayOfWeek = currentDate.getDay();
    // 0 = Sunday, 6 = Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return count;
}

/**
 * proper pseudo-random generator to ensure deterministic results for the same inputs.
 * This ensures that for a given list ID/start date and organ, the "target duration" is always the same.
 */
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export const calculateOrganProgress = (startDateStr: string, active: boolean, organIndex: number): number => {
  if (active) return 100;

  const startDate = new Date(startDateStr);
  const now = new Date();

  // Se a data de início for no futuro, o progresso é 0
  if (startDate > now) return 0;

  // 1. Determine "Target Days" (7 to 30 business days) deterministically
  // We use the timestamp of the start date + organ index as a seed
  const seed = startDate.getTime() + (organIndex * 12345);
  const randomFactor = pseudoRandom(seed); // 0.0 to 1.0

  // Range: 15 to 90 days (User requested 90 business days baseline)
  const minDays = 15;
  const maxDays = 90;
  const targetBusinessDays = Math.floor(minDays + (randomFactor * (maxDays - minDays)));

  // 2. Count actual business days passed
  const businessDaysPassed = countBusinessDays(startDate, now);

  // 3. Calculate percentage based on target
  // If businessDaysPassed >= targetBusinessDays, we should be at 97% (waiting validation)
  // formula: (passed / target) * 97
  let progress = (businessDaysPassed / targetBusinessDays) * 97;

  // 4. Caps and Floors
  progress = Math.floor(progress);

  // Never exceed 97% automatically
  return Math.min(97, Math.max(0, progress));
};

export const calculateListProgress = (startDateStr: string, isManual: boolean, organs?: OrganStatus): number => {
  if (isManual) return 100;

  if (organs) {
    const totalOrgans = 5;
    const completedCount = Object.values(organs).filter(Boolean).length;

    // Se todos os órgãos estiverem baixados manualmente/confirmados, é 100%
    if (completedCount === totalOrgans) return 100;

    // Caso contrário, calculamos uma média dos progressos individuais
    const organKeys: (keyof OrganStatus)[] = ['serasa', 'boaVista', 'spc', 'cenprotNacional', 'cenprotSP'];
    const totalProgress = organKeys.reduce((acc, key, idx) => {
      // Pass the index (0-4) to help randomize the timeline per organ
      return acc + calculateOrganProgress(startDateStr, organs[key], idx);
    }, 0);

    const averageProgress = Math.floor(totalProgress / totalOrgans);
    return Math.min(97, Math.max(0, averageProgress));
  }

  // Fallback para quando não temos os órgãos (usado em partes genéricas)
  // Usa uma média "genérica" baseada em ~20 dias úteis
  const startDate = new Date(startDateStr);
  const now = new Date();
  const businessDaysPassed = countBusinessDays(startDate, now);
  const genericTarget = 60;
  let progress = Math.floor((businessDaysPassed / genericTarget) * 97);

  return Math.min(97, Math.max(0, progress));
};

export const getTimelineData = (startDateStr: string) => {
  const start = new Date(startDateStr);
  // Default estimate of ~120 calendar days to be safe in the UI text (approx 90 business days)
  const end = new Date(start);
  end.setDate(start.getDate() + 120);

  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return {
    start: start.toLocaleDateString('pt-BR'),
    end: end.toLocaleDateString('pt-BR'), // Estimativa visual
    daysPassed
  };
};
