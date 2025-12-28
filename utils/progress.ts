import { OrganStatus } from '../types';

export const calculateOrganProgress = (startDateStr: string, active: boolean, organIndex: number): number => {
  if (active) return 100;

  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  // Aumenta ~2% ao dia, com uma pequena variação baseada no índice do órgão
  // para que não fiquem todos exatamente iguais.
  const dailyRate = 2 + (organIndex * 0.1);
  const progress = Math.floor(diffDays * dailyRate);

  // Limita a 99% a menos que esteja 'active' (que retorna 100% acima)
  return Math.min(99, Math.max(0, progress));
};

export const calculateListProgress = (startDateStr: string, isManual: boolean, organs?: OrganStatus): number => {
  if (isManual) return 100;

  if (organs) {
    const totalOrgans = 5;
    const completedCount = Object.values(organs).filter(Boolean).length;

    // Se todos os órgãos estiverem baixados, é 100%
    if (completedCount === totalOrgans) return 100;

    // Caso contrário, calculamos uma média dos progressos individuais
    const organKeys: (keyof OrganStatus)[] = ['serasa', 'boaVista', 'spc', 'cenprotNacional', 'cenprotSP'];
    const totalProgress = organKeys.reduce((acc, key, idx) => {
      return acc + calculateOrganProgress(startDateStr, organs[key], idx);
    }, 0);

    const averageProgress = Math.floor(totalProgress / totalOrgans);
    return averageProgress >= 100 ? 99 : averageProgress;
  }

  // Fallback para quando não temos os órgãos (usado em partes genéricas)
  const startDate = new Date(startDateStr);
  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - startDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  let progress = Math.floor(diffDays * 2);
  return progress >= 100 ? 99 : Math.max(0, progress);
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
