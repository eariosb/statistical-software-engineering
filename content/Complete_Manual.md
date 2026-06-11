# Manual Completo de Ingeniería de Software Estadístico

Este manual integra los principios rectores, la arquitectura en capas, las prácticas de validación, seguridad, gobernanza y MLOps para la construcción de sistemas estadísticos profesionales, reproducibles y auditables.

---

## 1. Principios Rectores

| Principio | Descripción | Práctica recomendada |
| --- | --- | --- |
| Reproducibilidad | Un mismo proceso produce los mismos resultados bajo las mismas condiciones | Lock files, semillas fijas, registro de entorno |
| Modularidad | El sistema se compone de piezas independientes y reutilizables | Separación en capas, inyección de dependencias |
| Validación continua | Los errores se detectan temprano | Tests automáticos, contratos de datos en cada ingesta |
| Eficiencia | El sistema usa recursos de forma proporcional | Caché, paralelismo, lazy evaluation |
| Transparencia estadística | Los resultados comunican explícitamente la incertidumbre | Intervalos de credibilidad, diagnósticos de convergencia |
| Seguridad por diseño | Los datos y el código se protegen desde la arquitectura | Gestión de secretos, logs de acceso, cifrado de artefactos |
| Diseño para el reemplazo | Los componentes pueden intercambiarse sin afectar al sistema | Fábricas, estrategias, polimorfismo |
| Documentación como código | Las decisiones analíticas están versionadas y vinculadas al código | `docs/decisions/`, referencias en metadatos |

**Detalle completo**: [Principios y Arquitectura](Statistical_Software_Principles.md)

---

## 2. Arquitectura en Capas

La arquitectura recomendada separa responsabilidades en capas que dependen hacia adentro. La capa más interna (`core`) no conoce las externas.

```text
proyecto/
├── core/                    # Lógica estadística pura
│   ├── distributions.py     # Funciones de densidad, generación de muestras
│   ├── models.py            # Especificación de modelos (fórmulas, priors)
│   ├── inference.py         # Algoritmos de inferencia (MCMC, optimización)
│   └── statistics.py        # Estadísticos, tests, validaciones
├── adapters/                # Conexión con fuentes de datos externas
│   ├── database.py
│   ├── apis.py
│   ├── files.py             # CSV, Parquet, Delta Lake
│   └── cache.py
├── services/                # Orquestación de flujos de trabajo
│   ├── data_service.py      # Validación, limpieza, transformación
│   ├── model_service.py     # Ajuste, guardado, carga de modelos
│   ├── analysis_service.py
│   └── export_service.py
├── interfaces/              # Puntos de entrada
│   ├── api/                 # FastAPI
│   │   └── main.py
│   └── cli/                 # Scripts de línea de comandos
│       └── main.py
├── utils/
│   ├── logging.py           # Logger estructurado
│   ├── validators.py
│   ├── safe_eval.py
│   └── constants.py
├── tests/
│   ├── unit/
│   └── integration/
├── audit/                   # Trazas inmutables y metadatos
├── docs/
│   └── decisions/           # Decisiones analíticas versionadas
├── models/
├── data/
├── notebooks/               # Solo exploración; no producción
├── .github/
│   └── workflows/
├── pyproject.toml
└── README.md
```

### Reglas de dependencia

- `core` no depende de ninguna otra capa.

- `adapters` puede depender de `core`.

- `services` puede depender de `core` y `adapters`.

- `interfaces` puede depender de `services`, `adapters` y `core`.

- `utils` puede ser usado por todas las capas.

- La interfaz de usuario (Next.js) se comunica exclusivamente con la capa `interfaces/api`, no con el `core` directamente.

---

## 3. Validación de Calidad de Datos

Todo dato que ingresa al sistema debe validarse contra un contrato explícito. Ver [Principios y Arquitectura: Sección 3](Statistical_Software_Principles.md) para la definición de contratos YAML y la implementación con Great Expectations.

**Referencias**:
- [DataOps para Ingeniería Estadística](DataOps_Statistical_Engineering.md): pipelines como código, testing de datos, linaje.

