export interface TypeCheckDiagnostic {
  code: number;
  message: string;
  line: number;
  column: number;
  segment: 'types' | 'value' | 'general';
}

export interface TypeCheckResult {
  status: 'valid' | 'invalid' | 'error';
  normalizedValue: string;
  diagnostics: TypeCheckDiagnostic[];
}

const compilerPrelude = [
  'interface Boolean {}',
  'interface CallableFunction extends Function {}',
  'interface Function {}',
  'interface IArguments { length: number; [index: number]: unknown; }',
  'interface NewableFunction extends Function {}',
  'interface Number {}',
  'interface Object {}',
  'interface RegExp {}',
  'interface String {}',
  'interface Array<T> { length: number; [index: number]: T; }',
  'interface ReadonlyArray<T> { readonly length: number; readonly [index: number]: T; }',
  'type Record<K extends keyof any, T> = { [P in K]: T };',
  'type Exclude<T, U> = T extends U ? never : T;',
  'type Extract<T, U> = T extends U ? T : never;',
  'type Pick<T, K extends keyof T> = { [P in K]: T[P] };',
  'type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;',
  'type Partial<T> = { [P in keyof T]?: T[P] };',
  'type Required<T> = { [P in keyof T]-?: T[P] };',
].join('\n');

export async function runBrowserTypeCheck(typeSource: string, valueSource: string, rootTypeName: string): Promise<TypeCheckResult> {
  const trimmedTypeSource = typeSource.trim();
  const trimmedRootType = rootTypeName.trim();

  if (!trimmedTypeSource || !trimmedRootType) {
    return {
      status: 'error',
      normalizedValue: valueSource,
      diagnostics: [
        {
          code: 0,
          message: 'Type definitions and root type are required.',
          line: 1,
          column: 1,
          segment: 'general',
        },
      ],
    };
  }

  let normalizedValue = valueSource;
  try {
    normalizedValue = JSON.stringify(JSON.parse(valueSource), null, 2);
  } catch {
    return {
      status: 'error',
      normalizedValue: valueSource,
      diagnostics: [
        {
          code: 0,
          message: 'JSON value is invalid.',
          line: 1,
          column: 1,
          segment: 'value',
        },
      ],
    };
  }

  const ts = await import('typescript');
  const fileName = 'virtual-check.ts';
  const source = `${compilerPrelude}\n\n${trimmedTypeSource}\n\nconst __candidate = ${normalizedValue};\nconst __assertion: ${trimmedRootType} = __candidate;\n`;
  const preludeLines = compilerPrelude.split('\n').length + 2;
  const valueStartLine = preludeLines + trimmedTypeSource.split('\n').length + 2;

  const compilerOptions: import('typescript').CompilerOptions = {
    strict: true,
    noEmit: true,
    noLib: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
  };

  // Build a browser-safe host instead of relying on ts.sys via createCompilerHost.
  const host: import('typescript').CompilerHost = {
    getSourceFile(requestedFileName, languageVersion) {
      if (requestedFileName !== fileName) {
        return undefined;
      }

      return ts.createSourceFile(fileName, source, languageVersion, true, ts.ScriptKind.TS);
    },
    readFile(requestedFileName) {
      return requestedFileName === fileName ? source : undefined;
    },
    fileExists(requestedFileName) {
      return requestedFileName === fileName;
    },
    writeFile() {
      return undefined;
    },
    getDefaultLibFileName() {
      return 'lib.d.ts';
    },
    getCurrentDirectory() {
      return '';
    },
    getDirectories() {
      return [];
    },
    getCanonicalFileName(requestedFileName) {
      return requestedFileName;
    },
    useCaseSensitiveFileNames() {
      return true;
    },
    getNewLine() {
      return '\n';
    },
  };

  const program = ts.createProgram([fileName], compilerOptions, host);
  const diagnostics = ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.code !== 2318)
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      if (!diagnostic.file || typeof diagnostic.start !== 'number') {
        return {
          code: diagnostic.code,
          message,
          line: 1,
          column: 1,
          segment: 'general',
        } satisfies TypeCheckDiagnostic;
      }

      const location = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const absoluteLine = location.line + 1;
      const column = location.character + 1;
      if (absoluteLine >= valueStartLine) {
        return {
          code: diagnostic.code,
          message,
          line: absoluteLine - valueStartLine + 1,
          column,
          segment: 'value',
        } satisfies TypeCheckDiagnostic;
      }

      if (absoluteLine >= preludeLines) {
        return {
          code: diagnostic.code,
          message,
          line: absoluteLine - preludeLines + 1,
          column,
          segment: 'types',
        } satisfies TypeCheckDiagnostic;
      }

      return {
        code: diagnostic.code,
        message,
        line: absoluteLine,
        column,
        segment: 'general',
      } satisfies TypeCheckDiagnostic;
    });

  return {
    status: diagnostics.length === 0 ? 'valid' : 'invalid',
    normalizedValue,
    diagnostics,
  };
}