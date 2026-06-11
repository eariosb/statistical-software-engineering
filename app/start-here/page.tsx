import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, Database, GraduationCap, ArrowRight } from 'lucide-react';
import { getDocHref } from '@/lib/navigation';

export const metadata: Metadata = {
  title: '¿Por dónde empiezo? | Ingeniería de Software Estadístico',
  description:
    'Rutas de lectura guiadas según tu perfil: estadístico que quiere llegar a producción, ingeniero de datos o estudiante.'
};

type Step = { title: string; slug: string; note: string };

type Path = {
  id: string;
  icon: typeof BarChart3;
  label: string;
  headline: string;
  description: string;
  steps: Step[];
};

const paths: Path[] = [
  {
    id: 'estadistico',
    icon: BarChart3,
    label: 'Soy estadístico y quiero llegar a producción',
    headline: 'De los modelos al despliegue',
    description:
      'Ya dominas R o Python y los modelos. Lo que te falta es la ingeniería: versionar, desplegar, monitorear. Esta ruta cierra esa brecha.',
    steps: [
      {
        title: 'Getting Started',
        slug: 'Getting_Started',
        note: 'El flujo completo en ~30 minutos: validación, MLflow, API con FastAPI y dashboard. Empieza aquí sí o sí.'
      },
      {
        title: 'Principios de Software Estadístico',
        slug: 'Statistical_Software_Principles',
        note: 'La arquitectura en capas que evita que tu proyecto sea un notebook gigante.'
      },
      {
        title: 'MLflow y Gestión de Modelos',
        slug: 'MLflow',
        note: 'Tracking, registry y aliases: cada experimento queda registrado y reproducible.'
      },
      {
        title: 'Guía de Despliegue (CI/CD + Docker)',
        slug: 'Deployment_Guide',
        note: 'Empaqueta y despliega tu modelo como un servicio real.'
      },
      {
        title: 'Buenas Prácticas Shiny',
        slug: 'Shiny_Best_Practices',
        note: 'Si tu frontend natural es Shiny, así se hace mantenible y rápido.'
      }
    ]
  },
  {
    id: 'data-engineer',
    icon: Database,
    label: 'Soy data engineer / MLOps',
    headline: 'Operar modelos con rigor estadístico',
    description:
      'Ya sabes de pipelines e infraestructura. Esta ruta cubre lo específico de operar productos estadísticos: gobernanza, monitoreo de modelos y compliance.',
    steps: [
      {
        title: 'DataOps e Ingeniería Estadística',
        slug: 'DataOps_Statistical_Engineering',
        note: 'Qué cambia en DataOps cuando el artefacto central es un modelo estadístico.'
      },
      {
        title: 'Feature Store',
        slug: 'Feature_Store',
        note: 'Consistencia entre entrenamiento y serving: el problema que más sistemas rompe.'
      },
      {
        title: 'Monitoreo de Modelos',
        slug: 'Monitoring',
        note: 'Drift, degradación y umbrales conectados a alertas, no a dashboards decorativos.'
      },
      {
        title: 'Rollback de Modelos',
        slug: 'Rollback',
        note: 'Plan de reversión documentado antes de que lo necesites.'
      },
      {
        title: 'Checklist Compliance MLOps',
        slug: 'MLOps_Compliance_Checklist',
        note: 'La lista de verificación para auditar cualquier sistema en producción.'
      }
    ]
  },
  {
    id: 'estudiante',
    icon: GraduationCap,
    label: 'Soy estudiante',
    headline: 'Construye las bases correctas desde el inicio',
    description:
      'Aprende desde el principio lo que a la mayoría le toma años descubrir en el trabajo: cómo se construye software estadístico profesional.',
    steps: [
      {
        title: 'Resumen',
        slug: 'Summary',
        note: 'El mapa general del manual y el Data Product Canvas.'
      },
      {
        title: 'Getting Started',
        slug: 'Getting_Started',
        note: 'Tu primer sistema completo, paso a paso y ejecutable. Hazlo en tu máquina.'
      },
      {
        title: 'Principios de Software Estadístico',
        slug: 'Statistical_Software_Principles',
        note: 'Los fundamentos de arquitectura que diferencian un script de un producto.'
      },
      {
        title: 'Roadmap de Madurez',
        slug: 'Roadmap',
        note: 'Qué aprender después y en qué orden, sin perderte.'
      },
      {
        title: 'Cultura de Datos',
        slug: 'Data_Culture',
        note: 'El contexto organizacional en el que vivirá tu trabajo técnico.'
      }
    ]
  }
];

export default function StartHerePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <section className="mb-8 text-center">
        <h1 className="text-2xl font-semibold md:text-3xl">¿Por dónde empiezo?</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-muted">
          El manual cubre todo el ciclo: de un modelo en R/Python a un producto de datos en producción. Elige la ruta
          que corresponde a tu perfil y síguela en orden — cada una toma unas pocas horas de lectura.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {paths.map((path) => {
          const Icon = path.icon;
          return (
            <section key={path.id} className="flex flex-col rounded-xl border border-border bg-bg p-4">
              <div className="mb-3 flex items-start gap-3">
                <span className="rounded-lg border border-border p-2">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold leading-snug">{path.label}</h2>
                  <p className="text-xs text-muted">{path.headline}</p>
                </div>
              </div>

              <p className="mb-4 text-xs leading-relaxed text-muted">{path.description}</p>

              <ol className="flex flex-1 flex-col gap-2">
                {path.steps.map((step, index) => (
                  <li key={step.slug}>
                    <Link
                      href={getDocHref(step.slug)}
                      className="group block rounded-lg border border-border px-3 py-2 transition-colors hover:border-slate-400 dark:hover:border-slate-500"
                    >
                      <span className="flex items-center gap-2 text-xs font-semibold">
                        <span className="text-muted">{index + 1}.</span>
                        {step.title}
                        <ArrowRight
                          className="ml-auto h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-0.5 block text-xs leading-snug text-muted">{step.note}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-muted">
        ¿Prefieres explorar libremente? Ve al{' '}
        <Link href="/" className="underline hover:text-text">
          mapa completo del manual
        </Link>{' '}
        o usa el{' '}
        <Link href="/search" className="underline hover:text-text">
          buscador
        </Link>
        .
      </p>
    </div>
  );
}
