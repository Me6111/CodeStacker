export const generateId = (): string => {
  return `${Date.now()}_${Math.random()}`;
};