import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Loader2, Share2 } from 'lucide-react';

import { apiService, SavedProject } from '../../services/api';
import { GlassCard } from '../components/GlassCard';
import { CodeEditor } from '../components/CodeEditor';

export function SharedProject() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<SavedProject | null>(null);
  const [activeFileName, setActiveFileName] = useState<string>('');

  useEffect(() => {
    const loadProject = async () => {
      if (!shareId) {
        setError('Missing share ID');
        setLoading(false);
        return;
      }
      try {
        const data = await apiService.getSharedProject(shareId);
        setProject(data);
        setActiveFileName(data.entry_file);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message);
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [shareId]);

  const activeFile = project?.files.find((file) => file.filename === activeFileName) ?? project?.files[0];

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto mt-16">
          <GlassCard>
            <p className="text-lg font-semibold text-text">Shared project unavailable</p>
            <p className="text-sm text-text-secondary mt-2">{error || 'This link is no longer available.'}</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <GlassCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-primary" />
                <span className="text-xs uppercase tracking-wide text-text-tertiary">Shared Project</span>
              </div>
              <h1 className="text-2xl font-bold text-text">{project.name}</h1>
              <p className="text-sm text-text-secondary mt-1">
                {project.owner_username} · {project.language.toUpperCase()} · entry {project.entry_file}
              </p>
            </div>
            <Link to="/workspace" className="glass-button px-4 py-2.5 rounded-xl text-sm font-medium">
              Open Workspace
            </Link>
          </div>
        </GlassCard>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <GlassCard className="h-full">
              <h3 className="text-sm font-semibold text-text mb-4">Files</h3>
              <div className="space-y-2">
                {project.files.map((file) => (
                  <button
                    key={file.filename}
                    onClick={() => setActiveFileName(file.filename)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      file.filename === activeFileName
                        ? 'border-sky-400/70 bg-sky-200/30 text-sky-700'
                        : 'border-divider-subtle bg-surface-solid text-text-secondary'
                    }`}
                  >
                    {file.filename}
                  </button>
                ))}
              </div>
              <div className="mt-6 space-y-2 text-sm text-text-secondary">
                <p><span className="font-semibold text-text">Compiler profile:</span> {project.compiler_profile || 'default'}</p>
                <p><span className="font-semibold text-text">Flags:</span> {project.compiler_flags || 'none'}</p>
              </div>
            </GlassCard>
          </div>

          <div className="col-span-9 h-[calc(100vh-240px)]">
            <CodeEditor
              code={activeFile?.content || ''}
              language={project.language}
              onChange={() => {}}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
