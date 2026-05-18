/**
 * Mermaid tool — pure helpers only. The actual render (mermaid.render) is
 * impure (needs the DOM) and lives in the component with a client-only
 * dynamic import. Diagram syntax is language-neutral, so templates are
 * constants, not translated.
 */

export type MermaidTemplateId = 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'gitgraph';

export const MERMAID_TEMPLATES: Record<MermaidTemplateId, string> = {
  flowchart: `flowchart TD
  A[Start] --> B{Decision?}
  B -- Yes --> C[Do the thing]
  B -- No --> D[Skip]
  C --> E[End]
  D --> E`,
  sequence: `sequenceDiagram
  participant U as User
  participant API
  participant DB
  U->>API: request
  API->>DB: query
  DB-->>API: rows
  API-->>U: response`,
  class: `classDiagram
  class Tool {
    +string id
    +run() void
  }
  class HashTool
  Tool <|-- HashTool`,
  state: `stateDiagram-v2
  [*] --> Idle
  Idle --> Loading: fetch
  Loading --> Done: ok
  Loading --> Error: fail
  Error --> Idle: retry
  Done --> [*]`,
  er: `erDiagram
  USER ||--o{ SNIPPET : owns
  USER {
    string id
    string email
  }
  SNIPPET {
    string id
    string title
  }`,
  gitgraph: `gitGraph
  commit
  branch feature
  checkout feature
  commit
  checkout main
  merge feature`,
};

export const MERMAID_TEMPLATE_IDS = Object.keys(MERMAID_TEMPLATES) as MermaidTemplateId[];

/** Cheap heuristic: does this look like a mermaid diagram at all? */
export function looksLikeMermaid(code: string): boolean {
  const head = code.trim().split(/\s|\n/)[0]?.toLowerCase() ?? '';
  return [
    'flowchart',
    'graph',
    'sequencediagram',
    'classdiagram',
    'statediagram',
    'statediagram-v2',
    'erdiagram',
    'gitgraph',
    'journey',
    'pie',
    'mindmap',
    'timeline',
    'quadrantchart',
  ].includes(head);
}

/** Safe SVG download filename from a user-provided name. */
export function svgFilename(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'diagram'}.svg`;
}
