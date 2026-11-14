import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3, Boxes, CheckCircle2, ChevronRight, ClipboardList, FolderKanban,
  IterationCw, LayoutDashboard, LogIn, Menu, Plus, Rocket, Settings2, ShieldCheck,
  Users, UserPlus, X, Zap,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

type Session = NonNullable<Awaited<ReturnType<NonNullable<typeof supabase>['auth']['getSession']>>['data']['session']>
type Row = Record<string, unknown>
type Section = 'dashboard' | 'projects' | 'team' | 'backlog' | 'kanban' | 'iterations' | 'quality' | 'metrics' | 'practices'
type WorkspaceContextValue = { activeProjectId: string; setActiveProjectId: (id: string) => void; projects: Row[] }
const workspaceContext = createContext<WorkspaceContextValue | null>(null)

function useWorkspace() {
  const context = useContext(workspaceContext)
  if (!context) throw new Error('Workspace context is unavailable')
  return context
}

function belongsToProject(row: Row, projectId: string) {
  if (!projectId) return true
  const relation = row.project_id ?? row.projectId
  return relation === undefined || String(relation) === projectId
}

const navigation: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Proyectos', icon: FolderKanban },
  { id: 'team', label: 'Equipo', icon: Users },
  { id: 'backlog', label: 'Historias de usuario', icon: ClipboardList },
  { id: 'kanban', label: 'Tablero Kanban', icon: Boxes },
  { id: 'iterations', label: 'Iteraciones', icon: IterationCw },
  { id: 'quality', label: 'Pruebas y bugs', icon: ShieldCheck },
  { id: 'metrics', label: 'Métricas XP', icon: BarChart3 },
  { id: 'practices', label: 'Prácticas XP', icon: Zap },
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
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setMessage('Configura las variables públicas de Supabase para continuar.')
      return
    }
    setSubmitting(true)
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })
    setSubmitting(false)
    setMessage(result.error
      ? result.error.message
      : mode === 'login'
        ? 'Sesión iniciada. Cargando tu espacio...'
        : 'Cuenta creada. Ya puedes entrar a tu espacio.')
  }

  return (
    <main className="app-shell landing">
      <nav className="topbar"><a className="brand" href="/login"><span className="brand-mark"><Rocket size={18} /></span><span>XP<span className="brand-accent">Flow</span></span></a><span className="status-pill"><span className="status-dot" /> colaboración en equipo</span></nav>
      <section className="hero"><div className="hero-copy"><p className="eyebrow">Gestión de proyectos · Extreme Programming</p><h1>Construye mejor.<br /><span>Juntos.</span></h1><p className="hero-lead">El espacio colaborativo para convertir historias de usuario en software entregable, con el ritmo y la transparencia de XP.</p><div className="hero-actions"><a className="button button-primary" href="#access">Comenzar ahora <Zap size={17} /></a><a className="button button-quiet" href="#features">Conocer la plataforma</a></div><div className="trust-row"><ShieldCheck size={16} /><span>Datos protegidos con Supabase Row Level Security</span></div></div><Preview /></section>
      <section id="features" className="features"><Feature icon={<LayoutDashboard size={20} />} title="Todo en un lugar" text="Backlog, iteraciones, tareas y métricas conectadas." /><Feature icon={<Users size={20} />} title="Equipo sincronizado" text="Colaboración en tiempo real para avanzar sin bloqueos." /><Feature icon={<ShieldCheck size={20} />} title="Seguro por diseño" text="Autenticación y permisos respaldados por Supabase." /></section>
      <section id="access" className="access-card"><div><p className="eyebrow">Tu siguiente iteración empieza aquí</p><h2>{mode === 'login' ? 'Accede a tu espacio' : 'Crea tu cuenta'}</h2><p>Usa tus credenciales para entrar al espacio de trabajo.</p></div><form onSubmit={handleSignIn} className="access-form"><div className="auth-tabs"><button type="button" className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('login'); setMessage('') }}>Iniciar sesión</button><button type="button" className={mode === 'signup' ? 'auth-tab active' : 'auth-tab'} onClick={() => { setMode('signup'); setMessage('') }}>Crear cuenta</button></div><label htmlFor="email">Correo electrónico</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@equipo.com" /><label htmlFor="password">Contraseña</label><input id="password" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" /><button className="button button-primary auth-submit" disabled={submitting}><LogIn size={16} />{submitting ? 'Procesando...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</button>{message && <p className="form-message" role="status">{message}</p>}{!isSupabaseConfigured && <p className="setup-note">Falta configurar <code>.env.local</code>.</p>}</form></section>
      <footer><span>XPFlow · Plataforma colaborativa para equipos ágiles</span><span>Construido con React + Supabase</span></footer>
    </main>
  )
}

