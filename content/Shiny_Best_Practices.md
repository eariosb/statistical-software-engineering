# Buenas Prácticas para Dashboards Analíticos en R/Shiny

## Introducción

R/Shiny sigue siendo una plataforma de referencia para construir dashboards analíticos interactivos, especialmente cuando el flujo de trabajo estadístico ya está en R. Este documento complementa el sistema general de ingeniería de software estadístico (orientado principalmente a Python) con buenas prácticas específicas para proyectos en Shiny, incluyendo trucos de experto y referencias a creadores de la comunidad.

> **Nota:** Esta sección es útil para mantener aplicaciones analíticas heredadas, para prototipado rápido de modelos estadísticos complejos o cuando el equipo tiene experiencia predominante en R.

---

## 1. Principios Rectores para Shiny en Contextos Estadísticos

Cada principio responde a un problema recurrente en proyectos Shiny. A continuación se explica por qué importa y cómo aplicarlo.

| Principio | Problema que resuelve | Aplicación concreta en Shiny |
| --- | --- | --- |
| **Reproducibilidad** | Un análisis puede cambiar de resultados si se actualizan paquetes o cambia la semilla. | `renv::snapshot()` para lockfile; semillas fijas (`set.seed(2026)`) en simulaciones; `sessionInfo()` guardado. |
| **Modularidad** | Una app monolítica es difícil de mantener, testear y extender. | Cada pestaña o funcionalidad en su propio módulo (`mod_*.R`); comunicación vía `reactiveValues` inyectados. |
| **Validación continua** | Los errores de entrada llegan al modelo y provocan fallos costosos. | `shinyvalidate` para inputs; mensajes claros antes de tareas largas; `req()` y `validate()`. |
| **Eficiencia** | Los cálculos pesados pueden bloquear la interfaz si se ejecutan en el hilo principal. | `bindCache` para resultados reactivos pesados; `memoise` para funciones puras; `future` + `promises` para no bloquear UI. |
| **Transparencia estadística** | Mostrar solo estimaciones puntuales oculta la incertidumbre real. | Mostrar intervalos de credibilidad, diagnósticos de convergencia (Rhat, ESS, trazas) y bandas de incertidumbre. |
| **Evaluación segura** | Permitir fórmulas libres abre la puerta a inyección de código. | Entornos restringidos (`rlang::eval_tidy` con lista blanca) para expresiones de usuario. |

---

## 2. Arquitectura en Capas para Shiny Profesional

### Problema que resuelve

Sin una estructura clara, las apps Shiny mezclan lógica de negocio, acceso a datos y presentación en el mismo bloque. Esto dificulta:
- Reutilizar funciones en varias partes de la app.
- Testear componentes de forma aislada.
- Cambiar la fuente de datos sin reescribir grandes porciones de código.

### Solución: separación de responsabilidades

Se definen capas claras:
- **Interfaz de usuario (UI)**: solo presenta elementos y captura entradas.
- **Módulos**: encapsulan una funcionalidad completa (UI + server) y comunican su estado mediante `reactiveValues` o servicios.
- **Servicios**: funciones puras en `utils.R`, `plots.R` y `db.R` que no dependen de Shiny.
- **Datos y modelos**: archivos externos versionados.

### Diagrama de flujo de dependencias

```mermaid
flowchart TB
    subgraph UI[Interfaz de usuario]
        A[app.R / ui.R]
    end
    subgraph Modulos[Módulos Shiny]
        B[mod_data.R]
        C[mod_model.R]
        D[mod_results.R]
    end
    subgraph Servicios[Servicios]
        E[utils.R (estadística pura)]
        F[plots.R (gráficos)]
        G[db.R (base de datos)]
    end
    A --> B
    A --> C
    A --> D
    B --> E
    C --> E
    D --> E
    B --> G
    C --> G
```

### Estructura recomendada

