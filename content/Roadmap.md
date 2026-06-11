# Roadmap de Implementación para Ingeniería de Software Estadístico

El roadmap transforma los conceptos técnicos (contratos de datos, feature store, CI/CD para ML, monitoreo, FinOps, cultura de datos) en una **secuencia práctica de madurez**. Cada nivel añade capacidades que se apoyan en las anteriores, permitiendo a equipos pequeños y grandes progresar a su propio ritmo.

El objetivo final no es solo tener una plataforma técnica avanzada, sino contribuir a una **organización donde los datos se usan de forma fiable, ética, eficiente y cotidiana** para tomar mejores decisiones.

---

## 1. Modelo de Madurez en 5 Niveles

| Nivel | Nombre | Foco principal | Resultado clave |
|-------|--------|----------------|------------------|
| **0** | Ad‑hoc | Experimentación local, scripts sueltos, sin control de versiones ni reproducibilidad | Análisis únicos, no compartibles |
| **1** | Reproducible | Control de versiones (Git, DVC), documentación básica, lock files, contratos de datos simples | El análisis se puede repetir por otro miembro del equipo |
| **2** | Automatizado | CI/CD para código y datos, pruebas unitarias e integración de modelos, feature store básico, auditoría automatizada | Despliegue continuo con validación pre‑producción |
| **3** | Gobernado | Catálogo de datos activo, linaje automático, políticas de retención, monitoreo de drift y rendimiento, alertas, FinOps básico | Cumplimiento normativo, trazabilidad total, control de costes |
| **4** | Optimizante | Despliegues canary/blue‑green, rollback automático, reentrenamiento continuo basado en drift, optimización avanzada de costes, cultura de datos consolidada | Mejora continua, operación autónoma y eficiente |

---

## 2. Desglose por Nivel

### Nivel 0 – Ad‑hoc

**Características:**
- Scripts en notebooks sin control de versiones.
- Dependencias instaladas globalmente (sin lock files).
- Semillas aleatorias no fijadas – resultados no reproducibles.
- Datos crudos re‑descargados cada vez.
- Sin tests, sin documentación.

**Salidas mínimas:**
- Una libreta que resuelve un problema analítico concreto.
- Almacenamiento compartido (Google Drive, OneDrive) para compartir el análisis.

---

### Nivel 1 – Reproducible

**Prácticas clave:**
- **Control de versiones**: Git + GitHub/GitLab.
- **Entornos aislados**: `renv` (R) o `poetry`/`pip‑freeze` (Python).
- **Semillas fijas**: `set.seed(2026)` en scripts, `RANDOM_SEED` como variable de entorno.
- **Contratos de datos elementales**: validación de columnas y tipos en la ingesta.
- **Documentación mínima**: `README.md`, `CHANGELOG.md`.

**Criterios de salida:**
- Repositorio público con lock file (`renv.lock` / `poetry.lock` / `requirements.txt`).
- Script principal que, al ejecutarse, produce exactamente los mismos resultados (hash de salida constante).
- `sessionInfo()` o `pip freeze` accesible en el repositorio.

---

### Nivel 2 – Automatizado

**Se añade:**
- **CI/CD con GitHub Actions (u otro)**:
  - Ejecución de tests unitarios y de integración de modelos (carga, predicción de muestra, validación de formato).
- **Pruebas de modelo automatizadas**:
  - Rendimiento (AUC, RMSE) no peor que la versión anterior (regresión).
  - Deriva univariada (KS test, PSI) con umbrales configurables.
  - Sin fugas de tiempo (point‑in‑time correctness).
- **Feature store (Feast) básico**:
  - Definición de entidades y feature views.
  - Sincronización batch offline → online store (Redis / DynamoDB).
- **Auditoría automatizada**:
  - `data_ingestion.log`, `model_version.log`, `prediction_audit.log` en JSON.

**Criterios de salida:**
- Pipelines de entrenamiento y despliegue se activan automáticamente en cada *push* a `main`.
- El modelo candidato se sirve en entorno de staging; el paso a producción es manual pero validado por pruebas.

---

### Nivel 3 – Gobernado

**Se añade:**
- **Catálogo de datos activo** (DataHub / OpenMetadata):
  - Metadatos técnicos de tablas, columnas, propietarios.
  - Linaje automático (OpenLineage + dbt + Airflow).
- **Monitoreo continuo de modelos en producción**:
  - Métricas operacionales (latencia, throughput, errores) → Prometheus + Grafana.
  - Métricas de calidad (drift, rendimiento diferido) → Evidently AI + WhyLabs.
  - Alertas basadas en umbrales (Hellinger > 0.1, PSI > 0.25).
- **Políticas de retención y anonimización**:
  - Scripts programados que eliminan artefactos viejos según `ttl`.
  - Anonimización automática de PII después del período de retención.
- **FinOps básico**:
  - Etiquetado de recursos cloud (`team`, `environment`, `workload_type`).
  - Presupuestos por equipo / proyecto (AWS Budgets / GCP Spend Caps).

**Criterios de salida:**
- Dashboard de observabilidad (Grafana) que muestra salud de datos y modelos.
- El catálogo de datos responde a “¿qué modelos dependen de esta columna?” en segundos.
- Al menos una alerta de drift real ha sido notificada y corregida.

---

### Nivel 4 – Optimizante

