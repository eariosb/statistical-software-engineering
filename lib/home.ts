export type CanvasItem = {
  label: string;
  description: string;
};

export function extractDataProductCanvas(content: string): CanvasItem[] {
  const lines = content.split('\n');
  const start = lines.findIndex((line) => line.toLowerCase().includes('data product canvas'));
  if (start === -1) return [];

  return lines
    .slice(start + 1, start + 16)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('\u25e6') || line.startsWith('-'))
    .map((line) => {
      const cleaned = line.replace(/^[\u25e6\-\s]+/, '');
      const colon = cleaned.indexOf(':');
      if (colon === -1) return { label: cleaned, description: '' };
      return {
        label: cleaned.slice(0, colon).trim(),
        description: cleaned.slice(colon + 1).trim(),
      };
    });
}
