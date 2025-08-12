
// Define os tipos para as localidades e moedas suportadas
export type SupportedLocale = 'pt-BR' | 'en-US';
export type SupportedCurrency = 'BRL' | 'USD';

// Mapeia localidades a suas respectivas moedas
export const localeConfig: Record<SupportedLocale, { currency: SupportedCurrency }> = {
  'pt-BR': { currency: 'BRL' },
  'en-US': { currency: 'USD' },
};

/**
 * Formata um número para uma moeda e localidade específicas.
 * @param value O número a ser formatado.
 * @param locale A localidade (ex: 'pt-BR', 'en-US').
 * @param currency A moeda (ex: 'BRL', 'USD').
 * @returns A string formatada.
 */
export const formatCurrency = (
  value: number,
  locale: SupportedLocale,
  currency: SupportedCurrency
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};