function Workspace({ session }: { session: Session }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [projects, setProjects] = useState<Row[]>([])
  const [activeProjectId, setActiveProjectId] = useState(() => window.sessionStorage.getItem('xpflow-project') || '')
  const current = (location.pathname.split('/')[2] || 'dashboard') as Section
  const userEmail = session.user.email || 'Usuario'
  useEffect(() => {
    if (!supabase) return
    void supabase.from('projects').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      const available = data || []
      setProjects(available)
      if (!activeProjectId && available[0]?.id !== undefined) setActiveProjectId(String(available[0].id))
    })
  }, [activeProjectId])
  useEffect(() => {
    if (activeProjectId) window.sessionStorage.setItem('xpflow-project', activeProjectId)
  }, [activeProjectId])

  async function signOut() {
    if (supabase) await supabase.auth.signOut()
  }

  return <workspaceContext.Provider value={{ activeProjectId, setActiveProjectId, projects }}><div className="workspace"><aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><a className="brand" href="/app"><span className="brand-mark"><Rocket size={17} /></span><span>XP<span className="brand-accent">Flow</span></span></a><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><p className="nav-caption">Espacio de trabajo</p><nav>{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={current === id ? 'nav-item active' : 'nav-item'} onClick={() => { navigate(`/app/${id}`); setMobileOpen(false) }}><Icon size={17} /><span>{label}</span>{current === id && <ChevronRight className="nav-arrow" size={14} />}</button>)}</nav><div className="sidebar-bottom"><button className="nav-item"><Settings2 size={17} /><span>Configuración</span></button><div className="user-card"><div className="avatar">{userEmail.slice(0, 1).toUpperCase()}</div><div><strong>{userEmail.split('@')[0]}</strong><small>{userEmail}</small></div><button onClick={signOut} title="Cerrar sesión"><LogIn size={14} /></button></div></div></aside><div className="workspace-main"><header className="workspace-header"><button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div><p className="header-kicker">Espacio de trabajo</p><h1>{navigation.find((item) => item.id === current)?.label || 'Dashboard'}</h1></div><div className="header-actions"><select className="project-selector" value={activeProjectId} onChange={(event) => setActiveProjectId(event.target.value)} aria-label="Proyecto activo"><option value="">Todos los proyectos</option>{projects.map((project) => <option key={String(project.id)} value={String(project.id)}>{String(project.name || project.title || 'Proyecto')}</option>)}</select><span className="online-label"><span className="status-dot" /> En línea</span><div className="avatar">{userEmail.slice(0, 1).toUpperCase()}</div></div></header><main className="workspace-content"><Routes><Route index element={<Navigate to="dashboard" replace />} /><Route path="dashboard" element={<Dashboard />} />  <Route path="projects" element={<Projects />} /><Route path="team" element={<Team />} /><Route path="backlog" element={<Stories />} /><Route path="kanban" element={<Tasks />} /><Route path="iterations" element={<Iterations />} /><Route path="quality" element={<CrudModule title="Pruebas y bugs" description="Registra evidencias de calidad y defectos del producto." table="bugs" fields={[{ key: 'title', label: 'Título', required: true }, { key: 'description', label: 'Descripción' }, { key: 'status', label: 'Estado' }]} />} /><Route path="metrics" element={<Metrics />} /><Route path="practices" element={<CrudModule title="Prácticas XP" description="Registra pair programming, TDD, refactorización e integración continua." table="xp_practices" fields={[{ key: 'practice', label: 'Práctica', required: true }, { key: 'status', label: 'Estado' }, { key: 'notes', label: 'Notas' }]} />} /></Routes></main></div></div></workspaceContext.Provider>
}

function Dashboard() {
  const { activeProjectId } = useWorkspace()
  const [projects, setProjects] = useState<Row[]>([])
  const [tasks, setTasks] = useState<Row[]>([])
  const [stories, setStories] = useState<Row[]>([])
  const [error, setError] = useState('')
  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    const load = () => void Promise.all([client.from('projects').select('*'), client.from('tasks').select('*'), client.from('user_stories').select('*')]).then(([projectsResult, tasksResult, storiesResult]) => {
      if (!active) return
      const firstError = projectsResult.error || tasksResult.error || storiesResult.error
      if (firstError) setError(firstError.message)
      setProjects((projectsResult.data || []).filter((row) => belongsToProject(row, activeProjectId)))
      setTasks((tasksResult.data || []).filter((row) => belongsToProject(row, activeProjectId)))
      setStories((storiesResult.data || []).filter((row) => belongsToProject(row, activeProjectId)))
    })
    load()
    const channel = client.channel('xpflow-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stories' }, load)
      .subscribe()
    return () => { active = false; void client.removeChannel(channel) }
  }, [activeProjectId])
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
    const client = supabase
    void client.from('projects').select('*').order('created_at', { ascending: false }).then(({ data, error: queryError }) => { setProjects(data || []); if (queryError) setError(queryError.message) })
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

