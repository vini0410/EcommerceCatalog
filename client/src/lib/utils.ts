import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Helper function to determine contrast color (black or white)
export function getContrastColor(hexcolor: string) {
  if (!hexcolor) return '#FFFFFF'; // Default to white if no color provided

  // If a shorthand hex code is provided, expand it
  const fullHex = hexcolor.startsWith('#') ? hexcolor.slice(1) : hexcolor;
  const expandedHex = fullHex.length === 3
    ? fullHex.split('').map(char => char + char).join('')
    : fullHex;

  const r = parseInt(expandedHex.substring(0, 2), 16);
  const g = parseInt(expandedHex.substring(2, 4), 16);
  const b = parseInt(expandedHex.substring(4, 6), 16);

  // Calculate luminance (Y = 0.299 R + 0.587 G + 0.114 B)
  // Perceived brightness (human eye is more sensitive to green)
  const y = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Use black text for light colors, white text for dark colors
  return (y > 0.5) ? '#000000' : '#FFFFFF';
}
