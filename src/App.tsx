import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3, Boxes, CheckCircle2, ChevronRight, ClipboardList, FolderKanban,
  IterationCw, LayoutDashboard, LogIn, Menu, Plus, Rocket, Settings2, ShieldCheck,
  Users, X, Zap,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Session = NonNullable<Awaited<ReturnType<NonNullable<typeof supabase>['auth']['getSession']>>['data']['session']>
type Row = Record<string, unknown>
type Section = 'dashboard' | 'projects' | 'backlog' | 'kanban' | 'iterations' | 'quality' | 'metrics'

const navigation: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Proyectos', icon: FolderKanban },
  { id: 'backlog', label: 'Historias de usuario', icon: ClipboardList },
  { id: 'kanban', label: 'Tablero Kanban', icon: Boxes },
  { id: 'iterations', label: 'Iteraciones', icon: IterationCw },
  { id: 'quality', label: 'Pruebas y bugs', icon: ShieldCheck },
  { id: 'metrics', label: 'Métricas XP', icon: BarChart3 },
]

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (loading) return <div className="loading-screen"><Rocket size={24} /> Cargando XPFlow...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/app" replace /> : <LandingPage />} />
        <Route path="/app/*" element={session ? <Workspace session={session} /> : <Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to={session ? '/app' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function LandingPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setMessage('Configura las variables públicas de Supabase para continuar.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/app' } })
    setSubmitting(false)
    setMessage(error ? error.message : 'Revisa tu correo. Te enviamos un enlace seguro.')
  }

  return (
    <main className="app-shell landing">
      <nav className="topbar"><a className="brand" href="/login"><span className="brand-mark"><Rocket size={18} /></span><span>XP<span className="brand-accent">Flow</span></span></a><span className="status-pill"><span className="status-dot" /> colaboración en equipo</span></nav>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">Gestión de proyectos · Extreme Programming</p><h1>Construye mejor.<br /><span>Juntos.</span></h1><p className="hero-lead">El espacio colaborativo para convertir historias de usuario en software entregable, con el ritmo y la transparencia de XP.</p><div className="hero-actions"><a className="button button-primary" href="#access">Comenzar ahora <Zap size={17} /></a><a className="button button-quiet" href="#features">Conocer la plataforma</a></div><div className="trust-row"><ShieldCheck size={16} /><span>Datos protegidos con Supabase Row Level Security</span></div></div><Preview /></section>
      <section id="features" className="features"><Feature icon={<LayoutDashboard size={20} />} title="Todo en un lugar" text="Backlog, iteraciones, tareas y métricas conectadas." /><Feature icon={<Users size={20} />} title="Equipo sincronizado" text="Colaboración en tiempo real para avanzar sin bloqueos." /><Feature icon={<ShieldCheck size={20} />} title="Seguro por diseño" text="Autenticación y permisos respaldados por Supabase." /></section>
      <section id="access" className="access-card"><div><p className="eyebrow">Tu siguiente iteración empieza aquí</p><h2>Accede a tu espacio</h2><p>Recibe un enlace seguro en tu correo electrónico.</p></div><form onSubmit={handleSignIn} className="access-form"><label htmlFor="email">Correo electrónico</label><div className="input-row"><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@equipo.com" /><button className="button button-primary" disabled={submitting}><LogIn size={16} />{submitting ? 'Enviando...' : 'Continuar'}</button></div>{message && <p className="form-message" role="status">{message}</p>}{!isSupabaseConfigured && <p className="setup-note">Falta configurar <code>.env.local</code>.</p>}</form></section>
      <footer><span>XPFlow · Plataforma colaborativa para equipos ágiles</span><span>Construido con React + Supabase</span></footer>
    </main>
  )
}