```text
mi_app_shiny/
├── app.R                     # Punto de entrada (UI + server) o ui.R/server.R
├── global.R                  # Carga librerías, constantes, helpers, tema
├── R/
│   ├── mod_*.R               # Módulos (UI y server combinados con moduleServer)
│   ├── utils.R               # Funciones estadísticas puras (sin reactividad)
│   ├── plots.R               # Funciones de gráficos reutilizables (ggplot2, plotly)
│   └── db.R                  # Conexiones a bases de datos (DuckDB, PostgreSQL)
├── data/                     # Datos de ejemplo, caché, bases DuckDB
├── models/                   # Modelos entrenados (.rds, .stan)
├── www/                      # CSS, JS, imágenes, loading.gif
├── renv.lock                 # Reproducibilidad
├── docker-compose.yml        # Despliegue
└── tests/
    └── testthat/             # Pruebas unitarias
```

**Regla de dependencia:** las funciones en `R/utils.R` no conocen Shiny; los módulos reciben servicios (`reactiveValues`, pools de base de datos) como parámetros.

---

## 3. Módulos Shiny: Inyección de Dependencias

En vez de acceder a reactivos globales, pasar explícitamente las dependencias:

```r
# (fragmento ilustrativo, no ejecutable)
server <- function(input, output, session) {
  rvs <- reactiveValues(data = NULL, model = NULL)
  pool <- dbPool(duckdb::duckdb(), dbdir = "data/app.duckdb")

  mod_data_server("data", rvs, pool)
  mod_model_server("model", rvs, pool)
  mod_results_server("results", rvs)
}
```

Dentro de un módulo:

```r
# (fragmento ilustrativo, no ejecutable)
mod_data_server <- function(id, rvs, pool) {
  moduleServer(id, function(input, output, session) {
    observeEvent(input$load, {
      rvs$data <- dbGetQuery(pool, "SELECT * FROM raw_data")
    })
  })
}
```

Esto facilita el testing y el reemplazo de componentes.

---

## 4. Gestión de Datos: Caché, Validación y Fuentes Externas

### 4.1 Caché con control de antigüedad

```r
# (ejemplo ejecutable)
fetch_with_cache <- function(url, cache_file, max_age_hours = 6) {
  if (file.exists(cache_file) &&
      difftime(Sys.time(), file.mtime(cache_file), units = "hours") < max_age_hours) {
    return(readRDS(cache_file))
  }
  data <- read.csv(url)
  saveRDS(data, cache_file)
  data
}
```

### 4.2 Caché reactiva con bindCache

```r
# (fragmento ilustrativo, no ejecutable)
sim_results <- reactive({
  req(rvs$params, rvs$n_iter)
  run_simulation(rvs$params, rvs$n_iter)
}) |> bindCache(rvs$params, rvs$n_iter, rvs$seed)
```

### 4.3 Validación de datos

- Usar `shinyvalidate::InputValidator` para cada input.
- Verificar integridad de datos cargados: sin `NA`s en columnas críticas y rangos plausibles.
- Mostrar resumen estadístico antes de correr modelos.

---

## 5. Modelado Estadístico Robusto en Shiny

### 5.1 Modelos bayesianos con brms

- Priors informativos y alineados con el dominio (nunca por defecto).
- Diagnósticos obligatorios: `Rhat < 1.01`, `ESS > 400` por parámetro, divergencias = 0.
- Guardar `.rds` con metadatos (timestamp, Rhat, iteraciones) en `models/`.

```r
# (fragmento ilustrativo, no ejecutable)
model <- brm(
  y ~ x1 + x2 + (1 | group),
  data = data,
  prior = c(prior(normal(0, 1), class = "b")),
  chains = 4,
  iter = 2000,
  control = list(adapt_delta = 0.95),
  file = "models/model_name"
)
```

### 5.2 Actualización secuencial

```r
# (fragmento ilustrativo, no ejecutable)
model_updated <- update(model, newdata = new_data, chains = 2, iter = 1000)
```

### 5.3 Visualización de incertidumbre

