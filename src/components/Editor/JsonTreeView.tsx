'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Copy } from 'lucide-react';

interface TreeNode {
  key: string;
  value: unknown;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
}

function getType(value: unknown): TreeNode['type'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'string';
}

function buildTree(value: unknown, prefix = ''): TreeNode[] {
  if (typeof value !== 'object' || value === null) return [];

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as [string, unknown])
    : Object.entries(value as Record<string, unknown>);

  return entries.map(([key, val]) => ({
    key,
    value: val,
    path: prefix ? `${prefix}.${key}` : key,
    type: getType(val),
  }));
}

const TYPE_COLORS: Record<string, string> = {
  string: '#ce9178',
  number: '#b5cea8',
  boolean: '#569cd6',
  null: '#808080',
  object: '#dcdcaa',
  array: '#dcdcaa',
};

interface JsonTreeViewProps {
  content: string;
  language: string;
}

export default function JsonTreeView({ content, language }: JsonTreeViewProps) {
  let parsed: unknown;

  if (language === 'json') {
    try {
      parsed = JSON.parse(content);
    } catch {
      return <div className="p-4 text-xs text-red-400">Invalid JSON</div>;
    }
  } else {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-2 font-mono text-xs">
      <TreeLevel nodes={buildTree(parsed)} level={0} />
    </div>
  );
}

function TreeLevel({ nodes, level }: { nodes: TreeNode[]; level: number }) {
  return (
    <>
      {nodes.map((node) => (
        <TreeNodeRow key={node.path} node={node} level={level} />
      ))}
    </>
  );
}

function TreeNodeRow({ node, level }: { node: TreeNode; level: number }) {
  const [expanded, setExpanded] = useState(true);
  const isExpandable = node.type === 'object' || node.type === 'array';

  const copyValue = () => {
    const text = typeof node.value === 'string' ? node.value : JSON.stringify(node.value);
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <div
        className="flex items-center gap-1 hover:bg-surface-hover rounded px-1 py-0.5 group"
        style={{ paddingLeft: `${level * 16 + 4}px` }}
      >
        {isExpandable && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 text-muted hover:text-foreground"
          >
            {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          </button>
        )}
        {!isExpandable && <span className="w-4" />}

        <span className="text-[#9cdcfe]">{node.key}</span>
        <span className="text-muted">:</span>

        {isExpandable ? (
          <span className="text-muted">
            {node.type === 'array'
              ? `[${(node.value as unknown[]).length}]`
              : `{${Object.keys(node.value as object).length}}`}
          </span>
        ) : (
          <span style={{ color: TYPE_COLORS[node.type] }}>
            {node.type === 'string'
              ? `"${(node.value as string).slice(0, 50)}${(node.value as string).length > 50 ? '...' : ''}"`
              : node.type === 'null'
              ? 'null'
              : String(node.value)}
          </span>
        )}

        <button
          onClick={copyValue}
          className="opacity-0 group-hover:opacity-100 p-0.5 text-muted hover:text-foreground ml-auto"
        >
          <Copy size={10} />
        </button>
      </div>

      {isExpandable && expanded && (
        <TreeLevel nodes={buildTree(node.value, node.path)} level={level + 1} />
      )}
    </div>
  );
}
