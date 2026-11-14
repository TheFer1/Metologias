# XPFlow

Base de una plataforma colaborativa para gestión de proyectos con Extreme Programming.

## Desarrollo local

1. Copia `.env.example` como `.env.local`.
2. Completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` con los valores públicos del proyecto Supabase existente.
3. Ejecuta:

```bash
npm install
npm run dev
```

`.env.local` está excluido del control de versiones. Nunca uses una contraseña de PostgreSQL, `service_role` ni otra clave secreta en el frontend.

## Estado actual

- React + Vite + TypeScript.
- Tailwind CSS preparado mediante el plugin de Vite.
- Cliente Supabase con configuración segura y detección explícita de variables faltantes.
- Acceso por enlace mágico de Supabase Auth cuando el proyecto está configurado.
- Dependencias instaladas para React Router, TanStack Query, Recharts, Lucide y dnd-kit.
- Pantalla inicial responsive para XPFlow.

## Siguiente fase

Cuando `.env.local` esté configurado, se inspeccionará el esquema existente de Supabase (`profiles`, `projects`, `project_members`, `iterations`, `user_stories` y `tasks`), sus relaciones y políticas RLS antes de crear cualquier migración incremental.

## Despliegue en Vercel

Importa el repositorio en Vercel y configura las mismas dos variables públicas en Project Settings → Environment Variables. El comando de build es `npm run build` y el directorio de salida es `dist`.
