import React, { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import CodeBlock from "../CodeBlock/CodeBlock";
import Catalogue, { Components, resolveImportPath } from "../../../projects/Stack/NodeJS/React/Components/Catalogue/Catalogue";

interface CodeEditorProps {
  componentName?: string;
  props?: Record<string, any>;
  setProps?: (props: Record<string, any>) => void;
  propOptions?: Record<string, any[]>;
  value?: string;
  onChange?: (val: string) => void;
  language?: string;
  height?: string;
  headerActions?: React.ReactNode;
  showCopy?: boolean;
}

const formatValue = (value: any): string => {
  if (value === undefined || value === null) return "undefined";
  if (typeof value === "boolean") return `{${value}}`;
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return `{${value}}`;
  if (Array.isArray(value)) return `{${JSON.stringify(value)}}`;
  if (typeof value === "object") return `{${JSON.stringify(value)}}`;
  return `"${value}"`;
};

const generateCode = (componentName: string, props: Record<string, any>): string => {
  if (!componentName) return "";
  const propLines = Object.entries(props)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `  ${key}=${formatValue(value)}`);
  if (propLines.length === 0) return `<${componentName} />`;
  return `<${componentName}\n${propLines.join("\n")}\n/>`;
};

const parseCode = (code: string, knownKeys: string[]): Record<string, any> | null => {
  try {
    const result: Record<string, any> = {};
    const stringProp = /(\w+)="([^"]*)"/g;
    const exprProp = /(\w+)=\{([^}]*)\}/g;
    const booleanFlag = /\s+(\w+)(?=\s|\/|>)(?!=)/g;
    let match;

    while ((match = stringProp.exec(code)) !== null) {
      if (knownKeys.includes(match[1])) result[match[1]] = match[2];
    }
    while ((match = exprProp.exec(code)) !== null) {
      const key = match[1];
      if (!knownKeys.includes(key)) continue;
      const raw = match[2].trim();
      if (raw === "") continue;
      if (raw === "true") result[key] = true;
      else if (raw === "false") result[key] = false;
      else if (!isNaN(Number(raw))) result[key] = Number(raw);
      else { try { result[key] = JSON.parse(raw); } catch { result[key] = raw; } }
    }

    const tagContent = code.replace(/<\w+/, "").replace(/\/>|>[\s\S]*<\/\w+>/, "");
    const usedKeys = new Set(Object.keys(result));
    while ((match = booleanFlag.exec(tagContent)) !== null) {
      const key = match[1];
      if (!usedKeys.has(key) && knownKeys.includes(key)) result[key] = true;
    }
    return result;
  } catch {
    return null;
  }
};

