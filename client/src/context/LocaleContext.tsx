import { createContext, useContext, useState, ReactNode } from 'react';
import { SupportedLocale, localeConfig } from '@/lib/formatters';

// Define a interface para o valor do contexto
interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
}

// Cria o contexto com um valor padrão inicial
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

// Define as props do provedor
interface LocaleProviderProps {
  children: ReactNode;
}

// Cria o componente Provedor
export const LocaleProvider = ({ children }: LocaleProviderProps) => {
  const [locale, setLocale] = useState<SupportedLocale>('pt-BR'); // Padrão para pt-BR

  const value = { locale, setLocale };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
};

// Cria um hook customizado para facilitar o uso do contexto
export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  // Retorna o locale e a configuração de moeda correspondente
  return {
    ...context,
    config: localeConfig[context.locale],
  };
};
