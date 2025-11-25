
import { cn, capitalize, getContrastColor } from './utils';
import { describe, it, expect } from 'vitest';

describe('cn', () => {
  it('should merge class names correctly', () => {
    expect(cn('px-2 py-1', 'bg-red-500', 'text-white')).toBe('px-2 py-1 bg-red-500 text-white');
  });

  it('should handle tailwind conflicts by overriding', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('pt-4', 'p-2')).toBe('p-2');
    expect(cn('mt-4', 'mt-6')).toBe('mt-6');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', true && 'bar', false && 'baz')).toBe('foo bar');
  });

  it('should handle mixed types of inputs', () => {
    expect(cn('text-sm', { 'font-bold': true }, ['tracking-tight', 'leading-normal'])).toBe('text-sm font-bold tracking-tight leading-normal');
  });
});

describe('capitalize', () => {
  it('should capitalize the first letter of a string', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });

  it('should return an empty string for an empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle strings that are already capitalized', () => {
    expect(capitalize('Hello')).toBe('Hello');
  });

  it('should handle strings with numbers or symbols', () => {
    expect(capitalize('123test')).toBe('123test');
    expect(capitalize('!test')).toBe('!test');
  });
});

describe('getContrastColor', () => {
  it('should return black for light colors', () => {
    expect(getContrastColor('#FFFFFF')).toBe('#000000'); // White
    expect(getContrastColor('#F8F8F8')).toBe('#000000'); // Light gray
    expect(getContrastColor('#FFFF00')).toBe('#000000'); // Yellow
  });

  it('should return white for dark colors', () => {
    expect(getContrastColor('#000000')).toBe('#FFFFFF'); // Black
    expect(getContrastColor('#333333')).toBe('#FFFFFF'); // Dark gray
    expect(getContrastColor('#0000FF')).toBe('#FFFFFF'); // Blue
  });

  it('should return white for invalid or empty hex codes', () => {
    expect(getContrastColor('')).toBe('#FFFFFF');
    expect(getContrastColor('invalid-hex')).toBe('#FFFFFF');
    expect(getContrastColor('#FFF')).toBe('#000000'); // Shorthand white, still light
  });

  it('should handle shorthand hex codes', () => {
    expect(getContrastColor('#F00')).toBe('#FFFFFF'); // Red shorthand
    expect(getContrastColor('#0F0')).toBe('#000000'); // Green shorthand
    expect(getContrastColor('#00F')).toBe('#FFFFFF'); // Blue shorthand
  });
});
