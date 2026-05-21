export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

export const addToHistory = <T>(
  history: T[],
  current: T,
  index: number
): { history: T[]; index: number } => {
  const newHistory = history.slice(0, index + 1);
  newHistory.push(deepClone(current));
  return { history: newHistory, index: newHistory.length - 1 };
};