- [Gobernanza de Datos](Data_Governance.md): catálogos, calidad continua, retención.

---

## 4. Modelado Estadístico Robusto

### 4.1 Patrón de fábrica

Los modelos se instancian mediante fábricas que permiten intercambiar implementaciones (bayesiana, frecuentista) sin modificar el código cliente. Ver [Principios y Arquitectura: Sección 4](Statistical_Software_Principles.md).

### 4.2 Gestión del ciclo de vida

- **MLflow**: tracking de experimentos, model registry, empaquetado. Ver [MLflow y Gestión de Modelos](MLflow.md).
- **Feature Store**: consistencia entre entrenamiento offline e inferencia online. Ver [Feature Store](Feature_Store.md).

### 4.3 Diagnósticos

| Criterio | Umbral mínimo | Herramienta |
| --- | --- | --- |
| R-hat | < 1.01 en todos los parámetros | `arviz.rhat()` |
| ESS ratio | > 0.1 | `arviz.ess()` |
| Divergencias | 0 (HMC) | `az.plot_parallel()` |

---

## 5. Seguridad

### 5.1 Evaluación segura de expresiones

Para sistemas que exponen evaluación de código de usuario, se requiere aislamiento a nivel de kernel. Ver [Principios y Arquitectura: Sección 6](Statistical_Software_Principles.md).

| Enfoque | Cuándo usarlo | Herramienta |
| --- | --- | --- |
| Contenedor efímero con gVisor | Producción: máximo aislamiento | Docker + `--runtime=runsc` |
| RestrictedPython | Entornos con control moderado | `pip install RestrictedPython` |
| Subproceso aislado con timeout | Prototipo / entorno educativo | `subprocess.run(timeout=5)` |

### 5.2 Gestión de secretos

Ver [Seguridad: Gestión de Secretos con Vault](Secrets_Management.md).

---

## 6. Gobernanza y Auditoría

Cada ejecución debe dejar traza inmutable. Los metadatos mínimos incluyen: timestamp, hash de Git, hash DVC del dataset, métricas de validación y versiones de bibliotecas.

**Referencias**:
- [Gobernanza de Datos](Data_Governance.md)
- [Principios y Arquitectura: Sección 13](Statistical_Software_Principles.md)

---

## 7. MLOps y Despliegue Continuo

### 7.1 API REST (FastAPI)

Endpoints estándar:

| Endpoint | Método | Descripción |
| --- | --- | --- |
| `/health` | GET | Verificar disponibilidad |
| `/fit` | POST | Ajustar un modelo (asíncrono) |
| `/fit/{task_id}` | GET | Consultar estado del ajuste |
| `/predict` | POST | Generar predicciones |
| `/diagnostics/{model_id}` | GET | Diagnósticos de un modelo |

### 7.2 Pipeline CI/CD

Ver [Guía de Despliegue](Deployment_Guide.md).

### 7.3 Monitoreo en producción

Ver [Monitoreo de Modelos en Producción](Monitoring.md).

### 7.4 Rollback

Ver [Rollback de Modelos](Rollback.md).

---

## 8. Checklist Unificado de Cumplimiento

El checklist completo está en [Checklist Unificado MLOps](MLOps_Compliance_Checklist.md). A continuación, un resumen de las categorías:

| Categoría | Requisitos clave | Documento |
| --- | --- | --- |
| Reproducibilidad | Lock file, semillas, snapshot de entorno, DVC | [Checklist MLOps §1](MLOps_Compliance_Checklist.md) |
| Calidad de datos | Contrato YAML, Great Expectations, auditoría de ingesta | [Checklist MLOps §2](MLOps_Compliance_Checklist.md) |
| Modelado | Registro en MLflow, diagnósticos, análisis de sensibilidad | [Checklist MLOps §3](MLOps_Compliance_Checklist.md) |
| Seguridad | Secretos en Vault, safe_eval con gVisor, escaneo de dependencias | [Checklist MLOps §4](MLOps_Compliance_Checklist.md) |
| API y despliegue | FastAPI, Docker, health checks, versionado de endpoints | [Checklist MLOps §5](MLOps_Compliance_Checklist.md) |
| Monitoreo | Data drift, prediction drift, latencia, tasa de error | [Checklist MLOps §6](MLOps_Compliance_Checklist.md) |
| Gobernanza | Logs de auditoría, manifiesto de integridad, retención | [Checklist MLOps §7](MLOps_Compliance_Checklist.md) |