function Stories() {
  return <CrudModule title="Historias de usuario" description="Prioriza el backlog y registra el valor de cada historia." table="user_stories" fields={[{ key: 'title', label: 'Título', required: true }, { key: 'description', label: 'Descripción' }, { key: 'priority', label: 'Prioridad' }]} />
}

function Iterations() {
  return <CrudModule title="Iteraciones XP" description="Planifica ciclos, objetivos y capacidad del equipo." table="iterations" fields={[{ key: 'name', label: 'Nombre', required: true }, { key: 'goal', label: 'Objetivo' }, { key: 'status', label: 'Estado' }]} />
}

function Tasks() {
  const { activeProjectId } = useWorkspace()
  const [tasks, setTasks] = useState<Row[]>([])
  const [stories, setStories] = useState<Row[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', user_story_id: '', estimate_hours: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!supabase) return
    const client = supabase
    const load = () => void client.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data, error: queryError }) => { setTasks((data || []).filter((row) => belongsToProject(row, activeProjectId))); if (queryError) setError(queryError.message) })
    void client.from('user_stories').select('*').then(({ data, error: queryError }) => { setStories((data || []).filter((row) => belongsToProject(row, activeProjectId))); if (queryError) setError(queryError.message) })
    load()
    const channel = client.channel('xpflow-tasks').on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, load).subscribe()
    return () => { void client.removeChannel(channel) }
  }, [refresh, activeProjectId])
  async function createTask(event: FormEvent) {
    event.preventDefault()
    if (!supabase || !form.title.trim()) return
    setBusy(true)
    setError('')
    const payload: Row = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      priority: form.priority,
      assignee_id: form.assignee_id.trim() || null,
      user_story_id: form.user_story_id || null,
      estimate_hours: form.estimate_hours ? Number(form.estimate_hours) : null,
    }
    if (activeProjectId) payload.project_id = activeProjectId
    const { error: insertError } = await supabase.from('tasks').insert(payload)
    setBusy(false)
    if (insertError) setError(`No se pudo crear la tarea. Verifica columnas/RLS: ${insertError.message}`)
    else {
      setForm({ title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', user_story_id: '', estimate_hours: '' })
      setShowForm(false)
      setRefresh((value) => value + 1)
    }
  }
  async function updateStatus(task: Row, status: string) {
    if (!supabase || task.id === undefined) return
    const { error: updateError } = await supabase.from('tasks').update({ status }).eq('id', task.id)
    if (updateError) setError(updateError.message)
    else setRefresh((value) => value + 1)
  }

  const columns = [{ key: 'todo', label: 'Por hacer' }, { key: 'in_progress', label: 'En progreso' }, { key: 'done', label: 'Completado' }]
  return <><div className="page-intro"><div><p className="eyebrow">Flujo de trabajo</p><h2>Tablero Kanban</h2><p className="muted">Cada tarea queda asociada al proyecto, historia, responsable y estimación.</p></div><button className="button button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Nueva tarea</button></div>{error && <Notice message={error} />}{showForm && <form className="panel project-form" onSubmit={createTask}><h3>Registrar tarea trazable</h3><div className="form-grid"><label>Título<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Implementar login" /></label><label>Descripción<input value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Qué debe hacerse" /></label><label>Responsable (UUID)<input value={form.assignee_id} onChange={(event) => setForm({ ...form, assignee_id: event.target.value })} placeholder="UUID del usuario" /></label><label>Historia relacionada<select value={form.user_story_id} onChange={(event) => setForm({ ...form, user_story_id: event.target.value })}><option value="">Sin historia</option>{stories.map((story) => <option key={String(story.id)} value={String(story.id)}>{String(story.title || story.name || story.id)}</option>)}</select></label><label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label><label>Estimación (horas)<input type="number" min="0" step="0.5" value={form.estimate_hours} onChange={(event) => setForm({ ...form, estimate_hours: event.target.value })} /></label></div><div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar tarea'}</button></div></form>}<div className="kanban-board">{columns.map((column) => <section className="kanban-column" key={column.key}><div className="kanban-heading"><span>{column.label}</span><b>{tasks.filter((task) => normalizeStatus(task.status) === column.key).length}</b></div>{tasks.filter((task) => normalizeStatus(task.status) === column.key).map((task) => <article className="kanban-card" key={String(task.id)}><strong>{String(task.title || task.name || task.description || 'Tarea sin título')}</strong><small>ID: {String(task.id || 'sin ID')}</small><small>Responsable: {String(task.assignee_id || 'Sin asignar')}</small><small>Historia: {String(task.user_story_id || 'Sin historia')} · {String(task.estimate_hours || 0)} h</small><select value={normalizeStatus(task.status)} onChange={(event) => void updateStatus(task, event.target.value)} aria-label="Cambiar estado"><option value="todo">Por hacer</option><option value="in_progress">En progreso</option><option value="done">Completado</option></select></article>)}</section>)}</div></>
}

