import { useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { LayoutDashboard, LogIn, Rocket, ShieldCheck, Users, Zap } from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

function LandingPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) {
      setMessage('Configura .env.local para conectar la aplicación con Supabase.')
      return
    }

    setIsSubmitting(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({ email })
    setIsSubmitting(false)
    setMessage(error ? error.message : 'Revisa tu correo para continuar.')
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark"><Rocket size={18} /></span>
          <span>XP<span className="brand-accent">Flow</span></span>
        </Link>
        <span className="status-pill"><span className="status-dot" /> colaboración en equipo</span>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Gestión de proyectos · Extreme Programming</p>
          <h1>Construye mejor.<br /><span>Juntos.</span></h1>
          <p className="hero-lead">
            El espacio de trabajo colaborativo para convertir historias de usuario
            en software entregable, con el ritmo y la transparencia de XP.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#access">Comenzar ahora <Zap size={17} /></a>
            <a className="button button-quiet" href="#features">Conocer la plataforma</a>
          </div>
          <div className="trust-row">
            <ShieldCheck size={16} />
            <span>Datos protegidos con Supabase Row Level Security</span>
          </div>
        </div>

        <div className="workspace-preview" aria-label="Vista previa del espacio de trabajo">
          <div className="preview-header"><span className="preview-title">Mi espacio de trabajo</span><span className="preview-online">● En línea</span></div>
          <div className="preview-stats">
            <div><small>Proyectos activos</small><strong>04</strong></div>
            <div><small>Historias completadas</small><strong>68%</strong></div>
            <div><small>Equipo conectado</small><strong>12</strong></div>
          </div>
          <div className="preview-board">
            <div className="board-column"><div className="column-title"><span className="column-dot dot-blue" />Por hacer <b>3</b></div><TaskCard title="Configurar autenticación" tag="Backend" /></div>
            <div className="board-column"><div className="column-title"><span className="column-dot dot-yellow" />En progreso <b>2</b></div><TaskCard title="Diseñar dashboard" tag="Frontend" /></div>
            <div className="board-column"><div className="column-title"><span className="column-dot dot-green" />Completado <b>5</b></div><TaskCard title="Modelo de proyectos" tag="Core" done /></div>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <Feature icon={<LayoutDashboard size={20} />} title="Todo en un lugar" text="Backlog, iteraciones, tareas y métricas conectadas." />
        <Feature icon={<Users size={20} />} title="Equipo sincronizado" text="Colaboración en tiempo real para avanzar sin bloqueos." />
        <Feature icon={<ShieldCheck size={20} />} title="Seguro por diseño" text="Autenticación y permisos respaldados por Supabase." />
      </section>

      <section id="access" className="access-card">
        <div><p className="eyebrow">Tu siguiente iteración empieza aquí</p><h2>Accede a tu espacio</h2><p>Recibe un enlace seguro en tu correo electrónico.</p></div>
        <form onSubmit={handleSignIn} className="access-form">
          <label htmlFor="email">Correo electrónico</label>
          <div className="input-row"><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@equipo.com" /><button className="button button-primary" disabled={isSubmitting}><LogIn size={16} />{isSubmitting ? 'Enviando...' : 'Continuar'}</button></div>
          {message && <p className="form-message" role="status">{message}</p>}
          {!isSupabaseConfigured && <p className="setup-note">Falta configurar las variables públicas de Supabase en <code>.env.local</code>.</p>}
        </form>
      </section>

      <footer><span>XPFlow · Plataforma colaborativa para equipos ágiles</span><span>Construido con React + Supabase</span></footer>
    </main>
  )
}

function TaskCard({ title, tag, done = false }: { title: string; tag: string; done?: boolean }) {
  return <div className={`task-card ${done ? 'task-done' : ''}`}><span>{title}</span><small>{tag}</small></div>
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <article className="feature"><span className="feature-icon">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>
}

export default App