- Intervalos de credibilidad con `geom_ribbon` o `geom_errorbarh`.
- Diagnósticos MCMC: `bayesplot::mcmc_trace`, `mcmc_areas`, `mcmc_intervals`.
- Posterior predictivo: `brms::posterior_predict` + `ggdist::stat_halfeye`.

---

## 6. Evaluación Segura de Expresiones de Usuario

```r
# (ejemplo ejecutable)
safe_eval <- function(expr, data_env) {
  allowed_fns <- list(
    min = min, max = max, sum = sum, mean = mean, ifelse = ifelse,
    pmin = pmin, pmax = pmax, log = log, exp = exp, sqrt = sqrt,
    abs = abs, floor = floor, ceiling = ceiling, round = round
  )
  env <- rlang::env_clone(data_env, parent = emptyenv())
  rlang::env_bind(env, !!!allowed_fns)
  rlang::eval_tidy(rlang::parse_expr(expr), data = env)
}
```

Validación previa con `rlang::parse_expr(expr)` y timeouts mediante `future` + `R.utils::withTimeout`.

---

## 7. Optimización y Paralelismo

### 7.1 Paralelismo con future + promises

```r
# (fragmento ilustrativo, no ejecutable)
observeEvent(input$run, {
  future({
    heavy_computation(input$n)
  }) %...>% {
    output$result <- renderPrint(.)
  }
})
```

### 7.2 Common Random Numbers en optimización

```r
# (fragmento ilustrativo, no ejecutable)
base_samples <- generate_latin_hypercube(N, k)
fitness <- function(x) {
  evaluate_on_samples(x, base_samples)
}
```

### 7.3 Caché con memoise

```r
# (fragmento ilustrativo, no ejecutable)
library(memoise)
cached_computation <- memoise(expensive_function, cache = cache_filesystem("cache/"))
```

---

## 8. UI/UX Profesional para Dashboards Estadísticos

### 8.1 Tema consistente

```r
# (ejemplo ejecutable)
library(bslib)
theme <- bs_theme(
  bootswatch = "flatly",
  bg = "#F8F9FA",
  fg = "#212529",
  primary = "#2c6e9e"
)
```

### 8.2 Layout con bs4Dash o shinydashboard

Menú lateral, pestañas y tarjetas.

### 8.3 Indicadores de carga

```r
# (fragmento ilustrativo, no ejecutable)
shinycssloaders::withSpinner(plotOutput("plot"))
shinybusy::show_modal_spinner("Procesando...")
```

### 8.4 Tooltips y ayudas

```r
# (fragmento ilustrativo, no ejecutable)
bslib::tooltip(button, "Explicación estadística")
shiny::helpText("Intervalo de credibilidad del 95%")
```

### 8.5 Accesibilidad

- Contraste (WCAG AA).
- Navegación por teclado.
- Texto alternativo en gráficos.

---

## 9. Automatización y Despliegue

### 9.1 GitHub Actions para actualización

```yaml
name: Actualización semanal
on:
  schedule:
    - cron: '0 8 * * 1'
jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: r-lib/actions/setup-r@v2
      - name: Install system deps
        run: sudo apt-get install -y libcurl4-openssl-dev
      - name: Install R deps
        run: Rscript -e 'install.packages(c("renv", "dplyr", "DBI", "duckdb"))'
      - name: Run pipeline
        run: Rscript scripts/update_pipeline.R
      - name: Commit updated data and models
        run: |
          git config user.name "GitHub Actions"
          git add data/ models/
          git commit -m "Actualización automática" || echo "No changes"
          git push
```

### 9.2 Despliegue en shinyapps.io

```r
# (fragmento ilustrativo, no ejecutable)
rsconnect::deployApp(
  appName = "mi-app",
  account = "usuario",
  lint = FALSE,
  forceUpdate = TRUE
)
```

### 9.3 Dockerfile para Shiny

