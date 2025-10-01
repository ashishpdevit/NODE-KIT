export const parseNumericParam = (raw: string, field: string): number => {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
};