function normalizeStatus(value: unknown): string {
  const status = String(value || '').toLowerCase().replace(/[\s-]/g, '_')
  if (['done', 'completed', 'complete', 'completado'].includes(status)) return 'done'
  if (['in_progress', 'progress', 'inprogress', 'en_progreso'].includes(status)) return 'in_progress'
  return 'todo'
}

function Team() {
  const { activeProjectId } = useWorkspace()
  const [members, setMembers] = useState<Row[]>([])
  const [form, setForm] = useState({ project_id: '', user_id: '', role: 'developer' })
  const [error, setError] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!supabase) return
    const client = supabase
    void client.from('project_members').select('*').limit(100).then(({ data, error: queryError }) => { setMembers((data || []).filter((row) => belongsToProject(row, activeProjectId))); if (queryError) setError(queryError.message) })
  }, [refresh, activeProjectId])
  async function addMember(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    const { error: insertError } = await supabase.from('project_members').insert(form)
    if (insertError) setError(insertError.message)
    else { setForm({ project_id: '', user_id: '', role: 'developer' }); setRefresh((value) => value + 1) }
  }
  return <><div className="page-intro"><div><p className="eyebrow">Colaboración</p><h2>Equipo</h2><p className="muted">Administra miembros y roles en tus proyectos.</p></div></div>{error && <Notice message={`Supabase: ${error}`} />}<form className="panel project-form" onSubmit={addMember}><h3>Agregar colaborador</h3><div className="form-grid"><label>ID del proyecto<input required value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })} placeholder="UUID del proyecto" /></label><label>ID del usuario<input required value={form.user_id} onChange={(event) => setForm({ ...form, user_id: event.target.value })} placeholder="UUID del usuario" /></label><label>Rol<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="developer">Developer</option><option value="tester">Tester</option><option value="manager">Manager</option><option value="owner">Owner</option></select></label></div><div className="form-actions"><button className="button button-primary"><UserPlus size={16} /> Agregar miembro</button></div></form><section className="panel module-panel"><div className="module-icon"><Users size={25} /></div><h3>{members.length ? `${members.length} miembros registrados` : 'Sin miembros registrados'}</h3><p>Los miembros se consultan desde <code>project_members</code>. Para invitar por correo se requiere una Edge Function segura.</p>{members.length > 0 && <div className="record-list">{members.map((member, index) => <div key={String(member.id || index)}><strong>{String(member.user_id || 'Usuario')}</strong><small>{String(member.role || 'Sin rol')}</small></div>)}</div>}</section></>
}

function Metrics() {
  const { activeProjectId } = useWorkspace()
  const [tasks, setTasks] = useState<Row[]>([])
  const [stories, setStories] = useState<Row[]>([])
  const [iterations, setIterations] = useState<Row[]>([])
  const [error, setError] = useState('')
  useEffect(() => { if (!supabase) return; void Promise.all([supabase.from('tasks').select('*'), supabase.from('user_stories').select('*'), supabase.from('iterations').select('*')]).then(([taskResult, storyResult, iterationResult]) => { setTasks((taskResult.data || []).filter((row) => belongsToProject(row, activeProjectId))); setStories((storyResult.data || []).filter((row) => belongsToProject(row, activeProjectId))); setIterations((iterationResult.data || []).filter((row) => belongsToProject(row, activeProjectId))); const firstError = taskResult.error || storyResult.error || iterationResult.error; if (firstError) setError(firstError.message) }) }, [activeProjectId])
  const completed = tasks.filter((task) => normalizeStatus(task.status) === 'done').length
  const completion = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  return <><div className="page-intro"><div><p className="eyebrow">Visibilidad XP</p><h2>Métricas del equipo</h2><p className="muted">Indicadores calculados a partir de tus datos persistidos.</p></div></div>{error && <Notice message={error} />}<div className="metric-cards"><Stat label="Avance de tareas" value={completion} icon={<CheckCircle2 />} tone="green" /><Stat label="Historias del backlog" value={stories.length} icon={<ClipboardList />} tone="purple" /><Stat label="Iteraciones" value={iterations.length} icon={<IterationCw />} tone="blue" /><Stat label="Tareas completadas" value={completed} icon={<Boxes />} tone="orange" /></div><section className="panel metric-summary"><h3>Velocidad actual</h3><div className="metric-bar"><span style={{ width: `${completion}%` }} /></div><p>{completion}% de las tareas registradas están completadas.</p></section></>
}

