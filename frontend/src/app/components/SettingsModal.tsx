import { X, Settings2, Monitor, Code2, Sliders, RotateCcw } from 'lucide-react';
import { useAppSettings, EditorTheme } from '../../context/AppSettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useAppSettings();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl sk-plate sk-panel flex flex-col max-h-[80vh] overflow-hidden border-divider bg-background shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-divider bg-background/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sk-chassis sk-panel flex items-center justify-center border-amber/20">
              <Settings2 className="w-5 h-5 text-amber" />
            </div>
            <div>
              <h2 className="text-xl font-black text-text tracking-widest uppercase italic">System Configuration</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="sk-indicator text-cyan animate-pulse" />
                <span className="text-[9px] font-black text-text-tertiary tracking-[0.2em]">GLOBAL PREFERENCES // CORE_v4</span>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-10">
            {/* Editor Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Code2 className="w-4 h-4 text-cyan" />
                <h3 className="text-xs font-black text-text uppercase tracking-[0.2em]">Editor Intelligence</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SettingItem label="Editor Theme" sub="Select visual kernel profile">
                  <select 
                    value={settings.editorTheme}
                    onChange={(e) => updateSettings({ editorTheme: e.target.value as EditorTheme })}
                    className="w-full sk-display sk-panel bg-transparent px-3 py-2 text-[10px] font-black uppercase text-cyan outline-none border-divider"
                  >
                    <option value="vs-dark">VS Dark (Default)</option>
                    <option value="light">Light Machine</option>
                    <option value="hc-black">High Contrast</option>
                    <option value="monokai">Monokai Pro</option>
                    <option value="dracula">Dracula Noir</option>
                    <option value="cobalt">Cobalt Pulse</option>
                  </select>
                </SettingItem>

                <SettingItem label="Font Size" sub="Atomic scale of glyphs (px)">
                  <div className="flex items-center gap-4">
                    <input 
                      type="range"
                      min="10"
                      max="24"
                      value={settings.fontSize}
                      onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                      className="flex-1 accent-cyan"
                    />
                    <span className="sk-display sk-panel px-3 py-1 text-[10px] font-black text-cyan min-w-[40px] text-center">
                      {settings.fontSize}
                    </span>
                  </div>
                </SettingItem>

                <SettingItem label="Tab Size" sub="Space-time indentation">
                  <select 
                    value={settings.tabSize}
                    onChange={(e) => updateSettings({ tabSize: parseInt(e.target.value) })}
                    className="w-full sk-display sk-panel bg-transparent px-3 py-2 text-[10px] font-black uppercase text-cyan outline-none border-divider"
                  >
                    <option value={2}>2 Spaces</option>
                    <option value={4}>4 Spaces</option>
                    <option value={8}>8 Spaces</option>
                  </select>
                </SettingItem>

                <SettingItem label="Word Wrap" sub="Automatic line truncation">
                  <div className="flex gap-2">
                    {(['on', 'off'] as const).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => updateSettings({ wordWrap: opt })}
                        className={`flex-1 py-2 sk-panel text-[9px] font-black uppercase transition-all ${
                          settings.wordWrap === opt ? 'sk-plate text-cyan' : 'text-text-tertiary hover:text-text'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </SettingItem>
              </div>
            </section>

            {/* Interface Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Monitor className="w-4 h-4 text-emerald" />
                <h3 className="text-xs font-black text-text uppercase tracking-[0.2em]">Neural Interface</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SettingItem label="Minimap" sub="High-level structural radar">
                  <button
                    onClick={() => updateSettings({ minimap: !settings.minimap })}
                    className={`w-full py-2 sk-panel text-[9px] font-black uppercase transition-all ${
                      settings.minimap ? 'sk-plate text-emerald' : 'text-text-tertiary hover:text-text'
                    }`}
                  >
                    {settings.minimap ? 'ACTIVATED' : 'DEACTIVATED'}
                  </button>
                </SettingItem>

                <SettingItem label="Line Numbers" sub="Coordinate tracking">
                  <button
                    onClick={() => updateSettings({ lineNumbers: settings.lineNumbers === 'on' ? 'off' : 'on' })}
                    className={`w-full py-2 sk-panel text-[9px] font-black uppercase transition-all ${
                      settings.lineNumbers === 'on' ? 'sk-plate text-emerald' : 'text-text-tertiary hover:text-text'
                    }`}
                  >
                    {settings.lineNumbers === 'on' ? 'DISPLAYED' : 'HIDDEN'}
                  </button>
                </SettingItem>
              </div>
            </section>

             {/* Cursor Section */}
             <section className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Sliders className="w-4 h-4 text-lavender" />
                <h3 className="text-xs font-black text-text uppercase tracking-[0.2em]">Input Dynamics</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <SettingItem label="Cursor Animation" sub="Temporal pulse style">
                  <select 
                    value={settings.cursorBlinking}
                    onChange={(e) => updateSettings({ cursorBlinking: e.target.value as any })}
                    className="w-full sk-display sk-panel bg-transparent px-3 py-2 text-[10px] font-black uppercase text-lavender outline-none border-divider"
                  >
                    <option value="blink">Blink</option>
                    <option value="smooth">Smooth Velocity</option>
                    <option value="phase">Phase Shift</option>
                    <option value="solid">Static Solid</option>
                  </select>
                </SettingItem>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-divider bg-background/20 flex items-center justify-between">
          <button 
            onClick={resetSettings}
            className="flex items-center gap-2 text-[10px] font-black text-text-tertiary hover:text-status-error transition-colors uppercase tracking-widest"
          >
            <RotateCcw className="w-3 h-3" />
            Purge All Overrides
          </button>
          <button 
            onClick={onClose}
            className="sk-switch h-10 px-8 sk-panel border-cyan/40 text-cyan flex items-center justify-center shadow-[0_0_15px_rgba(0,209,255,0.1)]"
          >
            <span className="text-[10px] font-black tracking-widest uppercase">Sync Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingItem({ label, sub, children }: { label: string, sub: string, children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-[10px] font-black text-text tracking-widest uppercase">{label}</h4>
        <p className="text-[9px] font-bold text-text-tertiary tracking-widest uppercase opacity-40 mt-0.5">{sub}</p>
      </div>
      {children}
    </div>
  );
}