---

## 9. Documentos Complementarios

| Documento | Contenido |
| --- | --- |
| [Principios y Arquitectura](Statistical_Software_Principles.md) | Desarrollo completo de principios, arquitectura, código de ejemplo |
| [Guía de Implementación](Statistical_Systems_Implementation_Guide.md) | Implementación paso a paso de un sistema estadístico completo |
| [Checklist Unificado MLOps](MLOps_Compliance_Checklist.md) | Checklist detallado con verificaciones [P] y [R] |
| [DataOps](DataOps_Statistical_Engineering.md) | Pipelines como código, dbt, testing de datos |
| [Gobernanza de Datos](Data_Governance.md) | Catálogos, linaje, calidad continua, retención |
| [MLflow](MLflow.md) | Tracking, Model Registry, empaquetado |
| [Feature Store](Feature_Store.md) | Registro, materialización offline/online, serving |
| [Monitoreo](Monitoring.md) | Data drift, concept drift, métricas operacionales |
| [Seguridad: Vault](Secrets_Management.md) | Gestión de secretos en contenedores |
| [Guía de Despliegue](Deployment_Guide.md) | Pipelines de integración, Docker y despliegue |
| [Pruebas de Integración](Integration_Tests.md) | Tests de modelos antes del despliegue |
| [Rollback](Rollback.md) | Estrategias de reversión de modelos |
| [Costos y Eficiencia](Cost_Efficiency.md) | FinOps para sistemas estadísticos |
| [Cultura de Datos](Data_Culture.md) | Data literacy, comunicación, dashboards accionables |
| [Diseño de Dashboards](UX_UI.md) | Principios de UX/UI para productos de datos |
| [Microagentes IA](Microagent_Skills.md) | Prompts especializados para desarrollo asistido |
| [Roadmap de Madurez](Roadmap.md) | Modelo de madurez de 5 niveles |
| [Resolución de Problemas](Problem_Solving.md) | Troubleshooting de sistemas en producción |
| [Resumen Ejecutivo](Summary.md) | Visión general del proyecto |

---

## 10. Guía de Inicio Rápido

Para una implementación práctica completa, consulta [Getting Started](Getting_Started.md).

---

<a id="referencias-bibliograficas"></a>

## 11. Referencias bibliográficas

### Arquitectura de Software

- **Fundamentals of Software Architecture** – *M. Richards & N. Ford*
Un punto de partida moderno y completo para arquitectos. Cubre estilos, principios, trade-offs y las habilidades "blandas" esenciales para el rol.

- **Software Architecture: The Hard Parts** – *N. Ford et al.*
Analiza los trade-offs complejos en arquitecturas distribuidas (microservicios, datos, etc.), enseñando a evaluar opciones sin una única respuesta correcta.

- **Building Evolutionary Architectures** – *N. Ford et al.*
Introduce el concepto de arquitectura evolutiva que facilita el cambio guiado. Ofrece estrategias prácticas para lograr un despliegue continuo y adaptable.

- **Domain-Driven Design** – *E. Evans*
Un clásico sobre cómo modelar software complejo alineado con el dominio del negocio. Fundamental para diseñar sistemas que reflejen fielmente la realidad del problema.

- **Software Architecture in Practice** – *L. Bass et al.*
Un texto de referencia en la ingeniería de software que conecta los principios arquitectónicos con los atributos de calidad (rendimiento, seguridad, mantenibilidad).

### Ingeniería de Software y Calidad

- **The Pragmatic Programmer** – *D. Thomas & A. Hunt*
Un compendio de consejos prácticos, principios y buenas prácticas que han envejecido muy bien. Esencial para el profesional pragmático.

- **Clean Code** – *R. Martin*
El estándar de facto para escribir código limpio y mantenible.

