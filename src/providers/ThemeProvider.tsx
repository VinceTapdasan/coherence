import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

type ColorSet = typeof Colors.light;

interface ThemeContextType {
  colors: ColorSet;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors.light,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useThemeContext = () => useContext(ThemeContext);