const loadComponentMeta = async (category: string, name: string): Promise<{
  propKeys: string[];
  propOptions: Record<string, any[]>;
  defaultProps: Record<string, any>;
} | null> => {
  try {
    const isFlat = cataloguePathType[category] === "flat";
    const mod = isFlat
      ? await import(/* @vite-ignore */ `./../../../../../components/${category}/${name}`)
      : await import(/* @vite-ignore */ `./../../../../../components/${category}/${name}/${name}`);
    const lower = name.toLowerCase();
    const propKeys: string[] = mod[`${lower}PropKeys`] ?? Object.keys(mod[`${lower}DefaultProps`] ?? {});
    const propOptions: Record<string, any[]> = mod[`${lower}PropOptions`] ?? {};
    const defaultProps: Record<string, any> = mod[`${lower}DefaultProps`] ?? {};
    return { propKeys, propOptions, defaultProps };
  } catch {
    return null;
  }
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  componentName,
  props = {},
  setProps,
  propOptions = {},
  value,
  onChange,
  language = "typescript",
  height = "300px",
  headerActions,
  showCopy = false,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const disposablesRef = useRef<monaco.IDisposable[]>([]);

  const isPropsMode = !!componentName;
  const code = isPropsMode ? generateCode(componentName!, props) : (value ?? "");
  const knownKeys = Object.keys(props);

  const registerCompletions = async () => {
    if (!isPropsMode) return;
    disposablesRef.current.forEach(d => d.dispose());
    disposablesRef.current = [];

    const allComponentNames = Object.entries(Catalogue).flatMap(([cat, names]) =>
      names.map(name => ({ name, category: cat }))
    );

    const metaMap: Record<string, { propKeys: string[]; propOptions: Record<string, any[]>; defaultProps: Record<string, any> }> = {};
    await Promise.all(
      allComponentNames.map(async ({ name, category }) => {
        const meta = await loadComponentMeta(category, name);
        if (meta) metaMap[name] = meta;
      })
    );

    const provider = monaco.languages.registerCompletionItemProvider("typescript", {
      triggerCharacters: [" ", "\n", "=", "<", "{", '"'],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
        const currentLine = model.getLineContent(position.lineNumber);
        const word = model.getWordUntilPosition(position);
        const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
        const suggestions: monaco.languages.CompletionItem[] = [];

        const insideComponent = textUntilPosition.lastIndexOf("<") > textUntilPosition.lastIndexOf("/>");
        const afterEquals = /\w+=["'{]?\s*$/.test(textUntilPosition);
        const propNameMatch = currentLine.slice(0, position.column - 1).match(/(\w+)=["'{]?[^"'\n}]*$/);
        const currentPropName = propNameMatch ? propNameMatch[1] : null;

        if (afterEquals && currentPropName) {
          const opts: any[] = propOptions[currentPropName] ?? metaMap[componentName!]?.propOptions[currentPropName] ?? [];
          const isBool = typeof props[currentPropName] === "boolean";
          if (isBool) {
            [true, false].forEach(v => suggestions.push({ label: String(v), kind: monaco.languages.CompletionItemKind.Value, insertText: `{${v}}`, range }));
          }
          opts.forEach(opt => {
            const isStr = typeof opt === "string";
            suggestions.push({ label: String(opt), kind: monaco.languages.CompletionItemKind.Value, insertText: isStr ? `"${opt}"` : `{${opt}}`, range });
          });
          return { suggestions };
        }

        if (insideComponent && !afterEquals) {
          const usedProps = new Set<string>();
          const m1 = /(\w+)=/g; let m;
          while ((m = m1.exec(model.getValue())) !== null) usedProps.add(m[1]);
          knownKeys.filter(k => !usedProps.has(k)).forEach(key => {
            const val = props[key];
            const isBool = typeof val === "boolean";
            const isStr = typeof val === "string";
            const insertText = isBool ? `${key}={\${1:${val}}}` : isStr ? `${key}="\${1:${val}}"` : `${key}={\${1}}`;
            suggestions.push({ label: key, kind: monaco.languages.CompletionItemKind.Property, insertText, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: `${typeof val} prop`, range });
          });
        }

        if (!insideComponent || /<(\w+)[\s\S]*>\s*$/.test(textUntilPosition)) {
          allComponentNames.forEach(({ name }) => {
            const meta = metaMap[name];
            const snippet = meta ? `<${name}\n${meta.propKeys.map((k, i) => `  ${k}={\${${i + 1}}}`).join("\n")}\n/>` : `<${name} />`;
            suggestions.push({ label: name, kind: monaco.languages.CompletionItemKind.Class, insertText: snippet, insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, detail: "Component", range });
          });
        }
        return { suggestions };
      },
    });
    disposablesRef.current.push(provider);
  };

  const handleApply = () => {
    const val = editorRef.current?.getValue() ?? "";
    if (isPropsMode) {
      const parsed = parseCode(val, knownKeys);
      if (parsed && setProps) setProps(parsed);
    } else {
      onChange?.(val);
    }
  };

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    registerCompletions();
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleApply);
  };

  useEffect(() => {
    registerCompletions();
    return () => { disposablesRef.current.forEach(d => d.dispose()); };
  }, [componentName, JSON.stringify(props), JSON.stringify(propOptions)]);

  const applyBtn = (
    <button
      onClick={handleApply}
      style={{ padding: "2px 10px", backgroundColor: "#2a2a2a", color: "#aaa", border: "1px solid #444", borderRadius: "3px", cursor: "pointer", fontSize: "11px", fontFamily: "monospace" }}
    >
      apply
    </button>
  );

  return (
    <CodeBlock
      language={language}
      showCopy={showCopy}
      headerRight={headerActions ?? applyBtn}
      style={{ maxHeight: "100%" }}
    >
      <Editor
        height={height}
        defaultLanguage="typescript"
        value={code}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 13.5,
          lineHeight: 21,
          scrollBeyondLastLine: false,
          wordWrap: "off",
          automaticLayout: true,
          suggestOnTriggerCharacters: true,
          quickSuggestions: { other: true, comments: false, strings: true },
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          formatOnType: true,
          padding: { top: 8, bottom: 8 },
        }}
        onMount={handleMount}
        onChange={val => { if (!isPropsMode) onChange?.(val ?? ""); }}
      />
    </CodeBlock>
  );
};

export default CodeEditor;