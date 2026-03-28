import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  Cuboid,
  ArrowRight,
  Container,
  Zap,
  ShieldCheck,
  FolderGit2,
  BarChart3,
  MonitorPlay,
  ChevronRight,
} from 'lucide-react';

/* ── Scroll-reveal hook ─────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.lp-reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.13 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ── Typewriter code demo ───────────────────────────────── */
const CODE_SNIPPETS: Record<string, { lines: React.ReactNode[] }> = {
  Python: {
    lines: [
      <><span className="lp-code-kw">def</span> <span className="lp-code-fn">fibonacci</span>(n: <span className="lp-code-kw">int</span>) -&gt; <span className="lp-code-kw">int</span>:</>,
      <>{'    '}<span className="lp-code-cm"># Cloud Compiler — runs in Docker 🐳</span></>,
      <>{'    '}<span className="lp-code-kw">if</span> n &lt;= <span className="lp-code-num">1</span>: <span className="lp-code-kw">return</span> n</>,
      <>{'    '}<span className="lp-code-kw">return</span> <span className="lp-code-fn">fibonacci</span>(n - <span className="lp-code-num">1</span>) + <span className="lp-code-fn">fibonacci</span>(n - <span className="lp-code-num">2</span>)</>,
      <></>,
      <><span className="lp-code-kw">for</span> i <span className="lp-code-kw">in</span> <span className="lp-code-fn">range</span>(<span className="lp-code-num">10</span>):</>,
      <>{'    '}<span className="lp-code-fn">print</span>(f<span className="lp-code-str">"fib(&#123;i&#125;) = &#123;<span className="lp-code-fn">fibonacci</span>(i)&#125;"</span>)</>,
    ],
  },
  'C++': {
    lines: [
      <><span className="lp-code-kw">#include</span> <span className="lp-code-str">&lt;iostream&gt;</span></>,
      <><span className="lp-code-kw">using namespace</span> std;</>,
      <></>,
      <><span className="lp-code-kw">int</span> <span className="lp-code-fn">main</span>() {'{'}</>,
      <>{'    '}<span className="lp-code-cm">// Isolated sandbox — no network access</span></>,
      <>{'    '}<span className="lp-code-kw">for</span> (<span className="lp-code-kw">int</span> i = <span className="lp-code-num">0</span>; i &lt; <span className="lp-code-num">5</span>; i++)</>,
      <>{'        '}cout &lt;&lt; <span className="lp-code-str">"Hello #"</span> &lt;&lt; i &lt;&lt; endl;</>,
      <>{'    '}<span className="lp-code-kw">return</span> <span className="lp-code-num">0</span>;</>,
      <>{'}'}</>,
    ],
  },
  Java: {
    lines: [
      <><span className="lp-code-kw">public class</span> <span className="lp-code-fn">Main</span> {'{'}</>,
      <>{'    '}<span className="lp-code-kw">public static void</span> <span className="lp-code-fn">main</span>(String[] args) {'{'}</>,
      <>{'        '}<span className="lp-code-cm">// Java Swing + noVNC interactive mode</span></>,
      <>{'        '}<span className="lp-code-kw">int</span>[] nums = {'{'}<span className="lp-code-num">1</span>, <span className="lp-code-num">2</span>, <span className="lp-code-num">3</span>, <span className="lp-code-num">4</span>, <span className="lp-code-num">5</span>{'}'}</>,
      <>{'        '}<span className="lp-code-kw">for</span> (<span className="lp-code-kw">int</span> n : nums)</>,
      <>{'            '}System.out.<span className="lp-code-fn">println</span>(<span className="lp-code-str">"→ "</span> + n);</>,
      <>{'    }'}</>,
      <>{'}'}</>,
    ],
  },
};

