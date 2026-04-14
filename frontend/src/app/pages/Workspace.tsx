import { useEffect, useState, useCallback, useMemo } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  BarChart3,
  Download,
  FileCode2,
  FolderOpen,
  Layout,
  LayoutPanelLeft,
  Loader2,
  Play,
  Save,
  Plus,
  Rocket,
  Search,
  Settings2,
  Share2,
  Sliders,
  Terminal,
  Upload,
  X,
  Zap,
  ChevronDown,
  Cpu,
  MoreVertical,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { CodeEditor } from '../components/CodeEditor';
import { InteractiveSessionPanel } from '../components/InteractiveSessionPanel';
import { OutputPanel, ExecutionStatus } from '../components/OutputPanel';
import { StdinInput } from '../components/StdinInput';
import { ExecutionHistory, HistoryItem } from '../components/ExecutionHistory';
import { SettingsModal } from '../components/SettingsModal';
import { RepositoryManager } from '../components/RepositoryManager';
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
import { useAuth } from '../../context/AuthContext';

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
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<number | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [language, setLanguage] = useState('python');
  const [files, setFiles] = useState<CodeFile[]>(() => createDefaultFiles('python'));
  const [activeFileName, setActiveFileName] = useState(DEFAULT_FILENAMES.python);
  const [entryFile, setEntryFile] = useState(DEFAULT_FILENAMES.python);
  const [compilerProfile, setCompilerProfile] = useState(PROFILE_OPTIONS.python[0]);
  const [compilerFlags, setCompilerFlags] = useState('');
  const [stdin, setStdin] = useState('');
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRepoManagerOpen, setIsRepoManagerOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState<'output' | 'input' | 'metrics'>('output');
  const [isResizing, setIsResizing] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'project' | 'language' | null>(null);

  const activeFile = useMemo(() =>
    files.find((file) => file.filename === activeFileName) ?? files[0],
    [files, activeFileName]
  );

  const handleRenameActiveFile = useCallback((newName: string) => {
    setFiles(prev => prev.map(f => 
      f.filename === activeFileName ? { ...f, filename: newName } : f
    ));
    if (entryFile === activeFileName) {
      setEntryFile(newName);
    }
    setActiveFileName(newName);
  }, [activeFileName, entryFile]);

  const handleCreateNewProject = useCallback(() => {
    setProjectId(null);
    setProjectName('Untitled Project');
    setLanguage('python');
    const nextFiles = createDefaultFiles('python');
    setFiles(nextFiles);
    setActiveFileName(nextFiles[0].filename);
    setEntryFile(nextFiles[0].filename);
    setCompilerProfile(PROFILE_OPTIONS.python[0]);
    setCompilerFlags('');
    setStdin('');
    setOutput('');
    setResult(null);
    setStatus('idle');
    setComplexity(null);
    setInteractiveSession(null);
    toast.success('Matrix Cleared: Initializing new project frame.');
  }, []);

  const handleSelectProject = useCallback((project: SavedProject) => {
    setProjectId(project.id);
    setProjectName(project.name);
    setLanguage(project.language);
    setFiles(project.files);
    setActiveFileName(project.entry_file);
    setEntryFile(project.entry_file);
    setCompilerProfile(project.compiler_profile || PROFILE_OPTIONS[project.language][0]);
    setCompilerFlags(project.compiler_flags);
    setStdin(project.input);
    setComplexity(null);
    setInteractiveSession(null);
    setIsRepoManagerOpen(false);
    toast.success(`Project Loaded: ${project.name}`);
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const projects = await apiService.listProjects();
      setSavedProjects(projects);
    } catch (err: any) {
      toast.error('Failed to load saved projects: ' + err.message);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    if (interactiveSession?.session_id) {
      void apiService.stopInteractiveJavaSession(interactiveSession.session_id).catch(() => undefined);
      setInteractiveSession(null);
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
  }, [interactiveSession?.session_id]);

  const handleActiveFileChange = useCallback((value: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.filename === activeFileName ? { ...file, content: value } : file
      )
    );
  }, [activeFileName]);

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

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!files.some((file) => file.filename === activeFileName) && files[0]) {
      setActiveFileName(files[0].filename);
    }
    if (!files.some((file) => file.filename === entryFile) && files[0]) {
      setEntryFile(files[0].filename);
    }
  }, [files, activeFileName, entryFile]);

  const handleAddFile = useCallback(() => {
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
  }, [files.length, files]);

  const handleRemoveFile = useCallback((filename: string) => {
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
  }, [files, activeFileName, entryFile]);

  const buildExecutionPayload = useCallback((): ExecutionRequest => {
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
  }, [files, language, stdin, entryFile, compilerProfile, compilerFlags]);

  const addToHistory = useCallback((executionResult: ExecutionResponse) => {
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
  }, [language, files, entryFile, compilerProfile, compilerFlags]);

  const handleRunAsync = useCallback(async () => {
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
  }, [buildExecutionPayload, addToHistory]);

  const handleRunSync = useCallback(async () => {
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
  }, [buildExecutionPayload, addToHistory]);

  const handleLaunchInteractive = useCallback(async () => {
    if (language !== 'java') return;
    
    // Switch to output tab immediately
    setActiveRightTab('output');
    
    const payload = buildExecutionPayload();
    setLaunchingInteractive(true);
    setInteractiveSession(null);
    setOutput('Initializing GUI Matrix Session...');

    try {
      const session = await apiService.startInteractiveJavaSession(payload);
      setInteractiveSession(session);
      toast.success('GUI Session Established');
    } catch (err: any) {
      toast.error('Failed to launch GUI session: ' + (err.response?.data?.detail || err.message));
      setInteractiveSession(null);
    } finally {
      setLaunchingInteractive(false);
    }
  }, [buildExecutionPayload, language]);

  const handleStopInteractive = useCallback(async () => {
    if (!interactiveSession?.session_id) return;
    
    setStoppingInteractive(true);
    try {
      await apiService.stopInteractiveJavaSession(interactiveSession.session_id);
      setInteractiveSession(null);
      toast.success('GUI Session Terminated');
    } catch (err: any) {
      toast.error('Failed to stop session: ' + err.message);
    } finally {
      setStoppingInteractive(false);
    }
  }, [interactiveSession?.session_id]);

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  const handleExportFile = useCallback(async (type: 'code' | 'pdf' = 'code') => {
    try {
      const currentCode = sanitizeCodeText(activeFile?.content || '');
      const extension = activeFile?.filename.includes('.') ? '' : language === 'python' ? '.py' : language === 'java' ? '.java' : language === 'cpp' ? '.cpp' : '.c';
      const filename = activeFile?.filename || 'export';
      const blob = await apiService.exportFile(filename, currentCode, type);

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = type === 'pdf' ? `${filename}.pdf` : filename;
      document.body.appendChild(anchor);
      anchor.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(anchor);

      toast.success(`Exported ${activeFile?.filename || 'file'}`);
    } catch (err: any) {
      toast.error('Failed to export file: ' + err.message);
    }
  }, [activeFile, language]);

  const handleAnalyzeComplexity = useCallback(async () => {
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
  }, [activeFile, language]);

  const handleSelectHistory = useCallback((item: HistoryItem) => {
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
  }, [interactiveSession?.session_id]);

  const buildProjectPayload = useCallback((isPublic: boolean): SaveProjectRequest => ({
    name: projectName.trim() || 'Untitled Project',
    language,
    input: stdin,
    files,
    entry_file: entryFile,
    compiler_profile: compilerProfile,
    compiler_flags: compilerFlags,
    is_public: isPublic,
  }), [projectName, language, stdin, files, entryFile, compilerProfile, compilerFlags]);

  const handleSaveProject = useCallback(async (isPublic = false) => {
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
  }, [projectId, buildProjectPayload, loadProjects]);

  const handleShareProject = useCallback(async () => {
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
  }, [projectId, savedProjects, handleSaveProject, loadProjects]);

  const handleClearOutput = useCallback(() => {
    setOutput('');
    setResult(null);
    setStatus('idle');
  }, []);

  return (
    <div className="min-h-screen p-6 relative flex flex-col h-screen">
      <div className="flex-1 flex flex-col min-h-0 max-w-[1920px] mx-auto w-full">
        {/* Unified Command Bar */}
        {/* Unified Command Bar (The Bridge) */}
        <div className="mb-4 sk-plate sk-panel border-divider/40 backdrop-blur-md bg-surface/30 overflow-visible z-[100] relative">
          <div className="h-16 px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Sidebar Toggle (The Vault Summoner) */}
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`w-10 h-10 sk-switch sk-panel flex items-center justify-center transition-all duration-300 group ${
                  isSidebarOpen 
                    ? 'text-amber border-amber/40 bg-amber/5 shadow-[0_0_20px_rgba(255,149,0,0.2)]' 
                    : 'text-text-tertiary hover:text-cyan hover:border-cyan/30'
                }`}
                title={isSidebarOpen ? "Collapse Vault" : "Expand Repository Vault"}
              >
                <LayoutPanelLeft className={`w-5 h-5 transition-transform duration-500 ${isSidebarOpen ? 'rotate-0' : 'rotate-180 opacity-60'}`} />
                {!isSidebarOpen && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan shadow-[0_0_8px_rgba(0,209,255,0.8)] animate-pulse" />
                )}
              </button>

              <div className="h-8 w-px bg-divider/40 mx-1" />

              {/* Nexus Path (Breadcrumbs) */}
              <div className="flex items-center gap-2 px-4 h-10 sk-display sk-panel min-w-[320px] border-cyan/5 group hover:border-cyan/20 transition-all flex-1 max-w-[500px]">
                 <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FolderOpen className="w-3.5 h-3.5 text-cyan/60 hidden sm:block shrink-0" />
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="bg-transparent border-none text-cyan text-[11px] font-black uppercase tracking-[0.2em] outline-none w-full placeholder:text-cyan/10 truncate focus:text-cyan"
                      placeholder="Project Name"
                    />
                 </div>
                 <span className="text-text-tertiary/40 font-black px-1 shrink-0">/</span>
                 <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileCode2 className="w-3.5 h-3.5 text-amber/60 hidden sm:block shrink-0" />
                    <input
                      type="text"
                      value={activeFileName}
                      onChange={(e) => handleRenameActiveFile(e.target.value)}
                      className="bg-transparent border-none text-text text-[11px] font-bold outline-none w-full placeholder:text-text-tertiary/20 truncate"
                      placeholder="active_file"
                    />
                 </div>
              </div>

              {/* Active Environment Selection */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(activeMenu === 'language' ? null : 'language')}
                  className={`flex items-center gap-2.5 px-4 h-10 sk-switch sk-panel transition-all min-w-[120px] ${activeMenu === 'language' ? 'text-amber border-amber/30 bg-amber/5' : 'text-text-tertiary'}`}
                >
                  <Cpu className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.15em]">{language}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ml-auto ${activeMenu === 'language' ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {activeMenu === 'language' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-[calc(100%+8px)] left-0 w-48 sk-plate sk-panel border-divider shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 z-[200] backdrop-blur-xl"
                    >
                      {['python', 'c', 'cpp', 'java'].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            handleLanguageChange(lang);
                            setActiveMenu(null);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/5 group ${language === lang ? 'text-amber bg-amber/5' : 'text-text-tertiary'}`}
                        >
                          {lang}
                          {language === lang && <div className="sk-indicator animate-pulse bg-amber" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Integrated Utility Group */}
              <div className="flex items-center gap-2 pr-4 border-r border-divider/40">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className={`w-10 h-10 sk-switch sk-panel flex items-center justify-center transition-all ${showAdvanced ? 'text-amber border-amber/40 bg-amber/5 shadow-[0_0_15px_rgba(255,149,0,0.1)]' : 'text-text-tertiary hover:text-text-secondary'}`}
                  title="Compiler Settings"
                >
                  <Sliders className="w-4.5 h-4.5" />
                </button>

                {/* More Project Options Menu */}
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === 'project' ? null : 'project')}
                    className={`h-10 px-4 sk-switch sk-panel flex items-center gap-3 transition-all ${activeMenu === 'project' ? 'text-cyan border-cyan/30 bg-cyan/5 shadow-[0_0_15px_rgba(0,209,255,0.1)]' : 'text-text-tertiary hover:text-cyan'}`}
                    title="Project Actions"
                  >
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Project</span>
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>

                  <AnimatePresence>
                    {activeMenu === 'project' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-[calc(100%+8px)] right-0 w-56 sk-plate sk-panel border-divider shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-1.5 z-[200] backdrop-blur-xl"
                      >
                        <button
                          onClick={() => { void handleSaveProject(false); setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-amber hover:bg-amber/5 transition-all"
                        >
                          <Save className="w-4 h-4 text-amber/60" />
                          Save Workspace
                        </button>
                        <button
                          onClick={() => { void handleShareProject(); setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-cyan hover:bg-cyan/5 transition-all"
                        >
                          <Share2 className="w-4 h-4 text-cyan/60" />
                          Share Matrix
                        </button>
                        <div className="h-px bg-divider/40 my-1.5 mx-2" />
                        <button
                          onClick={() => { void handleExportFile(); setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-cyan hover:bg-cyan/5 transition-all"
                        >
                          <Download className="w-4 h-4 text-cyan/60" />
                          Export Source
                        </button>
                        <button
                          onClick={() => { void handleExportFile('pdf'); setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-cyan hover:bg-cyan/5 transition-all"
                        >
                          <BarChart3 className="w-4 h-4 text-cyan/60" />
                          Generate PDF
                        </button>
                        <div className="h-px bg-divider/40 my-1.5 mx-2" />
                        <button
                          onClick={() => { setIsSettingsOpen(true); setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-text hover:bg-white/5 transition-all"
                        >
                          <Settings2 className="w-4 h-4" />
                          System Preferences
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Launcher Center */}
              <div className="flex items-center gap-2 pl-2">
                <button
                  onClick={handleRunSync}
                  disabled={status === 'running' || status === 'pending' || status === 'submitted'}
                  className="sk-switch h-11 px-6 sk-panel border-cyan/40 text-cyan flex items-center gap-3 transition-all hover:border-cyan/70 hover:bg-cyan/5 active:scale-95 disabled:opacity-40 sk-interactive-hover"
                >
                  {(status === 'running' || status === 'pending' || status === 'submitted') ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-cyan/30" />
                  )}
                  <span className="text-[11px] font-black uppercase tracking-[0.2em]">Run</span>
                </button>

                {language === 'java' && (
                  <button
                    onClick={handleLaunchInteractive}
                    disabled={launchingInteractive || !!interactiveSession}
                    className="sk-switch h-11 px-6 sk-panel border-amber/40 text-amber flex items-center gap-3 transition-all hover:border-amber/70 hover:bg-amber/5 active:scale-95 disabled:opacity-40 sk-interactive-hover shadow-[0_0_20px_rgba(255,149,0,0.1)]"
                  >
                    {launchingInteractive ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 drop-shadow-[0_0_8px_rgba(255,149,0,0.5)] flex-shrink-0" />
                    )}
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">GUI Mode</span>
                  </button>
                )}

                <button
                  onClick={handleRunAsync}
                  disabled={status === 'running' || status === 'pending' || status === 'submitted'}
                  className="w-11 h-11 flex items-center justify-center sk-switch sk-panel border-white/5 text-text-tertiary hover:text-cyan transition-all hover:bg-cyan/5 disabled:opacity-30 group"
                  title="Deploy to Background"
                >
                  <Rocket className="w-4.5 h-4.5 group-hover:drop-shadow-[0_0_8px_rgba(0,209,255,0.4)]" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Settings Tray (Collapsible) */}
          {showAdvanced && (
            <div className="border-t border-divider p-4 flex flex-wrap items-end gap-6 animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-text-tertiary ml-1 tracking-widest uppercase">Entry File</span>
                <select
                  value={entryFile}
                  onChange={(e) => setEntryFile(e.target.value)}
                  className="h-9 sk-chassis sk-panel px-4 text-[10px] font-black text-text tracking-widest outline-none appearance-none min-w-[140px]"
                >
                  {files.map((file) => (
                    <option key={file.filename} value={file.filename}>
                      {file.filename}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-text-tertiary ml-1 tracking-widest uppercase">Compiler Profile</span>
                <select
                  value={compilerProfile}
                  onChange={(e) => setCompilerProfile(e.target.value)}
                  className="h-9 sk-chassis sk-panel px-4 text-[10px] font-black text-text tracking-widest outline-none min-w-[140px]"
                >
                  {PROFILE_OPTIONS[language].map((profile) => (
                    <option key={profile} value={profile}>
                      {profile}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black text-text-tertiary ml-1 tracking-widest uppercase">Runtime Args</span>
                <input
                  type="text"
                  value={compilerFlags}
                  onChange={(e) => setCompilerFlags(e.target.value)}
                  placeholder="-flags --args"
                  className="h-9 sk-chassis sk-panel px-4 text-[10px] font-black text-cyan tracking-widest outline-none w-80 placeholder:opacity-20"
                />
              </div>

              <div className="h-8 w-px bg-divider self-center" />

              <div className="flex items-center gap-2">
                <label className="sk-switch px-4 h-9 sk-panel cursor-pointer flex items-center gap-2 hover:text-text-secondary transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black tracking-widest">Import</span>
                  <input type="file" onChange={handleImportFile} className="hidden" accept=".py,.c,.cpp,.java,.txt,.h,.hpp" />
                </label>
                <button
                  onClick={handleAnalyzeComplexity}
                  disabled={analyzingComplexity}
                  className="sk-switch px-4 h-9 sk-panel flex items-center gap-2 disabled:opacity-40"
                >
                  {analyzingComplexity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5 text-cyan" />}
                  <span className="text-[10px] font-black tracking-widest">Analyze</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <PanelGroup 
          direction="horizontal" 
          className="flex-1 min-h-0"
          autoSaveId="velo-workspace-outer-v1"
        >
          {/* Main Content Area (Sidebar + Editor) */}
          <Panel defaultSize={75} minSize={40} className="flex">
            <PanelGroup direction="horizontal" autoSaveId="velo-workspace-inner-v1">
              {/* Left Panel: Repository Vault */}
              {isSidebarOpen && (
                <>
                  <Panel 
                    id="vault-panel"
                    defaultSize={25} 
                    minSize={15} 
                    maxSize={35} 
                    className="flex flex-col gap-4 min-h-0"
                  >
                    <div className="flex-1 min-h-0 sk-plate sk-panel border-divider flex flex-col p-4 mr-1">
                      <div className="flex items-center justify-between mb-4 bg-background/20 p-2 border-b border-divider">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="w-4 h-4 text-amber" />
                          <h3 className="text-[11px] font-black text-text tracking-widest uppercase italic">Vault</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={handleCreateNewProject}
                            className="w-7 h-7 sk-switch sk-panel flex items-center justify-center text-text-tertiary hover:text-cyan transition-all"
                            title="New Project"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setIsRepoManagerOpen(true)}
                            className="w-7 h-7 sk-switch sk-panel flex items-center justify-center text-text-tertiary hover:text-amber transition-all"
                            title="Manage Repositories"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 overflow-auto space-y-2 custom-scrollbar">
                        {loadingProjects ? (
                          <div className="flex items-center justify-center h-20">
                            <Loader2 className="w-5 h-5 animate-spin text-amber" />
                          </div>
                        ) : savedProjects.length === 0 ? (
                          <p className="text-[9px] text-text-tertiary font-bold text-center mt-4 opacity-40">No projects</p>
                        ) : (
                          savedProjects.map((project) => (
                            <button
                              key={project.id}
                              onClick={() => handleSelectProject(project)}
                              className={`w-full sk-chassis sk-panel p-3 text-left hover:border-amber/30 transition-all group sk-interactive-hover ${projectId === project.id ? 'border-amber/50 bg-amber/5' : ''}`}
                            >
                              <p className="text-[10px] font-black text-text tracking-widest group-hover:text-amber truncate">{project.name}</p>
                              <span className="text-[8px] font-bold text-text-tertiary uppercase mt-1 block tracking-wider">{project.language}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-h-0 mr-1">
                      <ExecutionHistory history={history} onSelect={handleSelectHistory} />
                    </div>
                  </Panel>
                  <PanelResizeHandle 
                    onDragging={setIsResizing}
                    className="w-3 flex items-center justify-center group overflow-visible relative transition-all duration-300"
                  >
                    <div className={`w-px h-full bg-divider transition-colors ${isResizing ? 'bg-amber' : 'group-hover:bg-amber/50'}`} />
                    <div className={`absolute w-1 bg-amber/30 rounded-full transition-all ${isResizing ? 'h-full opacity-40 shadow-[0_0_15px_rgba(255,149,0,0.5)]' : 'h-8 opacity-0 group-hover:opacity-100 group-active:h-12 group-active:bg-amber'}`} />
                  </PanelResizeHandle>
                </>
              )}

              {/* Center Panel: Code Editor Rack */}
              <Panel 
                id="editor-panel"
                defaultSize={isSidebarOpen ? 75 : 100} 
                minSize={30} 
                className="flex flex-col gap-4 px-1"
              >
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  {/* File Selection Tabs */}
                  <div className="sk-chassis sk-panel p-1.5 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap bg-background/30 snap-x">
                    {files.map((file) => (
                      <div
                        key={file.filename}
                        className={`flex items-center gap-2 px-4 py-2 transition-all cursor-pointer rounded-sm snap-start ${
                          file.filename === activeFileName
                            ? 'sk-plate text-text'
                            : 'text-text-tertiary hover:text-text-secondary'
                        }`}
                        onClick={() => setActiveFileName(file.filename)}
                      >
                        {file.filename === activeFileName && <span className="sk-indicator text-cyan" />}
                        <span className="text-[9px] font-black uppercase tracking-widest">
                          {file.filename}
                        </span>
                        {files.length > 1 && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.filename); }} 
                            className="text-text-tertiary hover:text-status-error opacity-40 hover:opacity-100 transition-opacity ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={handleAddFile} className="ml-2 w-8 h-8 sk-switch sk-panel flex items-center justify-center text-text-tertiary hover:text-text">
                      <Layout className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Primary Editor Surface */}
                  <div className="flex-1 min-h-0 relative">
                    <CodeEditor
                      code={activeFile?.content || ''}
                      language={language}
                      onChange={handleActiveFileChange}
                    />
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>

          {/* Graphical Handle between (Sidebar+Editor) and Output */}
          <PanelResizeHandle 
            onDragging={setIsResizing}
            className="w-3 flex items-center justify-center group overflow-visible relative transition-all duration-300"
          >
            <div className={`w-px h-full bg-divider transition-colors ${isResizing ? 'bg-cyan' : 'group-hover:bg-cyan/50'}`} />
            <div className={`absolute w-1 bg-cyan/30 rounded-full transition-all ${isResizing ? 'h-full opacity-40 shadow-[0_0_15px_rgba(0,209,255,0.5)]' : 'h-8 opacity-0 group-hover:opacity-100 group-active:h-12 group-active:bg-cyan'}`} />
          </PanelResizeHandle>

          {/* Right Panel: Data Output & Diagnostics */}
          <Panel 
            id="output-panel"
            defaultSize={25} 
            minSize={20} 
            className="flex flex-col gap-4"
          >
            <div className="flex-1 sk-plate sk-panel border-divider flex flex-col min-h-0 overflow-hidden ml-1">
              <div className="flex items-center border-b border-divider bg-background/10 h-11 px-2">
                <button
                  onClick={() => setActiveRightTab('output')}
                  className={`flex-1 h-8 flex items-center justify-center gap-2 text-[10px] font-black transition-all sk-interactive-hover ${activeRightTab === 'output' ? 'sk-plate text-cyan shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Output
                </button>
                <button
                  onClick={() => setActiveRightTab('input')}
                  className={`flex-1 h-8 flex items-center justify-center gap-2 text-[10px] font-black transition-all sk-interactive-hover ${activeRightTab === 'input' ? 'sk-plate text-amber shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Stdin
                </button>
                <button
                  onClick={() => setActiveRightTab('metrics')}
                  className={`flex-1 h-8 flex items-center justify-center gap-2 text-[10px] font-black transition-all sk-interactive-hover ${activeRightTab === 'metrics' ? 'sk-plate text-cyan shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Metrics
                </button>
              </div>

              <div className="flex-1 p-4 min-h-0 overflow-hidden flex flex-col">
                {activeRightTab === 'output' && (
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {language === 'java' && (interactiveSession || launchingInteractive) && (
                      <div className="h-[40%] min-h-[140px]">
                        <InteractiveSessionPanel
                          session={interactiveSession}
                          launching={launchingInteractive}
                          stopping={stoppingInteractive}
                          onStop={() => void handleStopInteractive()}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-h-0">
                      <OutputPanel output={output} status={status} result={result} onClear={handleClearOutput} />
                    </div>
                  </div>
                )}

                {activeRightTab === 'input' && (
                  <div className="flex-1 animate-in fade-in duration-200">
                    <StdinInput value={stdin} onChange={setStdin} />
                  </div>
                )}

                {activeRightTab === 'metrics' && (
                  <div className="flex-1 flex flex-col animate-in fade-in duration-200 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="sk-indicator text-cyan animate-pulse" />
                        <h3 className="text-[10px] font-black text-text uppercase tracking-widest">Complexity Analysis</h3>
                      </div>
                      <span className="text-[9px] font-bold text-cyan uppercase tracking-widest px-2 py-0.5 sk-display sk-panel">
                        {complexity?.confidence || '0.0%'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4 font-bold">
                      <div className="sk-chassis p-3 sk-panel">
                        <p className="text-[8px] font-black text-text-tertiary uppercase mb-1">Time</p>
                        <p className="text-[10px] font-black text-text tracking-widest">{complexity?.time_complexity || 'TBD'}</p>
                      </div>
                      <div className="sk-chassis p-3 sk-panel">
                        <p className="text-[8px] font-black text-text-tertiary uppercase mb-1">Space</p>
                        <p className="text-[10px] font-black text-text tracking-widest">{complexity?.space_complexity || 'TBD'}</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto pr-2 custom-scrollbar text-[10px] font-bold text-text-secondary leading-relaxed">
                      {complexity?.notes?.length ? (
                        complexity.notes.map((note, idx) => (
                          <div key={idx} className="mb-2 pl-3 border-l border-amber/30">{note}</div>
                        ))
                      ) : (
                        <div className="h-40 flex items-center justify-center flex-col gap-3 opacity-30">
                          <BarChart3 className="w-8 h-8" />
                          <p className="text-[8px] uppercase tracking-widest font-black italic">Awaiting Matrix Statistics</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>

        {/* Interaction Mask: Prevent iframe event stealing during resize */}
        {isResizing && (
          <div className="fixed inset-0 z-[9999] cursor-col-resize pointer-events-auto" />
        )}

        {/* Modals & Overlays */}
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
        <RepositoryManager
          isOpen={isRepoManagerOpen}
          onClose={() => setIsRepoManagerOpen(false)}
          projects={savedProjects}
          onSelect={handleSelectProject}
          onRefresh={loadProjects}
          currentProjectId={projectId}
        />
      </div>
    </div>
  );
}
