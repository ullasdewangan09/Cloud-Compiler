import Editor from '@monaco-editor/react';
import { GlassCard } from './GlassCard';
import { Loader2 } from 'lucide-react';
import { sanitizeCodeText } from '../../utils/codeSanitizer';

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ code, language, onChange, readOnly = false }: CodeEditorProps) {
  const getMonacoLanguage = (lang: string) => {
    const languageMap: Record<string, string> = {
      python: 'python',
      c: 'c',
      cpp: 'cpp',
      java: 'java',
    };
    return languageMap[lang] || 'python';
  };

  return (
    <GlassCard className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text">Code Editor</h3>
        <span className="px-3 py-1 bg-sky/30 text-sky-deep dark:text-sky text-xs font-medium rounded-lg">
          {language.toUpperCase()}
        </span>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden border border-divider-subtle">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(value) => onChange(sanitizeCodeText(value || ''))}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            readOnly,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-surface-solid">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
        />
      </div>
    </GlassCard>
  );
}
