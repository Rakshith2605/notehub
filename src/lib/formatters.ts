export function prettifyJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

export function minifyJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content));
  } catch {
    return content;
  }
}

export function validateJson(content: string): { valid: boolean; error?: string } {
  try {
    JSON.parse(content);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

export function inferJsonSchema(content: string): { key: string; type: string }[] {
  try {
    const obj = JSON.parse(content);
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return [];
    return Object.entries(obj).map(([key, value]) => ({
      key,
      type: Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value,
    }));
  } catch {
    return [];
  }
}

export function validateYaml(content: string): { valid: boolean; error?: string } {
  try {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const indent = line.search(/\S/);
      if (indent > 0 && indent % 2 !== 0) {
        return { valid: false, error: `Inconsistent indentation at: "${trimmed}"` };
      }
    }
    return { valid: true };
  } catch {
    return { valid: true };
  }
}

export function yamlToJson(content: string): string {
  try {
    const obj = parseSimpleYaml(content);
    return JSON.stringify(obj, null, 2);
  } catch {
    return content;
  }
}

export function jsonToYaml(content: string): string {
  try {
    const obj = JSON.parse(content);
    return jsonToYamlStr(obj, 0);
  } catch {
    return content;
  }
}

function parseSimpleYaml(text: string): unknown {
  const lines = text.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
  const result: Record<string, unknown> = {};
  let currentKey = '';
  let currentIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();
    const indent = line.search(/\S/);
    const colonIdx = trimmed.indexOf(':');

    if (colonIdx > 0) {
      const key = trimmed.slice(0, colonIdx).trim();
      const value: string = trimmed.slice(colonIdx + 1).trim();

      if (value === 'true') result[key] = true;
      else if (value === 'false') result[key] = false;
      else if (value === 'null' || value === '~') result[key] = null;
      else if (/^-?\d+(\.\d+)?$/.test(value)) result[key] = Number(value);
      else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        result[key] = value.slice(1, -1);
      } else if (value === '') {
        result[key] = '';
      } else {
        result[key] = value;
      }

      currentKey = key;
      currentIndent = indent;
    } else if (trimmed.startsWith('- ') && currentIndent >= 0 && indent > currentIndent) {
      const item = trimmed.slice(2).trim();
      const existing = result[currentKey];
      if (Array.isArray(existing)) {
        existing.push(item);
      } else {
        result[currentKey] = [item];
      }
    }
  }

  return result;
}

function jsonToYamlStr(obj: unknown, indent: number): string {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj.toString();
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') {
    if (/[:#\{\}\[\],&\*\?\|<>=!%@`]/.test(obj) || obj.includes('\n')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map((item) => `${' '.repeat(indent)}- ${jsonToYamlStr(item, indent + 2)}`).join('\n');
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0) return '{}';

  return entries
    .map(([key, value]) => {
      const prefix = ' '.repeat(indent);
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return `${prefix}${key}:\n${jsonToYamlStr(value, indent + 2)}`;
      }
      return `${prefix}${key}: ${jsonToYamlStr(value, indent)}`;
    })
    .join('\n');
}