function Workspace({ session }: { session: Session }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const current = (location.pathname.split('/')[2] || 'dashboard') as Section
  const userEmail = session.user.email || 'Usuario'

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
  }

  return <div className="workspace"><aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><a className="brand" href="/app"><span className="brand-mark"><Rocket size={17} /></span><span>XP<span className="brand-accent">Flow</span></span></a><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><p className="nav-caption">Espacio de trabajo</p><nav>{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={current === id ? 'nav-item active' : 'nav-item'} onClick={() => { navigate(`/app/${id}`); setMobileOpen(false) }}><Icon size={17} /><span>{label}</span>{current === id && <ChevronRight className="nav-arrow" size={14} />}</button>)}</nav><div className="sidebar-bottom"><button className="nav-item"><Settings2 size={17} /><span>Configuración</span></button><div className="user-card"><div className="avatar">{userEmail.slice(0, 1).toUpperCase()}</div><div><strong>{userEmail.split('@')[0]}</strong><small>{userEmail}</small></div><button onClick={signOut} title="Cerrar sesión"><LogIn size={14} /></button></div></div></aside><div className="workspace-main"><header className="workspace-header"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div><p className="header-kicker">Espacio de trabajo</p><h1>{navigation.find((item) => item.id === current)?.label || 'Dashboard'}</h1></div><div className="header-actions"><span className="online-label"><span className="status-dot" /> En línea</span><div className="avatar">{userEmail.slice(0, 1).toUpperCase()}</div></div></header><main className="workspace-content"><Routes><Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<Dashboard />} /><Route path="projects" element={<Projects />} /><Route path="backlog" element={<ModulePlaceholder title="Historias de usuario" icon={<ClipboardList />} description="Gestiona el backlog, criterios de aceptación y prioridad de cada historia." table="user_stories" />} /><Route path="kanban" element={<ModulePlaceholder title="Tablero Kanban" icon={<Boxes />} description="Visualiza y actualiza el flujo de tareas del equipo." table="tasks" />} /><Route path="iterations" element={<ModulePlaceholder title="Iteraciones XP" icon={<IterationCw />} description="Planifica ciclos, objetivos y capacidad del equipo." table="iterations" />} /><Route path="quality" element={<ModulePlaceholder title="Pruebas y bugs" icon={<ShieldCheck />} description="La calidad se integrará con las tablas de pruebas y defectos de tu esquema." table="bugs" />} /><Route path="metrics" element={<ModulePlaceholder title="Métricas XP" icon={<BarChart3 />} description="Métricas calculadas desde historias, tareas e iteraciones persistidas." table="tasks" />} /></Routes></main></div></div>
}

function Dashboard() {
  const [projects, setProjects] = useState<Row[]>([])
  const [tasks, setTasks] = useState<Row[]>([])
  const [stories, setStories] = useState<Row[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (!supabase) return
    let active = true
    void Promise.all([supabase.from('projects').select('*'), supabase.from('tasks').select('*'), supabase.from('user_stories').select('*')]).then(([projectsResult, tasksResult, storiesResult]) => {
      if (!active) return
      const firstError = projectsResult.error || tasksResult.error || storiesResult.error
      if (firstError) setError(firstError.message)
      setProjects(projectsResult.data || [])
      setTasks(tasksResult.data || [])
      setStories(storiesResult.data || [])
    })
    return () => { active = false }
  }, [])
  const completedTasks = tasks.filter((task) => ['done', 'completed', 'completado'].includes(String(task.status).toLowerCase())).length
  return <><div className="page-intro"><div><p className="eyebrow">Resumen operativo</p><h2>Hola, equipo 👋</h2><p className="muted">Aquí tienes el pulso de tus proyectos y el avance actual.</p></div><a className="button button-primary" href="/app/projects"><Plus size={16} /> Nuevo proyecto</a></div>{error && <Notice message={`No se pudieron cargar todos los datos: ${error}`} /> }<div className="stat-grid"><Stat label="Proyectos" value={projects.length} icon={<FolderKanban />} tone="blue" /><Stat label="Historias" value={stories.length} icon={<ClipboardList />} tone="purple" /><Stat label="Tareas" value={tasks.length} icon={<Boxes />} tone="orange" /><Stat label="Tareas completadas" value={completedTasks} icon={<CheckCircle2 />} tone="green" /></div><div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><h3>Proyectos recientes</h3><p>Datos sincronizados desde Supabase</p></div><a href="/app/projects">Ver todos</a></div>{projects.length === 0 ? <EmptyState title="Aún no tienes proyectos" text="Crea tu primer proyecto para empezar a colaborar." link="/app/projects" /> : <div className="project-list">{projects.slice(0, 5).map((project) => <div className="project-row" key={String(project.id)}><span className="project-icon"><FolderKanban size={16} /></span><div><strong>{String(project.name || project.title || 'Proyecto sin nombre')}</strong><small>{String(project.description || 'Sin descripción')}</small></div><ChevronRight size={16} /></div>)}</div>}</section><section className="panel progress-panel"><div className="panel-heading"><div><h3>Ritmo del equipo</h3><p>Indicadores del espacio actual</p></div></div><div className="progress-ring"><strong>{tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%</strong><span>avance de tareas</span></div><div className="mini-metrics"><span><b>{stories.length}</b> historias</span><span><b>{projects.length}</b> proyectos</span></div></section></div></>
}