function CrudModule({ title, description, table, fields }: { title: string; description: string; table: string; fields: { key: string; label: string; required?: boolean }[] }) {
  const { activeProjectId } = useWorkspace()
  const [rows, setRows] = useState<Row[]>([])
  const [error, setError] = useState('')
  const [form, setForm] = useState<Row>({})
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => { if (!supabase) return; void supabase.from(table).select('*').limit(50).then(({ data, error: queryError }) => { setRows((data || []).filter((row) => belongsToProject(row, activeProjectId))); if (queryError) setError(queryError.message) }) }, [table, refresh, activeProjectId])
  async function create(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setError('')
    const payload = activeProjectId ? { ...form, project_id: activeProjectId } : form
    const { error: insertError } = await supabase.from(table).insert(payload)
    setBusy(false)
    if (insertError) setError(insertError.message)
    else { setForm({}); setShowForm(false); setRefresh((value) => value + 1) }
  }
  return <><div className="page-intro"><div><p className="eyebrow">Módulo XPFlow</p><h2>{title}</h2><p className="muted">{description}</p></div><button className="button button-primary" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> Nuevo</button></div>{error && <Notice message={`Supabase: ${error}`} />}{showForm && <form className="panel project-form" onSubmit={create}><h3>Nuevo registro</h3><div className="form-grid">{fields.map((field) => <label key={field.key}>{field.label}<input required={field.required} value={String(form[field.key] || '')} onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))} /></label>)}</div><div className="form-actions"><button type="button" className="button button-quiet" onClick={() => setShowForm(false)}>Cancelar</button><button className="button button-primary" disabled={busy}>{busy ? 'Guardando...' : 'Guardar'}</button></div></form>}<section className="panel module-panel"><div className="module-icon"><ClipboardList size={25} /></div><h3>{rows.length ? `${rows.length} registros sincronizados` : `Sin registros en ${table}`}</h3><p>Los cambios se guardan en la tabla <code>{table}</code> de Supabase.</p>{rows.length > 0 && <div className="record-list">{rows.slice(0, 20).map((row, index) => <div key={String(row.id || index)}><strong>{String(row.name || row.title || row.description || `Registro ${index + 1}`)}</strong><small>{String(row.status || row.priority || 'Sin estado')}</small></div>)}</div>}</section></>
}

function Notice({ message }: { message: string }) { return <div className="notice"><ShieldCheck size={16} />{message}</div> }
function EmptyState({ title, text, link }: { title: string; text: string; link: string }) { return <div className="empty-state"><FolderKanban size={23} /><h3>{title}</h3><p>{text}</p>{link !== '#' && <a className="button button-primary" href={link}><Plus size={15} /> Crear ahora</a>}</div> }
function Stat({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: string }) { return <div className="stat-card"><span className={`stat-icon ${tone}`}>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></div> }
function Preview() { return <div className="workspace-preview"><div className="preview-header"><span className="preview-title">Mi espacio de trabajo</span><span className="preview-online">● En línea</span></div><div className="preview-stats"><div><small>Proyectos activos</small><strong>04</strong></div><div><small>Historias completadas</small><strong>68%</strong></div><div><small>Equipo conectado</small><strong>12</strong></div></div><div className="preview-board"><div className="board-column"><div className="column-title"><span className="column-dot dot-blue" />Por hacer <b>3</b></div></div><div className="board-column"><div className="column-title"><span className="column-dot dot-yellow" />En progreso <b>2</b></div></div><div className="board-column"><div className="column-title"><span className="column-dot dot-green" />Completado <b>5</b></div></div></div></div> }
function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) { return <article className="feature"><span className="feature-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article> }

export default App
