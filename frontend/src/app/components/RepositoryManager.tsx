import { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Code2, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Layers, 
  AlertTriangle,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { SavedProject, apiService } from '../../services/api';
import { toast } from 'sonner';

interface RepositoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  projects: SavedProject[];
  onSelect: (project: SavedProject) => void;
  onRefresh: () => void;
  currentProjectId?: number | null;
}

export function RepositoryManager({ 
  isOpen, 
  onClose, 
  projects, 
  onSelect, 
  onRefresh,
  currentProjectId 
}: RepositoryManagerProps) {
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.language.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await apiService.deleteProject(id);
      toast.success('Matrix Frame Purged: Repository permanently deleted.');
      onRefresh();
      setDeletingId(null);
    } catch (err: any) {
      toast.error('Purge Failed: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/90 backdrop-blur-xl"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl sk-plate sk-panel flex flex-col max-h-[85vh] overflow-hidden border-divider bg-background shadow-[0_0_80px_rgba(0,0,0,0.6)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-divider bg-background/40">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sk-chassis sk-panel flex items-center justify-center border-amber/20">
              <FolderOpen className="w-6 h-6 text-amber" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-text tracking-widest uppercase italic">Repository Manager</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="sk-indicator text-cyan animate-pulse" />
                <span className="text-[10px] font-black text-text-tertiary tracking-[0.2em]">PERSISTENT_STORAGE // SAVED_FRAMES</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 sk-switch sk-panel flex items-center justify-center text-text-tertiary hover:text-text transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Toolstrip */}
        <div className="p-6 border-b border-divider bg-background/20 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary group-focus-within:text-cyan transition-colors" />
            <input 
              type="text"
              placeholder="Filter repositories by name or kernel type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 sk-display sk-panel bg-transparent pl-12 pr-4 text-[11px] font-black uppercase text-cyan outline-none border-divider placeholder:opacity-20"
            />
          </div>
          <div className="sk-display sk-panel px-6 py-1 h-12 flex items-center gap-4 text-text-tertiary min-w-[200px]">
             <span className="text-[10px] font-black uppercase tracking-widest">{filteredProjects.length} / {projects.length} FRAMES</span>
          </div>
        </div>

        {/* Project Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(0,209,255,0.03),transparent_70%)]">
          {filteredProjects.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-30">
              <Layers className="w-12 h-12 mb-4" />
              <p className="text-[11px] font-black uppercase tracking-widest italic">No data frames detected in target query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id}
                  className={`group sk-plate sk-panel p-6 border-divider transition-all duration-300 relative overflow-hidden ${
                    currentProjectId === project.id ? 'border-amber/40 bg-amber/5' : 'hover:border-divider-strong hover:sk-switch'
                  }`}
                >
                  {currentProjectId === project.id && (
                    <div className="absolute top-0 right-0 p-2">
                       <div className="px-2 py-0.5 sk-display sk-panel text-[8px] font-black text-amber uppercase tracking-widest animate-pulse">ACTIVE_SESSION</div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sk-chassis sk-panel flex items-center justify-center border-divider group-hover:border-cyan/30 transition-colors">
                        <Code2 className="w-5 h-5 text-cyan" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-text tracking-widest uppercase truncate max-w-[180px]">{project.name}</h3>
                        <p className="text-[9px] font-bold text-cyan tracking-widest uppercase opacity-60">{project.language}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8 text-[9px] font-bold text-text-tertiary uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 opacity-40" />
                      {new Date(project.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-3 h-3 opacity-40" />
                      {project.files.length} MODULES
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-divider/40">
                    <button 
                      onClick={() => onSelect(project)}
                      className="flex-1 h-9 sk-panel sk-chassis flex items-center justify-center gap-2 text-[10px] font-black uppercase text-text hover:text-cyan hover:border-cyan/30 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Initialize
                    </button>
                    <button 
                      onClick={() => setDeletingId(project.id)}
                      className="w-10 h-9 sk-panel sk-chassis flex items-center justify-center text-text-tertiary hover:text-status-error hover:border-status-error/30 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Deletion Overlay */}
                  {deletingId === project.id && (
                    <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center">
                      <AlertTriangle className="w-8 h-8 text-status-error mb-4 animate-bounce" />
                      <h4 className="text-[11px] font-black text-text uppercase tracking-widest mb-2">Confirm Repository Purge?</h4>
                      <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest opacity-60 mb-6">This action will destroy all data frames permanently.</p>
                      <div className="flex gap-4 w-full">
                        <button 
                          onClick={() => setDeletingId(null)}
                          className="flex-1 h-9 sk-panel sk-display text-[9px] font-black uppercase text-text transition-all"
                        >
                          Abort
                        </button>
                        <button 
                          onClick={() => handleDelete(project.id)}
                          disabled={isDeleting}
                          className="flex-1 h-9 sk-panel sk-display border-status-error/40 text-status-error flex items-center justify-center transition-all hover:bg-status-error/10"
                        >
                          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'PURGE'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-divider bg-background/40 flex justify-between items-center text-[9px] font-bold text-text-tertiary uppercase tracking-[0.2em] opacity-40">
           <span>STORAGE_TYPE: LOCAL_POSTGRES_DOCKER</span>
           <span>SECURE_DATA_LINK_ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