**Se añade:**
- **Despliegues canary / blue‑green**:
  - Traffic splitting con KServe + Istio (ej. 20% tráfico a la nueva versión).
  - Promoción automática si métricas operacionales y de deriva son aceptables.
- **Rollback automatizado**:
  - Detección de anomalías → reversión del alias `@champion` en MLflow.
- **Reentrenamiento continuo basado en drift**:
  - Trigger automático cuando drift supera umbral durante 3 ventanas consecutivas.
  - Reentrenamiento con datos actualizados y re‑evaluación de métricas.
- **Optimización de costes avanzada**:
  - Uso de instancias spot para entrenamiento.
  - Apagado automático de entornos inactivos (notebooks, endpoints de staging).
  - Right‑sizing de recursos (Kubecost / AWS Compute Optimizer).
- **Cultura de datos consolidada**:
  - Sesiones periódicas de “Office Hours de datos”.
  - Glosario de negocio centralizado + dashboards accionables.
  - Encuesta de confianza en los datos.

**Criterios de salida:**
- Un modelo ha sido desplegado en producción mediante canary, monitorizado y, si falló, revertido sin intervención humana.
- El coste medio por inferencia es conocido y se optimiza activamente.
- Un usuario no técnico modifica su presupuesto semanal basado en un dashboard sin consultar al equipo de datos.

---

## 3. Checklist de Verificación por Nivel

### Nivel 1 (Reproducible)
- [ ] Repositorio Git con `README.md` y `CHANGELOG.md`.
- [ ] Lock file (`renv.lock` / `poetry.lock` / `requirements.txt`) y opcionalmente `Dockerfile`.
- [ ] Semillas fijas en todos los scripts.
- [ ] Contrato de datos básico para la(s) tabla(s) de entrada.
- [ ] `sessionInfo()` o `pip freeze` accesible en el repositorio.

### Nivel 2 (Automatizado)
- [ ] CI/CD ejecuta tests de integración de modelo (carga, predicción, formato).
- [ ] Prueba de regresión: el modelo candidato no degrada métricas > umbral (ej. AUC baja < 0.02).
- [ ] Prueba de deriva univariada (KS test) bloquea si p < 0.05 en features críticas.
- [ ] Feature store (Feast) con al menos un feature view materializado.
- [ ] Logs de auditoría estructurados (JSON) en `audit/`.

### Nivel 3 (Gobernado)
- [ ] DataHub / OpenMetadata desplegado y recibiendo metadatos de dbt, Airflow, Spark.
- [ ] Linaje automático visible para tablas y modelos.
- [ ] Evidently AI + Prometheus + Grafana monitoreando drift y rendimiento en producción.
- [ ] Alertas configuradas (canal Slack, PagerDuty).
- [ ] Políticas de retención implementadas (ej. S3 Lifecycle, scripts programados).
- [ ] Etiquetas `team`, `environment`, `workload_type` en todos los recursos cloud.

### Nivel 4 (Optimizante)
- [ ] Despliegues canary con tráfico real (ej. KServe + Istio).
- [ ] Rollback automático ante anomalías de latencia/error/drift.
- [ ] Reentrenamiento desencadenado por drift (o programado).
- [ ] Uso de instancias spot + apagado automático de recursos no productivos.
- [ ] Al menos un dashboard accionable (con botones de acción) utilizado semanalmente.
- [ ] Encuesta de cultura de datos realizada y plan de mejora en curso.

---

## 4. Pasos iniciales recomendados (desde cero)

Si se parte del nivel 0, la madurez se construye paso a paso. A continuación se listan hitos técnicos mínimos para avanzar, sin plazos fijos.

1. **Crear un repositorio Git** y subir el script principal.
2. **Añadir un gestor de dependencias**: `renv::init()` / `poetry init` y generar el lock file.
3. **Fijar una semilla global** al inicio del script.
4. **Escribir un `README.md`** que explique cómo reproducir el análisis.
5. **Añadir un test simple** que verifique que el modelo se carga y predice sin errores.
6. **Configurar un pipeline CI** (GitHub Actions) que ejecute ese test en cada `push`.
7. **Definir un contrato de datos básico** (columnas obligatorias, tipos).
8. **Después de tener un modelo estable**, implementar:
   - Feature store para una feature recurrente.
   - Monitoreo de drift con Evidently AI + Prometheus + Grafana en staging.
9. **Posteriormente**, introducir:
   - Catálogo de datos (DataHub) y linaje.
   - Etiquetado de recursos cloud y alertas de coste.
10. **Antes del despliegue a producción con tráfico real**:
    - Diseñar un despliegue canary con KServe.
    - Probar rollback automático en staging.
    - Realizar un taller de alfabetización de datos con stakeholders.

> **No subestimes el nivel 1.** La reproducibilidad es la base sobre la que todo lo demás se sostiene. Sin ella, el monitoreo y la gobernanza serán caóticos.

---

## Documentos relacionados

- [Manual Completo de Ingeniería de Software Estadístico](Complete_Manual.md): referencia integral que este roadmap lleva a la práctica.
- [Cultura de Datos y Alfabetización](Data_Culture.md): factor humano y organizacional del roadmap de madurez.
- [Checklist Unificado: Cumplimiento Regulatorio y MLOps](MLOps_Compliance_Checklist.md): verificaciones a completar en cada etapa del roadmap.