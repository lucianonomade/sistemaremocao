import { OrganStatus } from '../types';

export const calculateListProgress = (startDateStr: string, isManual: boolean, organs?: OrganStatus): number => {
  if (isManual) return 100;

  // Cálculo baseado nos órgãos (cada órgão vale 20% se houver 5)
  if (organs) {
    const totalOrgans = 5;
    const completedCount = Object.values(organs).filter(Boolean).length;
    const organProgress = (completedCount / totalOrgans) * 100;

    // Se todos os órgãos estiverem baixados, é 100%
    if (completedCount === totalOrgans) return 100;

    // O progresso real é o maior entre o tempo decorrido e os órgãos baixados
    const startDate = new Date(startDateStr);
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - startDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    const timeProgress = Math.floor(diffDays * 1.11);

    const finalProgress = Math.max(timeProgress, Math.floor(organProgress));
    return finalProgress >= 90 ? 90 : finalProgress;
  }

  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  let progress = Math.floor(diffDays * 1.11);
  return progress >= 90 ? 90 : Math.max(0, progress);
};

export const getTimelineData = (startDateStr: string) => {
  const start = new Date(startDateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 90);

  return {
    start: start.toLocaleDateString('pt-BR'),
    end: end.toLocaleDateString('pt-BR'),
    daysPassed: Math.floor((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  };
};
