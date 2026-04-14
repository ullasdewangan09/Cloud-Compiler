import { memo } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAppSettings } from '../../context/AppSettingsContext';

// Define custom themes for Monaco
const defineThemes = (monaco: any) => {
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '75715e' },
      { token: 'keyword', foreground: 'f92672' },
      { token: 'string', foreground: 'e6db74' },
      { token: 'number', foreground: 'ae81ff' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#90908a',
      'editor.lineHighlightBackground': '#3e3d32',
    }
  });

  monaco.editor.defineTheme('dracula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6272a4' },
      { token: 'keyword', foreground: 'ff79c6' },
      { token: 'string', foreground: 'f1fa8c' },
    ],
    colors: {
      'editor.background': '#282a36',
      'editor.foreground': '#f8f8f2',
      'editorLineNumber.foreground': '#6272a4',
      'editor.lineHighlightBackground': '#44475a',
    }
  });

  monaco.editor.defineTheme('cobalt', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#002240',
      'editor.foreground': '#ffffff',
      'editorLineNumber.foreground': '#0088ff',
      'editor.lineHighlightBackground': '#003366',
    }
  });
};

interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export const CodeEditor = memo(({ code, language, onChange, readOnly = false }: CodeEditorProps) => {
  const { isDark } = useTheme();
  const { settings } = useAppSettings();

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
    <div className="sk-plate sk-panel h-full flex flex-col p-5 border-divider">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="sk-indicator text-cyan animate-pulse" />
          <h3 className="text-[10px] font-black text-text uppercase tracking-[0.2em]">Matrix_Core</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="sk-display sk-panel px-3 py-1 text-text-tertiary text-[8px] font-black uppercase tracking-widest border-divider opacity-40">
            TS:{settings.tabSize} // FS:{settings.fontSize}
          </span>
          <span className="sk-display sk-panel px-3 py-1 text-cyan text-[10px] font-black uppercase tracking-widest border-divider">
            LVL:{language.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="flex-1 sk-display sk-panel overflow-hidden border-divider">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(value) => onChange(value || '')}
          theme={settings.editorTheme}
          beforeMount={defineThemes}
          options={{
            minimap: { enabled: settings.minimap },
            fontSize: settings.fontSize,
            fontFamily: settings.fontFamily,
            lineNumbers: settings.lineNumbers,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: settings.tabSize,
            wordWrap: settings.wordWrap,
            autoIndent: 'full',
            autoClosingBrackets: 'languageDefined',
            autoClosingQuotes: 'languageDefined',
            autoSurround: 'languageDefined',
            formatOnType: true,
            cursorBlinking: settings.cursorBlinking,
            readOnly,
          }}
          loading={
            <div className="flex items-center justify-center h-full bg-black/40">
              <Loader2 className="w-8 h-8 animate-spin text-cyan" />
            </div>
          }
        />
      </div>
    </div>
  );
});