function CodeDemo() {
  const tabs = Object.keys(CODE_SNIPPETS);
  const [activeTab, setActiveTab] = useState('Python');
  const [visibleLines, setVisibleLines] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setVisibleLines(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const lines = CODE_SNIPPETS[activeTab].lines;
    let count = 0;
    intervalRef.current = setInterval(() => {
      count++;
      setVisibleLines(count);
      if (count >= lines.length && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }, 220);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeTab]);

  const snippet = CODE_SNIPPETS[activeTab];

  return (
    <div className="lp-hero-code-wrap">
      <div className="lp-code-window">
        <div className="lp-code-titlebar">
          <span className="lp-code-dot red" />
          <span className="lp-code-dot yellow" />
          <span className="lp-code-dot green" />
          <div className="lp-code-tab-row">
            {tabs.map((t) => (
              <button
                key={t}
                className={`lp-code-tab${activeTab === t ? ' active' : ''}`}
                onClick={() => setActiveTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="lp-code-body">
          {snippet.lines.slice(0, visibleLines).map((line, i) => (
            <div key={i}>{line || <>&nbsp;</>}</div>
          ))}
          {visibleLines < snippet.lines.length && (
            <span className="lp-code-cursor" />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Marquee ────────────────────────────────────────────── */
const MARQUEE_ITEMS = [
  'Docker-Isolated Execution',
  'Redis Job Queue',
  'JWT Authentication',
  'Monaco Editor',
  'Real-time Polling',
  'Multi-file Projects',
  'Admin Metrics',
  'Java Swing VNC',
  'FastAPI Backend',
  'PDF Export',
  'Shareable Links',
  'Compiler Profiles',
];

function Marquee() {
  const doubled = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];
  return (
    <div className="lp-marquee-wrap">
      <div className="lp-marquee-track">
        {doubled.map((item, i) => (
          <span key={i} className="lp-marquee-item">
            <span className="lp-marquee-dot" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Features ───────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <Container size={22} />,
    color: 'sky',
    name: 'Isolated Docker Execution',
    desc: 'Every code run spins up a fresh Docker container with no network access, memory limits, and a strict timeout — keeping your platform safe.',
  },
  {
    icon: <Zap size={22} />,
    color: 'mint',
    name: 'Async Queue & Polling',
    desc: 'Jobs are pushed to a Redis queue and processed by background workers. The frontend polls for results in real time so you never miss output.',
  },
  {
    icon: <ShieldCheck size={22} />,
    color: 'lavender',
    name: 'JWT Auth & Sandboxing',
    desc: 'Secure login with JSON Web Tokens, per-user project isolation, and execution sandboxing ensure your code and data stay private.',
  },
  {
    icon: <FolderGit2 size={22} />,
    color: 'peach',
    name: 'Multi-file Projects & Sharing',
    desc: 'Organise code into multi-file projects, save them to your account, and share a read-only link with anyone instantly.',
  },
  {
    icon: <BarChart3 size={22} />,
    color: 'gold',
    name: 'Admin Metrics Dashboard',
    desc: 'A real-time dashboard shows queue depth, worker status, CPU/memory usage, and recent execution stats — all auto-refreshed every 3 s.',
  },
  {
    icon: <MonitorPlay size={22} />,
    color: 'rose',
    name: 'Java Swing Interactive Mode',
    desc: 'Run Swing GUI apps inside the container and interact with them live via a noVNC session streamed directly to your browser tab.',
  },
];

/* ── Architecture steps ─────────────────────────────────── */
const ARCH = [
  {
    num: '1',
    icon: '🖥️',
    name: 'Frontend',
    desc: 'React + Monaco Editor sends code and reads output. Polls job status and renders metrics.',
  },
  {
    num: '2',
    icon: '⚡',
    name: 'FastAPI Backend',
    desc: 'Validates auth, enqueues async jobs to Redis, runs sync execution directly, and exposes admin endpoints.',
  },
  {
    num: '3',
    icon: '🐳',
    name: 'Worker + Docker',
    desc: 'A Python worker pulls jobs from Redis, spins up language-specific Docker containers, stores output, updates job results.',
  },
];

/* ── Stats ──────────────────────────────────────────────── */
const STATS = [
  { value: '4', label: 'Languages' },
  { value: '🐳', label: 'Docker Isolated' },
  { value: '∞', label: 'Concurrent Jobs' },
  { value: '🔒', label: 'JWT Secured' },
];

/* ── Main Component ─────────────────────────────────────── */
export function LandingPage() {
  useReveal();

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <Link to="/" className="lp-nav-brand">
          <div className="lp-nav-brand-icon">
            <Cuboid size={16} />
          </div>
          VeloQube
        </Link>

        <ul className="lp-nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#languages">Languages</a></li>
          <li><a href="#architecture">How it works</a></li>
        </ul>

        <div className="lp-nav-actions">
          <Link to="/login" className="lp-nav-ghost">Log in</Link>
          <Link to="/register" className="lp-nav-cta">Get started</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-bg" />

        <div className="lp-hero-badge">
          <span className="lp-hero-badge-dot" />
          Cloud Compiler · Now live
        </div>

        <h1 className="lp-hero-title">
          Write. Run.<br />
          <span className="lp-hero-title-grad">Ship faster.</span>
        </h1>

        <p className="lp-hero-subtitle">
          A full-stack cloud IDE that executes your code inside isolated Docker containers,
          streams results in real time, and lets you share projects with a single link.
        </p>

        <div className="lp-hero-actions">
          <Link to="/register" className="lp-btn-primary">
            Start coding free <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="lp-btn-secondary">
            Sign in <ChevronRight size={16} />
          </Link>
        </div>

        <CodeDemo />
      </section>

      {/* ── Marquee ── */}
      <Marquee />

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-reveal">
            <span className="lp-section-label">⚡ Capabilities</span>
            <h2 className="lp-section-title">Everything you need to run code in the cloud</h2>
            <p className="lp-section-desc">
              Built with a production-grade architecture — async queuing, isolated containers,
              and real-time observability baked in from day one.
            </p>
          </div>

          <div className="lp-features-grid lp-reveal lp-reveal-group">
            {FEATURES.map((f) => (
              <div key={f.name} className="lp-feature-card lp-reveal">
                <div className={`lp-feature-icon-wrap ${f.color}`}>
                  {f.icon}
                </div>
                <p className="lp-feature-name">{f.name}</p>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="lp-stats-section">
        <div className="lp-stats-grid lp-reveal lp-reveal-group">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="lp-stat-value">{s.value}</div>
              <div className="lp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Languages ── */}
      <section className="lp-section lp-langs-section" id="languages">
        <div className="lp-section-inner">
          <div className="lp-reveal">
            <span className="lp-section-label">🌐 Supported Languages</span>
            <h2 className="lp-section-title">Four languages. One platform.</h2>
            <p className="lp-section-desc">
              Python, C, C++, and Java — each with its own Docker runner image, compiler
              flags, and execution profile. Java even supports Swing GUI apps via noVNC.
            </p>
          </div>

          <div className="lp-langs-grid lp-reveal lp-reveal-group">
            <div className="lp-lang-card">
              <span className="lp-lang-emoji">🐍</span>
              <p className="lp-lang-name">Python</p>
              <span className="lp-lang-badge python">CPython 3.11</span>
            </div>
            <div className="lp-lang-card">
              <span className="lp-lang-emoji">⚙️</span>
              <p className="lp-lang-name">C</p>
              <span className="lp-lang-badge c">GCC 12</span>
            </div>
            <div className="lp-lang-card">
              <span className="lp-lang-emoji">🔩</span>
              <p className="lp-lang-name">C++</p>
              <span className="lp-lang-badge cpp">G++ 12 · C++17</span>
            </div>
            <div className="lp-lang-card">
              <span className="lp-lang-emoji">☕</span>
              <p className="lp-lang-name">Java</p>
              <span className="lp-lang-badge java">JDK 17 + Swing</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className="lp-section" id="architecture">
        <div className="lp-section-inner">
          <div className="lp-reveal">
            <span className="lp-section-label">🏗️ How it works</span>
            <h2 className="lp-section-title">From keystroke to output in milliseconds</h2>
            <p className="lp-section-desc">
              A three-tier architecture built for reliability: your request flows from the
              browser → FastAPI backend → Redis queue → Docker worker — and back.
            </p>
          </div>

          <div className="lp-arch-steps lp-reveal">
            {ARCH.map((step, i) => (
              <>
                <div key={step.num} className="lp-arch-step">
                  <div className="lp-arch-step-num">{step.num}</div>
                  <span className="lp-arch-step-icon">{step.icon}</span>
                  <p className="lp-arch-step-name">{step.name}</p>
                  <p className="lp-arch-step-desc">{step.desc}</p>
                </div>
                {i < ARCH.length - 1 && (
                  <div key={`arrow-${i}`} className="lp-arch-arrow">
                    <ArrowRight size={28} strokeWidth={1.5} />
                  </div>
                )}
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="lp-footer-cta">
        <div className="lp-reveal">
          <h2 className="lp-footer-cta-title">Ready to compile<br />in the cloud?</h2>
          <p className="lp-footer-cta-sub">
            Create a free account and start running Python, C, C++, or Java code from your
            browser — no setup, no installs.
          </p>
          <div className="lp-hero-actions">
            <Link to="/register" className="lp-btn-primary" style={{ fontSize: '1.05rem', padding: '0.95rem 2.5rem' }}>
              Create free account <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="lp-btn-secondary" style={{ fontSize: '1.05rem', padding: '0.95rem 2.5rem' }}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <Link to="/" className="lp-footer-brand">
          <div className="lp-nav-brand-icon" style={{ width: '1.4rem', height: '1.4rem', borderRadius: '0.4rem' }}>
            <Cuboid size={12} />
          </div>
          VeloQube · Cloud Compiler
        </Link>
        <span className="lp-footer-copy">
          © {new Date().getFullYear()} · Docker-isolated · MIT Licensed
        </span>
      </footer>
    </div>
  );
}
