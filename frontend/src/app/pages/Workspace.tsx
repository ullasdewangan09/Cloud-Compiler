import { useEffect, useState } from 'react';
import {
  BarChart3,
  Download,
  FilePlus2,
  FileText,
  FolderOpen,
  Loader2,
  Play,
  Save,
  Share2,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

import { CodeEditor } from '../components/CodeEditor';
import { InteractiveSessionPanel } from '../components/InteractiveSessionPanel';
import { OutputPanel, ExecutionStatus } from '../components/OutputPanel';
import { StdinInput } from '../components/StdinInput';
import { ExecutionHistory, HistoryItem } from '../components/ExecutionHistory';
import { GlassCard } from '../components/GlassCard';
import {
  apiService,
  CodeFile,
  ExecutionRequest,
  ExecutionResponse,
  InteractiveSessionResponse,
  SavedProject,
  SaveProjectRequest,
} from '../../services/api';
import { sanitizeCodeText } from '../../utils/codeSanitizer';

const DEFAULT_FILENAMES: Record<string, string> = {
  python: 'main.py',
  c: 'main.c',
  cpp: 'main.cpp',
  java: 'Main.java',
};

const PROFILE_OPTIONS: Record<string, string[]> = {
  python: ['python3.10'],
  c: ['c11', 'c17'],
  cpp: ['c++14', 'c++17', 'c++20', 'c++23'],
  java: ['java17'],
};

function createDefaultFiles(language: string): CodeFile[] {
  return [{ filename: DEFAULT_FILENAMES[language] || 'main.txt', content: '' }];
}

function cloneFiles(files: CodeFile[]): CodeFile[] {
  return JSON.parse(JSON.stringify(files));
}

export function Workspace() {
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [language, setLanguage] = useState('python');
  const [files, setFiles] = useState<CodeFile[]>(() => createDefaultFiles('python'));
  const [activeFileName, setActiveFileName] = useState(DEFAULT_FILENAMES.python);
  const [entryFile, setEntryFile] = useState(DEFAULT_FILENAMES.python);
  const [compilerProfile, setCompilerProfile] = useState(PROFILE_OPTIONS.python[0]);
  const [compilerFlags, setCompilerFlags] = useState('');
  const [stdin, setStdin] = useState('');
  const [exportFilename, setExportFilename] = useState('main');
  const [output, setOutput] = useState('');
  const [result, setResult] = useState<ExecutionResponse | null>(null);
  const [status, setStatus] = useState<ExecutionStatus>('idle');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [analyzingComplexity, setAnalyzingComplexity] = useState(false);
  const [interactiveSession, setInteractiveSession] = useState<InteractiveSessionResponse | null>(null);
  const [launchingInteractive, setLaunchingInteractive] = useState(false);
  const [stoppingInteractive, setStoppingInteractive] = useState(false);
  const [complexity, setComplexity] = useState<{
    time_complexity: string;
    space_complexity: string;
    confidence: string;
    notes: string[];
  } | null>(null);

  const activeFile = files.find((file) => file.filename === activeFileName) ?? files[0];

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    if (!files.some((file) => file.filename === activeFileName) && files[0]) {
      setActiveFileName(files[0].filename);
    }
    if (!files.some((file) => file.filename === entryFile) && files[0]) {
      setEntryFile(files[0].filename);
    }
  }, [files, activeFileName, entryFile]);

  useEffect(() => {
    if (!interactiveSession?.session_id) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const nextSession = await apiService.getInteractiveJavaSession(interactiveSession.session_id);
        setInteractiveSession(nextSession);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setInteractiveSession(null);
        }
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [interactiveSession?.session_id]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const projects = await apiService.listProjects();
      setSavedProjects(projects);
    } catch (err: any) {
      toast.error('Failed to load saved projects: ' + err.message);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    if (interactiveSession?.session_id) {
      void apiService.stopInteractiveJavaSession(interactiveSession.session_id).catch(() => undefined);
    }
    setLanguage(newLanguage);
    const nextFiles = createDefaultFiles(newLanguage);
    setFiles(nextFiles);
    setActiveFileName(nextFiles[0].filename);
    setEntryFile(nextFiles[0].filename);
    setCompilerProfile(PROFILE_OPTIONS[newLanguage][0]);
    setCompilerFlags('');
    setComplexity(null);
    setInteractiveSession(null);
  };

  const handleActiveFileChange = (value: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.filename === activeFileName ? { ...file, content: value } : file
      )
    );
  };

  const handleAddFile = () => {
    const filename = window.prompt('Enter a new filename', `helper_${files.length + 1}.txt`);
    if (!filename) return;
    const safeName = filename.trim();
    if (!safeName) return;
    if (files.some((file) => file.filename === safeName)) {
      toast.error('A file with that name already exists.');
      return;
    }
    const nextFile = { filename: safeName, content: '' };
    setFiles((prev) => [...prev, nextFile]);
    setActiveFileName(nextFile.filename);
  };

  const handleRemoveFile = (filename: string) => {
    if (files.length === 1) {
      toast.error('At least one file is required.');
      return;
    }
    const nextFiles = files.filter((file) => file.filename !== filename);
    setFiles(nextFiles);
    if (activeFileName === filename) {
      setActiveFileName(nextFiles[0].filename);
    }
    if (entryFile === filename) {
      setEntryFile(nextFiles[0].filename);
    }
  };

  const buildExecutionPayload = (): ExecutionRequest => {
    const sanitizedFiles = files.map((file) => ({
      filename: file.filename,
      content: sanitizeCodeText(file.content),
    }));
    setFiles(sanitizedFiles);

    return {
      language,
      input: sanitizeCodeText(stdin),
      files: sanitizedFiles,
      entry_file: entryFile,
      compiler_profile: compilerProfile,
      compiler_flags: compilerFlags,
      code: sanitizedFiles.find((file) => file.filename === entryFile)?.content || '',
    };
  };

  const addToHistory = (executionResult: ExecutionResponse) => {
    const newItem: HistoryItem = {
      id: `${Date.now()}`,
      language,
      files: cloneFiles(files),
      entryFile: entryFile,
      stdout: executionResult.stdout,
      stderr: executionResult.stderr,
      output: executionResult.output,
      status: (executionResult.status as ExecutionStatus) || 'success',
      timestamp: new Date(),
      executionTime: executionResult.execution_time_ms,
      totalTimeMs: executionResult.total_time_ms,
      queueWaitMs: executionResult.queue_wait_ms,
      compilerProfile: compilerProfile,
      compilerFlags: compilerFlags,
      diagnostics: executionResult.diagnostics,
      result: executionResult,
    };
    setHistory((prev) => [newItem, ...prev].slice(0, 20));
  };

  const handleRunAsync = async () => {
    const payload = buildExecutionPayload();

    setStatus('submitted');
    setResult(null);
    setOutput('Submitting to execution queue...');

    try {
      const submitResult = await apiService.executeAsync(payload);
      setResult(submitResult);
      setStatus('pending');

      const jobId = submitResult.job_id;
      if (!jobId) {
        throw new Error('Missing job ID from async execution response');
      }

      const deadline = Date.now() + 30000;
      while (Date.now() < deadline) {
        const jobResult = await apiService.getExecutionResult(jobId);
        setResult(jobResult);
        setOutput(jobResult.output || jobResult.error || '');

        if (['success', 'compile_error', 'runtime_error', 'timeout', 'system_error', 'completed'].includes(jobResult.status)) {
          const finalStatus = (jobResult.status === 'completed' ? 'success' : jobResult.status) as ExecutionStatus;
          setStatus(finalStatus);
          addToHistory({ ...jobResult, status: finalStatus });
          if (finalStatus === 'success') {
            toast.success('Code executed successfully!');
          } else {
            toast.error(jobResult.diagnostics?.summary || 'Execution failed');
          }
          return;
        }

        setStatus((jobResult.status as ExecutionStatus) || 'pending');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setStatus('timeout');
      toast.error('Execution timed out while waiting for async result');
    } catch (err: any) {
      setOutput('Error: ' + (err.response?.data?.detail || err.message));
      setStatus('system_error');
      toast.error('Failed to submit code for execution');
    }
  };

  const handleRunSync = async () => {
    const payload = buildExecutionPayload();
    setStatus('running');
    setResult(null);
    setOutput('Executing synchronously...');

    try {
      const executionResult = await apiService.executeSync(payload);
      setResult(executionResult);
      setOutput(executionResult.output || executionResult.error || '');
      setStatus((executionResult.status as ExecutionStatus) || 'success');
      addToHistory(executionResult);

      if (executionResult.status === 'success' || executionResult.status === 'completed') {
        toast.success('Code executed successfully!');
      } else {
        toast.error(executionResult.diagnostics?.summary || 'Execution failed');
      }
    } catch (err: any) {
      setOutput('Error: ' + (err.response?.data?.detail || err.message));
      setStatus('system_error');
      toast.error('Synchronous execution failed');
    }
  };

  const handleRunInteractive = async () => {
    if (language !== 'java') {
      toast.error('Interactive mode is only available for Java Swing.');
      return;
    }

    const payload = buildExecutionPayload();
    setLaunchingInteractive(true);

    try {
      if (interactiveSession?.session_id) {
        await apiService.stopInteractiveJavaSession(interactiveSession.session_id);
        setInteractiveSession(null);
      }

      const session = await apiService.startInteractiveJavaSession(payload);
      if (session.status !== 'ready') {
        setInteractiveSession(null);
        setOutput(session.stderr || session.stdout || session.message);
        setStatus(session.status as ExecutionStatus);
        toast.error(session.message);
        return;
      }
      setInteractiveSession(session);
      toast.success('Interactive Swing session started');
    } catch (err: any) {
      toast.error('Failed to start interactive Swing session: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLaunchingInteractive(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await apiService.importFile(file);
      const nextFile = {
        filename: imported.filename || file.name,
        content: sanitizeCodeText(imported.code || ''),
      };
      setFiles((prev) => {
        const existing = prev.some((item) => item.filename === nextFile.filename);
        if (existing) {
          return prev.map((item) => (item.filename === nextFile.filename ? nextFile : item));
        }
        return [...prev, nextFile];
      });
      setActiveFileName(nextFile.filename);
      setEntryFile(nextFile.filename);
      toast.success(`Imported ${nextFile.filename}`);
    } catch (err: any) {
      toast.error('Failed to import file: ' + err.message);
    }
  };

  const handleExportFile = async (type: 'code' | 'pdf' = 'code') => {
    try {
      const safeBaseName = (exportFilename || 'main').trim() || 'main';
      const currentCode = sanitizeCodeText(activeFile?.content || '');
      const extension = activeFile?.filename.includes('.') ? '' : language === 'python' ? '.py' : language === 'java' ? '.java' : language === 'cpp' ? '.cpp' : '.c';
      const filename = type === 'pdf' ? safeBaseName : `${safeBaseName}${extension}`;
      const blob = await apiService.exportFile(filename, currentCode, type);

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = type === 'pdf' ? `${safeBaseName}.pdf` : filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);

      toast.success(`Exported ${activeFile?.filename || 'file'}`);
    } catch (err: any) {
      toast.error('Failed to export file: ' + err.message);
    }
  };

  const handleAnalyzeComplexity = async () => {
    const currentCode = sanitizeCodeText(activeFile?.content || '');
    if (!currentCode.trim()) {
      toast.error('Write code before analyzing complexity');
      return;
    }

    setAnalyzingComplexity(true);
    try {
      const complexityResult = await apiService.analyzeComplexity(currentCode, language);
      setComplexity(complexityResult);
      toast.success('Complexity analysis complete');
    } catch (err: any) {
      toast.error('Failed to analyze complexity: ' + (err.response?.data?.detail || err.message));
    } finally {
      setAnalyzingComplexity(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    if (interactiveSession?.session_id) {
      void apiService.stopInteractiveJavaSession(interactiveSession.session_id).catch(() => undefined);
      setInteractiveSession(null);
    }
    setLanguage(item.language);
    setFiles(cloneFiles(item.files));
    setActiveFileName(item.entryFile);
    setEntryFile(item.entryFile);
    if (item.compilerProfile) {
      setCompilerProfile(item.compilerProfile);
    }
    setCompilerFlags(item.compilerFlags || '');
    setResult(item.result || null);
    setOutput(item.output);
    setStatus(item.status);
  };

  const applyProject = (project: SavedProject) => {
    if (interactiveSession?.session_id) {
      void apiService.stopInteractiveJavaSession(interactiveSession.session_id).catch(() => undefined);
      setInteractiveSession(null);
    }
    setProjectId(project.id);
    setProjectName(project.name);
    setLanguage(project.language);
    setFiles(cloneFiles(project.files));
    setActiveFileName(project.entry_file);
    setEntryFile(project.entry_file);
    setCompilerProfile(project.compiler_profile || PROFILE_OPTIONS[project.language][0]);
    setCompilerFlags(project.compiler_flags || '');
    setStdin(project.input || '');
    setOutput('');
    setResult(null);
    setStatus('idle');
    toast.success(`Loaded ${project.name}`);
  };

  const buildProjectPayload = (isPublic: boolean): SaveProjectRequest => ({
    name: projectName.trim() || 'Untitled Project',
    language,
    input: stdin,
    files,
    entry_file: entryFile,
    compiler_profile: compilerProfile,
    compiler_flags: compilerFlags,
    is_public: isPublic,
  });

  const handleSaveProject = async (isPublic = false) => {
    setSavingProject(true);
    try {
      const payload = buildProjectPayload(isPublic);
      const saved = projectId
        ? await apiService.updateProject(projectId, payload)
        : await apiService.saveProject(payload);
      setProjectId(saved.id);
      setProjectName(saved.name);
      await loadProjects();
      if (isPublic && saved.share_id) {
        const shareLink = `${window.location.origin}/shared/${saved.share_id}`;
        await navigator.clipboard.writeText(shareLink);
        toast.success('Project saved and share link copied!');
      } else {
        toast.success('Project saved');
      }
      return saved;
    } catch (err: any) {
      toast.error('Failed to save project: ' + err.message);
      return null;
    } finally {
      setSavingProject(false);
    }
  };

  const handleShareProject = async () => {
    try {
      if (!projectId) {
        await handleSaveProject(true);
        return;
      }

      let sharedProject = savedProjects.find((project) => project.id === projectId) || null;
      if (!sharedProject?.share_id) {
        sharedProject = await apiService.shareProject(projectId);
        await loadProjects();
      }

      if (sharedProject?.share_id) {
        const shareLink = `${window.location.origin}/shared/${sharedProject.share_id}`;
        await navigator.clipboard.writeText(shareLink);
        toast.success('Share link copied to clipboard');
      }
    } catch (err: any) {
      toast.error('Failed to generate share link: ' + err.message);
    }
  };

  const handleClearOutput = () => {
    setOutput('');
    setResult(null);
    setStatus('idle');
  };

  const handleStopInteractive = async () => {
    if (!interactiveSession?.session_id) {
      return;
    }

    setStoppingInteractive(true);
    try {
      await apiService.stopInteractiveJavaSession(interactiveSession.session_id);
      setInteractiveSession(null);
      toast.success('Interactive Swing session stopped');
    } catch (err: any) {
      toast.error('Failed to stop interactive session: ' + (err.response?.data?.detail || err.message));
    } finally {
      setStoppingInteractive(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-[1880px] mx-auto">
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
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

            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name"
              className="h-11 min-w-52 rounded-full border border-divider-subtle bg-surface/70 px-4 text-sm font-semibold text-text outline-none transition-all focus:border-sky/40 focus:ring-2 focus:ring-sky/25"
            />
            <button
              onClick={() => void handleSaveProject(false)}
              disabled={savingProject}
              className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60"
            >
              {savingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="text-sm font-medium">Save</span>
            </button>
            <button
              onClick={() => void handleShareProject()}
              className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">Share</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={entryFile}
              onChange={(e) => setEntryFile(e.target.value)}
              className="h-11 rounded-xl border border-divider-subtle bg-surface/70 px-4 text-sm text-text outline-none"
            >
              {files.map((file) => (
                <option key={file.filename} value={file.filename}>
                  Entry: {file.filename}
                </option>
              ))}
            </select>
            <select
              value={compilerProfile}
              onChange={(e) => setCompilerProfile(e.target.value)}
              className="h-11 rounded-xl border border-divider-subtle bg-surface/70 px-4 text-sm text-text outline-none"
            >
              {PROFILE_OPTIONS[language].map((profile) => (
                <option key={profile} value={profile}>
                  {profile}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={compilerFlags}
              onChange={(e) => setCompilerFlags(e.target.value)}
              placeholder="Compiler / runtime flags"
              className="h-11 min-w-60 rounded-xl border border-divider-subtle bg-surface/70 px-4 text-sm text-text outline-none"
            />
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
              <input type="file" onChange={handleImportFile} className="hidden" accept=".py,.c,.cpp,.java,.txt,.h,.hpp" />
            </label>
            <button onClick={() => handleExportFile('code')} className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
            <button onClick={() => handleExportFile('pdf')} className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Export PDF</span>
            </button>
            <button
              onClick={handleAnalyzeComplexity}
              disabled={analyzingComplexity}
              className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {analyzingComplexity ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
              <span className="text-sm font-medium">Analyze</span>
            </button>
            <button
              onClick={handleRunSync}
              disabled={status === 'running' || status === 'pending' || status === 'submitted'}
              className="liquid-run-btn liquid-run-sync"
            >
              {(status === 'running' || status === 'pending' || status === 'submitted') ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              Run Sync
            </button>
            <button
              onClick={handleRunAsync}
              disabled={status === 'running' || status === 'pending' || status === 'submitted'}
              className="liquid-run-btn liquid-run-async"
            >
              {(status === 'running' || status === 'pending' || status === 'submitted') ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" fill="currentColor" />
              )}
              Run Async
            </button>
            {language === 'java' ? (
              <button
                onClick={handleRunInteractive}
                disabled={launchingInteractive || stoppingInteractive}
                className="glass-button px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-60"
              >
                {launchingInteractive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                <span className="text-sm font-medium">Run Interactive</span>
              </button>
            ) : null}
          </div>

          {language === 'java' ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-200/20 px-4 py-3 text-sm text-amber-900">
              Java Swing now supports an interactive browser session. Use `Run Interactive` for live input, or keep using sync/async runs when you want logs and preview artifacts.
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7 h-[calc(100vh-220px)] flex flex-col gap-4">
            <GlassCard className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              {files.map((file) => (
                <div
                  key={file.filename}
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${
                    file.filename === activeFileName
                      ? 'border-sky-400/70 bg-sky-200/30 text-sky-700'
                      : 'border-divider-subtle bg-surface-solid text-text-secondary'
                  }`}
                >
                  <button onClick={() => setActiveFileName(file.filename)}>{file.filename}</button>
                  {files.length > 1 ? (
                    <button onClick={() => handleRemoveFile(file.filename)} className="rounded-full hover:bg-black/5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}
              <button onClick={handleAddFile} className="glass-button px-3 py-2 rounded-full flex items-center gap-2 text-sm">
                <FilePlus2 className="w-4 h-4" />
                Add File
              </button>
            </GlassCard>

            <div className="flex-1 min-h-0">
              <CodeEditor
                code={activeFile?.content || ''}
                language={language}
                onChange={handleActiveFileChange}
              />
            </div>
          </div>

          <div className="col-span-3 flex flex-col gap-6 h-[calc(100vh-220px)]">
            <div className="h-[150px]">
              <StdinInput value={stdin} onChange={setStdin} />
            </div>

            <div className="h-[190px]">
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
                    <p>Run Analyze to estimate time and space complexity for the active file.</p>
                  )}
                </div>
              </GlassCard>
            </div>

            <div className="flex-1 min-h-0">
              <div className="h-full flex flex-col gap-4">
                {language === 'java' && (interactiveSession || launchingInteractive) ? (
                  <div className="h-[320px]">
                    <InteractiveSessionPanel
                      session={interactiveSession}
                      launching={launchingInteractive}
                      stopping={stoppingInteractive}
                      onStop={() => void handleStopInteractive()}
                    />
                  </div>
                ) : null}
                <div className="flex-1 min-h-0">
                  <OutputPanel output={output} status={status} result={result} onClear={handleClearOutput} />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-2 h-[calc(100vh-220px)] flex flex-col gap-6">
            <GlassCard className="flex-1 min-h-0 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <FolderOpen className="w-4 h-4 text-text-secondary" />
                <h3 className="text-sm font-semibold text-text">Saved Projects</h3>
              </div>
              <div className="flex-1 overflow-auto space-y-2">
                {loadingProjects ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : savedProjects.length === 0 ? (
                  <p className="text-sm text-text-secondary">No saved projects yet.</p>
                ) : (
                  savedProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => applyProject(project)}
                      className="w-full rounded-xl border border-divider-subtle bg-surface-solid p-3 text-left hover:bg-surface transition-colors"
                    >
                      <p className="text-sm font-semibold text-text line-clamp-1">{project.name}</p>
                      <p className="text-xs text-text-tertiary mt-1">{project.language.toUpperCase()} · {project.entry_file}</p>
                      <p className="text-[11px] text-text-tertiary mt-1">{project.is_public ? 'Public share link ready' : 'Private saved project'}</p>
                    </button>
                  ))
                )}
              </div>
            </GlassCard>

            <div className="flex-1 min-h-0">
              <ExecutionHistory history={history} onSelect={handleSelectHistory} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