function Projects() {
  const [projects, setProjects] = useState<Row[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!supabase) return
    void supabase.from('projects').select('*').order('created_at', { ascending: false }).then(({ data, error: queryError }) => { setProjects(data || []); if (queryError) setError(queryError.message) })
  }, [refresh])
  async function createProject(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !name.trim()) return
    setBusy(true); setError('')
    const user = (await supabase.auth.getUser()).data.user
    const payload: Row = { name: name.trim(), description: description.trim() || null }
    if (user) payload.owner_id = user.id
    const { error: insertError } = await supabase.from('projects').insert(payload)
    setBusy(false)
    if (insertError) setError(insertError.message)
    else { setName(''); setDescription(''); setShowForm(false); setRefresh((value) => value + 1) }
  }
  return <><div className="page-intro"><div><p className="eyebrow">Workspace</p><h2>Proyectos</h2><p className="muted">Organiza productos, equipos e iteraciones desde un solo lugar.</p></div><button className="button button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Nuevo proyecto</button></div>{error && <Notice message={error} />}{showForm && <form className="panel project-form" onSubmit={createProject}><h3>Crear proyecto</h3><div className="form-grid"><label>Nombre<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Plataforma web" /></label><label>Descripción<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Objetivo del proyecto" /></label></div><div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar proyecto'}</button></div></form>}<section className="projects-grid">{projects.map((project) => <article className="project-card" key={String(project.id)}><div className="project-card-top"><span className="project-icon"><FolderKanban size={17} /></span><span className="project-status">Activo</span></div><h3>{String(project.name || project.title || 'Proyecto sin nombre')}</h3><p>{String(project.description || 'Sin descripción')}</p><div className="project-card-footer"><span><Users size={14} /> colaboradores</span><a href="/app/backlog">Abrir proyecto <ChevronRight size={14} /></a></div></article>)}{projects.length === 0 && <div className="panel empty-wide"><EmptyState title="Crea tu primer proyecto" text="Los proyectos se guardan directamente en tu tabla projects de Supabase." link="#" /></div>}</section></>
}

function ModulePlaceholder({ title, description, icon, table }: { title: string; description: string; icon: ReactNode; table: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  useEffect(() => { if (!supabase) return; void supabase.from(table).select('*').limit(50).then(({ data, error: queryError }) => { setRows(data || []); if (queryError) setError(queryError.message) }) }, [table])
  return <><div className="page-intro"><div><p className="eyebrow">Módulo XPFlow</p><h2>{title}</h2><p className="muted">{description}</p></div><button className="button button-primary"><Plus size={16} /> Nuevo</button></div>{error ? <Notice message={`La tabla ${table} no está disponible o requiere permisos RLS: ${error}`} /> : <section className="panel module-panel"><div className="module-icon">{icon}</div><h3>{rows.length ? `${rows.length} registros sincronizados` : `Conecta ${table} para comenzar`}</h3><p>Este módulo ya consulta Supabase. La siguiente iteración añadirá sus operaciones CRUD específicas según las columnas existentes.</p>{rows.length > 0 && <div className="record-list">{rows.slice(0, 8).map((row, index) => <div key={String(row.id || index)}><strong>{String(row.name || row.title || row.description || `Registro ${index + 1}`)}</strong><small>{String(row.status || row.priority || 'Sin estado')}</small></div>)}</div>}</section>}</>
}

function Notice({ message }: { message: string }) { return <div className="notice"><ShieldCheck size={16} />{message}</div> }
function EmptyState({ title, text, link }: { title: string; text: string; link: string }) { return <div className="empty-state"><FolderKanban size={23} /><h3>{title}</h3><p>{text}</p>{link !== '#' && <a className="button button-primary" href={link}><Plus size={15} /> Crear ahora</a>}</div> }
function Stat({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: string }) { return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div> }
function Preview() { return <div className="workspace-preview"><div className="preview-header"><span className="preview-title">Mi espacio de trabajo</span><span className="preview-online">● En línea</span></div><div className="preview-stats"><div><small>Proyectos activos</small><strong>04</strong></div><div><small>Historias completadas</small><strong>68%</strong></div><div><small>Equipo conectado</small><strong>12</strong></div></div><div className="preview-board"><div className="board-column"><div className="column-title"><span className="column-dot dot-blue" />Por hacer <b>3</b></div></div><div className="board-column"><div className="column-title"><span className="column-dot dot-yellow" />En progreso <b>2</b></div></div><div className="board-column"><div className="column-title"><span className="column-dot dot-green" />Completado <b>5</b></div></div></div></div> }
function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <article className="feature"><span className="feature-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article> }

export default App
