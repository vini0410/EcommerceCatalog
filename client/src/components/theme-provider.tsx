import { ThemeProvider as ThemeProviderCore } from "@/hooks/use-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeProviderCore defaultTheme="light">{children}</ThemeProviderCore>;
}
