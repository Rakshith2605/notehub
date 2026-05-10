export interface TagColorOption {
  label: string;
  value: string;
  hex: string;
}

export const TAG_COLOR_OPTIONS: TagColorOption[] = [
  { label: 'Red', value: 'red', hex: '#ef4444' },
  { label: 'Orange', value: 'orange', hex: '#f97316' },
  { label: 'Yellow', value: 'yellow', hex: '#eab308' },
  { label: 'Green', value: 'green', hex: '#22c55e' },
  { label: 'Blue', value: 'blue', hex: '#3b82f6' },
  { label: 'Purple', value: 'purple', hex: '#a855f7' },
  { label: 'Pink', value: 'pink', hex: '#ec4899' },
];

export const TAG_COLORS: Record<string, string> = TAG_COLOR_OPTIONS.reduce(
  (acc, { value, hex }) => {
    acc[value] = hex;
    return acc;
  },
  {} as Record<string, string>
);

export function getTagColor(value: string): string {
  return TAG_COLORS[value] || TAG_COLORS.blue;
}
