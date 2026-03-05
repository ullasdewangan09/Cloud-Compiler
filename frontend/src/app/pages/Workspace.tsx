import { useState } from 'react';
import { Play, Zap, Upload, Download, FileText, BarChart3, Loader2 } from 'lucide-react';
import { CodeEditor } from '../components/CodeEditor';
import { OutputPanel, ExecutionStatus } from '../components/OutputPanel';
import { StdinInput } from '../components/StdinInput';
import { ExecutionHistory, HistoryItem } from '../components/ExecutionHistory';
import { GlassCard } from '../components/GlassCard';
import { apiService } from '../../services/api';
import { toast } from 'sonner';
import { sanitizeCodeText } from '../../utils/codeSanitizer';

const DEFAULT_CODE: Record<string, string> = {
  python: '',
  c: '',
  cpp: '',
  java: '',
};

export function Workspace() {
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(DEFAULT_CODE.python);
  const [stdin, setStdin] = useState('');
  const [exportFilename, setExportFilename] = useState('main');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analyzingComplexity, setAnalyzingComplexity] = useState(false);
  const [complexity, setComplexity] = useState<{
    time_complexity: string;
    space_complexity: string;
    confidence: string;
    notes: string[];
  } | null>(null);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang] || '');
    setComplexity(null);
  };

  const handleRunAsync = async () => {
    const sanitizedCode = sanitizeCodeText(code);
    if (sanitizedCode !== code) {
      setCode(sanitizedCode);
    }

    setStatus('submitted');
    setOutput('Submitting to execution queue...\n');

    try {
      const result = await apiService.executeAsync(sanitizedCode, language, stdin);
      const jobId = result.job_id;
      setOutput((prev) => prev + `Job ID: ${jobId}\nPolling for results...\n`);
      setStatus('pending');

      // Poll for results
      const pollInterval = setInterval(async () => {
        try {
          const jobResult = await apiService.getExecutionResult(jobId);
          
          if (jobResult.status === 'completed' || jobResult.status === 'success') {
            clearInterval(pollInterval);
            setOutput(jobResult.output || 'Execution completed successfully');
            setStatus('success');
            addToHistory('success', jobResult.output, jobResult.execution_time);
            toast.success('Code executed successfully!');
          } else if (
            jobResult.status === 'runtime_error' ||
            jobResult.status === 'timeout' ||
            jobResult.status === 'system_error'
          ) {
            clearInterval(pollInterval);
            setOutput(jobResult.output || `Error: ${jobResult.status}`);
            setStatus(jobResult.status);
            addToHistory(jobResult.status, jobResult.output);
            toast.error('Execution failed');
          } else if (jobResult.status === 'running') {
            setStatus('running');
            setOutput((prev) => prev + '.');
          }
        } catch (err: any) {
          clearInterval(pollInterval);
          setOutput('Error polling job status: ' + err.message);
          setStatus('system_error');
          toast.error('Failed to poll execution status');
        }
      }, 1000);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(pollInterval);
        if (status === 'pending' || status === 'running') {
          setStatus('timeout');
          setOutput((prev) => prev + '\nExecution timed out');
          toast.error('Execution timed out');
        }
      }, 30000);
    } catch (err: any) {
      setOutput('Error: ' + (err.response?.data?.detail || err.message));
      setStatus('system_error');
      toast.error('Failed to submit code for execution');
    }
  };

  const handleRunSync = async () => {
    const sanitizedCode = sanitizeCodeText(code);
    if (sanitizedCode !== code) {
      setCode(sanitizedCode);
    }

    setStatus('running');
    setOutput('Executing synchronously...\n');

    try {
      const result = await apiService.executeSync(sanitizedCode, language, stdin);
      setOutput(result.output || 'Execution completed');
      setStatus(result.status || 'success');
      addToHistory(result.status || 'success', result.output, result.execution_time);
      
      if (result.status === 'success' || result.status === 'completed') {
        toast.success('Code executed successfully!');
      } else {
        toast.error('Execution failed');
      }
    } catch (err: any) {
      setOutput('Error: ' + (err.response?.data?.detail || err.message));
      setStatus('system_error');
      toast.error('Synchronous execution failed');
    }
  };

  const addToHistory = (
    status: ExecutionStatus,
    output: string,
    executionTime?: number
  ) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      language,
      code,
      output,
      status,
      timestamp: new Date(),
      executionTime,
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 20));
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await apiService.importFile(file);
      setCode(sanitizeCodeText(result.code || ''));
      toast.success(`Imported ${result.filename}`);
    } catch (err: any) {
      toast.error('Failed to import file: ' + err.message);
    }
  };

  const handleExportFile = async (type: 'code' | 'pdf' = 'code') => {
    try {
      const sanitizedCode = sanitizeCodeText(code);
      if (sanitizedCode !== code) {
        setCode(sanitizedCode);
      }
      const safeBaseName = (exportFilename || 'main').trim() || 'main';
      const extension = language === 'python' ? 'py' : language === 'java' ? 'java' : language === 'cpp' ? 'cpp' : 'c';
      const filename = type === 'pdf' ? safeBaseName : `${safeBaseName}.${extension}`;
      const blob = await apiService.exportFile(filename, sanitizedCode, type);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'pdf' ? `${safeBaseName}.pdf` : filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Exported as ${type === 'pdf' ? 'PDF' : 'code file'}`);
    } catch (err: any) {
      toast.error('Failed to export file: ' + err.message);
    }
  };

  const handleAnalyzeComplexity = async () => {
    const sanitizedCode = sanitizeCodeText(code);
    if (sanitizedCode !== code) {
      setCode(sanitizedCode);
    }

    if (!sanitizedCode.trim()) {
      toast.error('Write code before analyzing complexity');
      return;
    }

    setAnalyzingComplexity(true);
    try {
      const result = await apiService.analyzeComplexity(sanitizedCode, language);
      setComplexity(result);
      toast.success('Complexity analysis complete');
    } catch (err: any) {
      toast.error('Failed to analyze complexity: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAnalyzingComplexity(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setLanguage(item.language);
    setCode(sanitizeCodeText(item.code));
    setOutput(item.output);
    setStatus(item.status);
  };

  const handleClearOutput = () => {
    setOutput('');
    setStatus('idle');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Top Controls */}
        <div className="mb-6 flex items-center justify-between">
          {/* Language Selector */}
          <div className="flex items-center gap-3">
            {[
              { value: 'python', label: 'Python' },
              { value: 'c', label: 'C' },
              { value: 'cpp', label: 'C++' },
              { value: 'java', label: 'Java' },
            ].map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
                  language === lang.value
                    ? 'bg-sky-200/45 text-sky-700 border-sky-400/70 shadow-[0_8px_20px_rgba(56,189,248,0.22)]'
                    : 'bg-slate-900/75 text-slate-100 border-slate-700/85 hover:bg-slate-800/85 hover:border-slate-500'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={exportFilename}
              onChange={(e) => setExportFilename(e.target.value)}
              placeholder="main"
              className="h-11 w-32 rounded-full border border-divider-subtle bg-surface/70 px-4 text-sm font-semibold text-text outline-none transition-all focus:border-sky/40 focus:ring-2 focus:ring-sky/25"
              title="Filename for export"
            />
            <label className="glass-button px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">Import</span>
              <input
                type="file"
                onChange={handleImportFile}
                className="hidden"
                accept=".py,.c,.cpp,.java,.txt"
              />
            </label>
            <button
              onClick={() => handleExportFile('code')}
              className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
            <button
              onClick={() => handleExportFile('pdf')}
              className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Export PDF</span>
            </button>
            <button
              onClick={handleAnalyzeComplexity}
              disabled={analyzingComplexity}
              className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {analyzingComplexity ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Analyze</span>
            </button>
            <button
              onClick={handleRunSync}
              disabled={status === 'running' || status === 'pending'}
              className="liquid-run-btn liquid-run-sync"
            >
              {(status === 'running' || status === 'pending') ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              Run Sync
            </button>
            <button
              onClick={handleRunAsync}
              disabled={status === 'running' || status === 'pending'}
              className="liquid-run-btn liquid-run-async"
            >
              {(status === 'running' || status === 'pending') ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
              Run Async
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Code Editor */}
          <div className="col-span-7 h-[calc(100vh-200px)]">
            <CodeEditor code={code} language={language} onChange={setCode} />
          </div>

          {/* Middle Panel - Input & Output */}
          <div className="col-span-3 flex flex-col gap-6 h-[calc(100vh-200px)]">
            <div className="h-[150px]">
              <StdinInput value={stdin} onChange={setStdin} />
            </div>
            <div className="h-[170px]">
              <GlassCard className="h-full flex flex-col" hover={false}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-text">Complexity</h3>
                  <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    {complexity?.confidence || 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg border border-divider-subtle bg-surface-solid px-3 py-2">
                    <p className="text-xs text-text-tertiary">Time</p>
                    <p className="text-sm font-bold text-text">{complexity?.time_complexity || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border border-divider-subtle bg-surface-solid px-3 py-2">
                    <p className="text-xs text-text-tertiary">Space</p>
                    <p className="text-sm font-bold text-text">{complexity?.space_complexity || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-xs text-text-secondary overflow-auto">
                  {complexity?.notes?.length ? (
                    complexity.notes.map((note, idx) => (
                      <p key={idx} className="leading-5">- {note}</p>
                    ))
                  ) : (
                    <p>Run Analyze to estimate time and space complexity.</p>
                  )}
                </div>
              </GlassCard>
            </div>
            <div className="flex-1 min-h-0">
              <OutputPanel output={output} status={status} onClear={handleClearOutput} />
            </div>
          </div>

          {/* Right Panel - History */}
          <div className="col-span-2 h-[calc(100vh-200px)]">
            <ExecutionHistory history={history} onSelect={handleSelectHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