```dockerfile
FROM rocker/shiny:4.3.1
RUN R -e "install.packages(c('shiny', 'bslib', 'dplyr', 'ggplot2', 'plotly', 'brms', 'future'))"
COPY . /srv/shiny-server/
EXPOSE 3838
```

---

## 10. Pruebas y Documentación

### 10.1 Pruebas unitarias con testthat

```r
# (fragmento ilustrativo, no ejecutable)
test_that("calc_stats devuelve media y sd correctas", {
  x <- rnorm(100, 5, 2)
  stats <- calc_stats(x)
  expect_equal(stats$mean, mean(x), tolerance = 1e-6)
  expect_equal(stats$sd, sd(x), tolerance = 1e-6)
})
```

### 10.2 Documentación con roxygen2

```r
# (fragmento ilustrativo, no ejecutable)
#' Calcula media y desviación estándar
#' @param x vector numérico
#' @return lista con media y sd
#' @examples
#' calc_stats(rnorm(100))
calc_stats <- function(x) {...}
```

### 10.3 README.md completo

Instalación, estructura, flujo de uso, capturas de pantalla y referencias.

---

## 11. Trucos de experto para Shiny

| Truco | Descripción |
| --- | --- |
| bindCache con reactiveVal | Cachear resultados incluso cuando la fuente es un reactiveVal que cambia poco. |
| shiny::isolate() | Evitar dependencias reactivas no deseadas en observadores. |
| future::plan(multisession) | Habilitar paralelismo real (no en Windows). Usar con promises. |
| session$userData | Almacenar estado compartido entre módulos sin reactiveValues global. |
| shiny::debounce | Retrasar ejecución de inputs muy rápidos (ej. búsqueda de texto). |
| shinyjs::disable / enable | Controlar la habilitación de botones durante cómputo largo. |
| rsconnect::deployApp() con appFiles | Excluir archivos grandes que no se necesitan en el servidor. |
| duckdb en modo :memory: | Para demostraciones rápidas sin persistencia. |
| reactivePoll | Para monitorear cambios en archivos o bases de datos externas. |

---

## 12. Referencias de creadores expertos en Shiny

| Nombre / Comunidad | Aportación | Enlace |
| --- | --- | --- |
| Joe Cheng (creador de Shiny) | Principios de reactividad, `shinyvalidate`, `bslib` | GitHub |
| Winston Chang | `shinythemes`, `shinyjs`, autor del libro _R Graphics Cookbook_ | GitHub |
| Eric Nantz | Podcast “Shiny Developer Series”, paquete `rhino` | Podcast |
| Colin Fay | `shiny.fluent`, `shiny.react`, `shiny.router` | GitHub |
| John Coene | `echarts4r`, `shiny.telemetry`, `shiny.router` | GitHub |
| Posit (ex RStudio) | `shiny` core, `shinydashboard`, `shinyapps.io` | Posit Shiny |
| R Weekly | Curaduría de novedades y paquetes | R Weekly |

---

## 13. Checklist de Entrega para Aplicaciones Shiny Profesionales

- [ ] `renv::snapshot()` ejecutado y `renv.lock` versionado.
- [ ] Semillas fijas (`set.seed(2026)`) en toda simulación.
- [ ] Código modular: cada funcionalidad principal en su propio módulo.
- [ ] Validación de inputs con `shinyvalidate` y manejo de errores con `validate`.
- [ ] Resultados pesados cacheados con `bindCache` o `memoise`.
- [ ] Gráficos muestran incertidumbre (intervalos, bandas), no solo estimaciones puntuales.
- [ ] Evaluación segura de expresiones de usuario (entorno restringido).
- [ ] Pruebas unitarias (`testthat`) cubren al menos 5 funciones críticas.
- [ ] Documentación con `roxygen2` y pestaña de ayuda en la app.
- [ ] La aplicación se despliega correctamente en `shinyapps.io` o en contenedor Docker.
- [ ] Tema consistente (`bslib`) y diseño responsivo.
- [ ] Atribución de fuentes de datos (scraping, APIs).