- **Designing Data-Intensive Applications** – *M. Kleppmann*
Indispensable para entender los fundamentos de los sistemas de datos (bases de datos, procesamiento batch y streaming) y sus trade-offs en el mundo real.

- **Software Engineering at Google** – *T. Winters et al.*
Ofrece una visión interna de las mejores prácticas y lecciones aprendidas en una de las empresas de software más grandes del mundo.

- **The Mythical Man-Month** – *F. Brooks*
Un clásico atemporal sobre la gestión de proyectos de software y la falacia de añadir más personas a un proyecto atrasado.

### MLOps e Ingeniería de Datos

- **Designing Machine Learning Systems** – *C. Huyen*
Una guía práctica y completa del ciclo de vida de un sistema de ML en producción, desde los datos hasta el monitoreo.

- **Practical MLOps** – *N. Gift & A. Deza*
Se enfoca en la implementación práctica de pipelines CI/CD, monitoreo y gobernanza para modelos de ML.

- **Fundamentals of Data Engineering** – *J. Reis & M. Housley*
Un libro moderno y muy bien valorado que abarca todo el ciclo de vida de la ingeniería de datos.

- **The Data Warehouse Toolkit** – *R. Kimball*
La referencia definitiva sobre modelado dimensional, aún vigente para construir almacenes de datos robustos y comprensibles para el negocio.

- **Stream Processing with Apache Flink** – *F. Hueske & V. Kalavri*
Una guía esencial para entender y construir aplicaciones de procesamiento de datos en tiempo real a escala.

### DataOps y Productos de Datos

- **Creating a Data-Driven Enterprise with DataOps** – *A. Thusoo & J. Sen Sarma*
Ofrece lecciones de gigantes tecnológicos (Facebook, Uber) sobre cómo construir una cultura orientada a datos y automatizar pipelines con DataOps.

- **Data Product Management in the AI Age** – *J. Milhomem*
Un libro reciente y práctico que trata los datos como un producto, presentando marcos como el "Golden Data Platform" para gestionar su ciclo de vida.

- **Practical DataOps** – *H. Harford*
Proporciona un enfoque pragmático para combinar principios de Agile y DevOps en la gestión y entrega de datos.

### Ética Estadística y de Datos

- **Data Ethics in the Age of AI** – *A. Khan*
Explora los desafíos morales, legales y sociales de los datos en la era de la IA, abordando temas como el sesgo algorítmico y la transparencia.

- **Building Responsible AI Algorithms** – *R. Reddy & S. Beutel*
Ofrece un marco para construir sistemas de IA transparentes, justos y robustos.

- **Weapons of Math Destruction** – *C. O'Neil*
Un análisis crítico y muy accesible sobre cómo los modelos matemáticos pueden amplificar la desigualdad y la injusticia social.

### Producción de Software Estadístico y Computación

- **Statistical Modeling and Computation** – *J. Chan & D. Kroese*
Un excelente puente entre la estadística teórica y la práctica computacional, cubriendo desde modelos clásicos hasta bayesianos con ejemplos en Julia.

- **Machine Learning on Kubernetes** – *F. J. A. P. S. R. de A. Lyra*
Una guía práctica para construir plataformas de ML escalables y reproducibles sobre Kubernetes.

- **Implementing MLOps in the Enterprise** – *Y. Haviv & N. Gift*
Enfocado en los desafíos y soluciones para adoptar MLOps en organizaciones grandes, abordando gobernanza y escalado.

## Documentos relacionados

- [MLflow para la Gestión del Ciclo de Vida de Modelos Estadísticos](MLflow.md): registro, versionado y despliegue de modelos con MLflow.
- [DataOps para Ingeniería Estadística](DataOps_Statistical_Engineering.md): pipelines de datos como código, testing y linaje.
- [Principios y Prácticas para la Construcción de Sistemas Estadísticos Robustos](Statistical_Software_Principles.md): fundamentos de arquitectura y calidad del software estadístico.
- [Getting Started](Getting_Started.md): flujo inicial de configuración y primer modelo en producción.
- [Guía de Despliegue](Deployment_Guide.md): CI/CD, contenedores y estrategias de despliegue.
