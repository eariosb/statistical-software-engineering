# DataOps para Ingeniería Estadística

**Pipelines de datos como código, testing de datos, linaje y entornos aislados**



DataOps aplica los principios de DevOps y Agile al ciclo de vida de los datos.

Este capítulo cubre cuatro prácticas esenciales:

- **Pipelines de datos como código**: transformaciones versionadas, reproducibles y orquestadas.

- **Testing de datos**: verificar que las transformaciones producen los resultados esperados.

- **Entornos de datos aislados**: desarrollo y pruebas sin afectar producción.

- **Linaje automatizado**: trazabilidad de qué transforma qué y para qué.

### Diagrama de flujo general de DataOps

```mermaid
flowchart LR
    subgraph DataOps[DataOps]
        A[Pipelines como código] --> B[Testing de datos]
        B --> C[Entornos aislados]
        C --> D[Linaje automatizado]
        D --> A
    end
```

## 1. Pipelines de Datos como Código

### 1.1 Principio

Un pipeline de datos no es un conjunto de scripts ejecutados manualmente. Es código versionado, idempotente, orquestado y probado de la misma forma que el código de la aplicación.

**Características de un pipeline de datos de producción**:

- **Idempotente**: ejecutarlo múltiples veces produce el mismo resultado.
- **Declarativo**: describe qué transformar, no cómo orquestar la ejecución.
- **Versionado en Git**: cada cambio tiene un commit, un autor y una justificación.
- **Documentado**: cada modelo de datos tiene descripción, propietario y tests.

### 1.2 dbt como estándar para transformaciones SQL

dbt (data build tool) es el estándar de facto para transformaciones SQL declarativas. Cada transformación es un archivo `.sql` versionado que dbt compila, ejecuta y documenta automáticamente.

### Diagrama de flujo de dbt

```mermaid
flowchart LR
    Fuentes["Fuentes de datos\n(CSV, tablas)"] --> Staging["Staging\n(limpieza)"]
    Staging --> Intermediate["Intermediate\n(enriquecimiento)"]
    Intermediate --> Marts["Marts\n(features para ML)"]
    Marts --> BI[BI / Dashboards]
    Marts --> ML[Modelos ML]
```

**Estructura de un proyecto dbt**:

```text
dbt_project/
├── models/
│   ├── staging/              # Datos crudos limpios (una fuente → un modelo)
│   │   ├── stg_ventas.sql
│   │   └── stg_clientes.sql
│   ├── intermediate/         # Transformaciones intermedias
│   │   └── int_ventas_enriquecidas.sql
│   └── marts/                # Modelos finales para análisis y ML
│       ├── mart_features_credito.sql
│       └── mart_features_ventas.sql
├── tests/                    # Tests de datos genéricos
│   └── assert_total_ventas_positivo.sql
├── macros/                   # Funciones reutilizables
├── seeds/                    # Datos de referencia pequeños (CSV → tabla)
├── snapshots/                # Captura de cambios en tablas tipo 2 (SCD2)
├── dbt_project.yml
└── profiles.yml              # Conexiones a bases de datos (sin credenciales)
```

**Ejemplo de modelo dbt** (models/marts/mart_features_credito.sql):

```sql
-- mart_features_credito.sql
-- Propietario: equipo-credito
-- Descripción: Features de riesgo de crédito para entrenamiento de modelos
-- Decisión de diseño: docs/decisions/003-feature-engineering-credito.md

{{ config(
    materialized='table',
    tags=['ml-features', 'credito'],
    meta={'owner': 'equipo-credito', 'sla': '6am UTC'}
) }}

WITH ventas AS (
    SELECT * FROM {{ ref('stg_ventas') }}
),
clientes AS (
    SELECT * FROM {{ ref('stg_clientes') }}
),
features AS (
    SELECT
        c.cliente_id,
        c.segmento,
        c.antiguedad_anos,
        SUM(v.monto) AS volumen_total_90d,
        COUNT(v.transaccion_id) AS total_transacciones_90d,
        AVG(v.monto) AS ticket_promedio_90d,
        MAX(v.fecha) AS ultima_compra,
        -- Feature de recencia (días desde última compra)
        DATE_DIFF(CURRENT_DATE(), MAX(v.fecha), DAY) AS recencia_dias
    FROM clientes c
    LEFT JOIN ventas v ON c.cliente_id = v.cliente_id
        AND v.fecha >= CURRENT_DATE() - INTERVAL 90 DAY
    GROUP BY 1, 2, 3
)

SELECT * FROM features
```

**Propósito**: este modelo transforma datos crudos en features estructuradas para modelos de ML. No contiene lógica de entrenamiento ni predicción; solo orquesta transformaciones SQL de forma reproducible.

**Documentación inline**:

```sql
-- docs/models/mart_features_credito.md
# mart_features_credito

## Descripción
Features de riesgo de crédito derivadas de transacciones y datos demográficos.

## Propietario
equipo-credito

## Dependencias
- `stg_ventas` (staging/ventas)
- `stg_clientes` (staging/clientes)

## Tests
- `unique` en `cliente_id`
- `not_null` en `volumen_total_90d`
- `positive` en `total_transacciones_90d`
```

**Tests genéricos en dbt**:

```yaml
# models/marts/schema.yml
version: 2

models:
  - name: mart_features_credito
    description: "Features de riesgo de crédito para modelos ML"
    columns:
      - name: cliente_id
        tests:
          - unique
          - not_null
      - name: volumen_total_90d
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
      - name: total_transacciones_90d
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
      - name: segmento
        tests:
          - accepted_values:
              values: ['A', 'B', 'C']
      - name: recencia_dias
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
```

Ejecutar tests:

```bash
dbt test --select mart_features_credito
```

**Parámetros de ejecución** (macros para configurar el pipeline):

```sql
-- macros/set_execution_date.sql
{% macro set_execution_date() %}
    {% if env_var('DBT_EXECUTION_DATE', '') != '' %}
        {{ env_var('DBT_EXECUTION_DATE') }}
    {% else %}
        {{ run_started_at.strftime("%Y-%m-%d") }}
    {% endif %}
{% endmacro %}
```

```sql
-- Uso en modelo
WHERE fecha <= {{ set_execution_date() }}
```

**Ejecución del pipeline**:

```bash
# Compilar y ejecutar todos los modelos
dbt run

# Ejecutar solo un modelo y sus dependencias
dbt run --select mart_features_credito+

# Ejecutar en un target específico (dev, staging, production)
dbt run --target production
```

## 2. Testing de Datos

### Diagrama de flujo de testing de datos

```mermaid
flowchart TB
    subgraph Testing["Testing de Datos"]
        direction LR
        A["Esquema y unicidad\ndbt tests"] --> B["Consistencia de negocio\nTests singulares SQL"]
        B --> C["Calidad estadística\nGreat Expectations"]
        C --> D["Observabilidad\nSoda Core"]
    end
```

### 2.1 Capas de testing de datos

| Capa | Herramienta | Propósito | Cuándo ejecutar |
|------|-------------|-----------|-----------------|
| Esquema y unicidad | dbt tests | Validar tipos, nulos, unicidad, rangos | En cada ejecución del pipeline |
| Consistencia de negocio | Tests singulares SQL | Verificar relaciones y propiedades de negocio | En cada ejecución |
| Calidad estadística | Great Expectations | Distribuciones, percentiles, cardinalidad | En ingesta y antes de entrenar |
| Observabilidad | Soda Core | Anomalías automáticas sin reglas predefinidas | Continuo en producción |

### 2.2 Tests unitarios de transformaciones Python
Cuando las transformaciones usan Python (ETL, feature engineering), se aplican tests unitarios con pytest:

```python
# (fragmento ilustrativo, no ejecutable)
# tests/unit/test_feature_engineering.py
import pytest
import pandas as pd
import numpy as np
from services.data_service import compute_credit_features

@pytest.fixture
def sample_transactions():
    np.random.seed(2026)
    return pd.DataFrame({
        "cliente_id": ["C001"] * 10 + ["C002"] * 5,
        "fecha": pd.date_range("2026-03-01", periods=15, freq="W"),
        "monto": np.random.uniform(100, 1000, 15),
    })

def test_total_transacciones_positivo(sample_transactions):
    features = compute_credit_features(sample_transactions)
    assert (features["total_transacciones_90d"] > 0).all(), \
        "Todos los clientes deben tener al menos una transacción"

def test_volumen_no_negativo(sample_transactions):
    features = compute_credit_features(sample_transactions)
    assert (features["volumen_total_90d"] >= 0).all(), \
        "El volumen total nunca debe ser negativo"

def test_cliente_c001_tiene_10_transacciones(sample_transactions):
    features = compute_credit_features(sample_transactions)
    c001 = features[features["cliente_id"] == "C001"]
    assert c001["total_transacciones_90d"].iloc[0] == 10, \
        "C001 debe tener exactamente 10 transacciones en el período"

def test_aggregation_suma_correcta(sample_transactions):
    """Verifica que la agregación suma correctamente (test de consistencia)."""
    features = compute_credit_features(sample_transactions)
    expected_total_c001 = sample_transactions[
        sample_transactions["cliente_id"] == "C001"
    ]["monto"].sum()
    actual = features[features["cliente_id"] == "C001"]["volumen_total_90d"].iloc[0]
    np.testing.assert_almost_equal(actual, expected_total_c001, decimal=2)
```

### 2.3 Tests de consistencia entre pipeline y modelo
Verificar que los datos que llegan al modelo en producción son compatibles con los del entrenamiento:

```python
# (fragmento ilustrativo, no ejecutable)
# tests/integration/test_data_schema_consistency.py
import pandas as pd
import mlflow

def test_inference_data_matches_training_schema():
    """
    Verifica que el schema de datos de inferencia es compatible
    con el schema registrado en MLflow durante el entrenamiento.
    """
    client = mlflow.tracking.MlflowClient()
    model_version = client.get_model_version("CreditRiskBayesian", "1")
    run = client.get_run(model_version.run_id)

    expected_features = run.data.params["formula"].split("~")[1].strip().split(" + ")
    inference_df = pd.read_parquet("data/inference_sample.parquet")

    missing_features = set(expected_features) - set(inference_df.columns)
    assert not missing_features, \
        f"Features faltantes en datos de inferencia: {missing_features}"
```

## 3. Entornos de Datos Aislados

### 3.1 Por qué los entornos de datos son críticos

En el desarrollo de software tradicional, los entornos de desarrollo, staging y producción están bien separados. En proyectos de datos, esta separación suele fallar: se desarrollan transformaciones contra tablas de producción, se prueban modelos con datos reales no anonimizados, o los cambios en staging afectan a producción.

### 3.2 Estrategia de entornos con dbt

dbt soporta múltiples entornos mediante targets en profiles.yml:

### Diagrama de flujo de entornos

```mermaid
flowchart LR
    Developer[Desarrollador] -->|dbt run| DevDB[("Base de datos dev\nschema personal")]
    CI[CI/CD] -->|dbt run --target staging| StagingDB[("Base de datos staging")]
    CD[CD] -->|dbt run --target production| ProdDB[("Base de datos producción")]
```

```yaml
# profiles.yml (sin credenciales; estas vienen de variables de entorno)
statistical_project:
  outputs:
    dev:
      type: postgres
      host: "{{ env_var('DB_HOST_DEV') }}"
      user: "{{ env_var('DB_USER') }}"
      password: "{{ env_var('DB_PASSWORD') }}"
      database: analytics_dev
      schema: "{{ env_var('DBT_SCHEMA', 'dbt_dev_' ~ env_var('USER', 'local')) }}"
      # Cada desarrollador tiene su propio schema: dbt_dev_eariosb, dbt_dev_mpaz
    staging:
      type: postgres
      host: "{{ env_var('DB_HOST_STAGING') }}"
      database: analytics_staging
      schema: public
    production:
      type: postgres
      host: "{{ env_var('DB_HOST_PROD') }}"
      database: analytics_prod
      schema: public
  target: dev  # Por defecto, apunta a dev
```

Con esta configuración:

- `dbt run` → ejecuta en el schema personal del desarrollador (sin afectar staging ni producción).
- `dbt run --target staging` → ejecuta en staging.
- `dbt run --target production` → solo desde CI/CD, nunca manual.

## 3.3 Bases de datos efímeras para pruebas con Docker

Para pruebas de integración, se levanta una base de datos efímera con datos de muestra:

```yaml
# docker-compose.test.yml
version: "3.9"

services:
  db_test:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: analytics_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - "5433:5432"
    volumes:
      - ./tests/fixtures/seed_data.sql:/docker-entrypoint-initdb.d/01_seed.sql
    tmpfs:
      - /var/lib/postgresql/data  # Datos en memoria, se eliminan al apagar el contenedor
```

```python
# (fragmento ilustrativo, no ejecutable)
# conftest.py
import pytest
import subprocess
import pandas as pd
from sqlalchemy import create_engine

@pytest.fixture(scope="session")
def db_engine():
    """Levanta una base de datos de prueba efímera y la elimina al terminar."""
    subprocess.run(["docker-compose", "-f", "docker-compose.test.yml", "up", "-d"], check=True)
    engine = create_engine("postgresql://test_user:test_password@localhost:5433/analytics_test")
    yield engine
    subprocess.run(["docker-compose", "-f", "docker-compose.test.yml", "down", "-v"], check=True)

@pytest.fixture
def features_df(db_engine):
    return pd.read_sql("SELECT * FROM mart_features_credito", db_engine)
```

### 3.4 Datos de prueba con anonimización

Los datos de prueba nunca deben contener PII real. Se generan de tres formas:

- **Datos sintéticos** (preferido para desarrollo):

```python
# (ejemplo ejecutable)
# tests/fixtures/generate_synthetic_data.py
import pandas as pd
import numpy as np

def generate_synthetic_transactions(n: int = 1000, seed: int = 2026) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    return pd.DataFrame({
        "cliente_id": [f"C{i:04d}" for i in rng.integers(1, 200, n)],
        "fecha": pd.date_range("2025-01-01", periods=n, freq="6h")[:n],
        "monto": rng.lognormal(mean=5.5, sigma=1.2, size=n).round(2),
        "estado": rng.choice(["pagado", "pendiente", "cancelado"], n, p=[0.8, 0.15, 0.05]),
        "segmento": rng.choice(["A", "B", "C"], n),
    })
```

- **Datos anonimizados** de producción para staging (cuando es necesario más realismo):

```python
# (ejemplo ejecutable)
from faker import Faker

def anonymize_dataframe(df: pd.DataFrame, pii_columns: list[str]) -> pd.DataFrame:
    """Reemplaza PII con datos sintéticos preservando la estructura estadística."""
    fake = Faker(seed=2026)
    df_anon = df.copy()
    for col in pii_columns:
        if "nombre" in col.lower():
            df_anon[col] = [fake.name() for _ in range(len(df))]
        elif "email" in col.lower():
            df_anon[col] = [fake.email() for _ in range(len(df))]
        elif "id" in col.lower() or "cedula" in col.lower():
            df_anon[col] = [fake.uuid4() for _ in range(len(df))]
    return df_anon
```
## 4. Linaje Automatizado de Datos

### 4.1 Qué es el linaje y por qué importa
El linaje de datos es el mapa que muestra cómo los datos fluyen desde las fuentes originales hasta los modelos y dashboards. En ingeniería estadística, el linaje es esencial para:

- **Reproducibilidad**: dado un modelo, saber exactamente qué tablas y transformaciones generaron sus features.

- **Impacto de cambios**: antes de modificar una tabla fuente, saber qué modelos se verán afectados.

- **Auditoría regulatoria**: demostrar que los datos personales no fluyen a sistemas no autorizados.

### Diagrama de flujo de linaje

```mermaid
flowchart LR
    Fuente[(Tabla fuente)] --> dbt[dbt]
    dbt --> Feature[(Feature mart)]
    Feature --> MLflow[MLflow]
    Feature --> BI[Power BI / Tableau]
    MLflow -.-> DataHub
    BI -.-> DataHub
```

## 4.2 Linaje con dbt

dbt genera automáticamente un grafo de linaje a nivel de modelo:

```bash
# Ver el linaje de mart_features_credito y sus dependencias
dbt ls --select mart_features_credito+  # downstream
dbt ls --select +mart_features_credito  # upstream

# Generar documentación con linaje interactivo
dbt docs generate
dbt docs serve  # → http://localhost:8080 con grafo visual
```

Para publicar el linaje en DataHub:

```bash
# Ingestar metadatos de dbt a DataHub
datahub ingest -c datahub_dbt_recipe.yml
```

```yaml
# datahub_dbt_recipe.yml
source:
  type: dbt
  config:
    manifest_path: target/manifest.json
    catalog_path: target/catalog.json
    test_results_path: target/run_results.json
sink:
  type: datahub-rest
  config:
    server: "http://datahub:8080"
```

## 4.3 Linaje entre sistemas con OpenLineage

OpenLineage captura eventos de linaje de múltiples herramientas (dbt, Airflow, Spark, MLflow) en un formato estándar y los centraliza en DataHub:

```python
# (ejemplo ejecutable)
# Emitir eventos OpenLineage desde un pipeline Python personalizado
from openlineage.client import OpenLineageClient
from openlineage.client.run import RunEvent, RunState, Run, Job
import uuid
from datetime import datetime

client = OpenLineageClient(url="http://datahub:5000/api/v1/lineage")

def emit_lineage_event(
    job_name: str,
    input_datasets: list[str],
    output_datasets: list[str],
    run_id: str = None,
):
    run_id = run_id or str(uuid.uuid4())
    event = RunEvent(
        eventType=RunState.COMPLETE,
        eventTime=datetime.utcnow().isoformat() + "Z",
        run=Run(runId=run_id),
        job=Job(namespace="statistical-pipeline", name=job_name),
        inputs=[{"namespace": "postgresql://analytics", "name": ds} for ds in input_datasets],
        outputs=[{"namespace": "postgresql://analytics", "name": ds} for ds in output_datasets],
    )
    client.emit(event)

# Uso al completar una transformación
emit_lineage_event(
    job_name="compute_credit_features",
    input_datasets=["analytics.stg_ventas", "analytics.stg_clientes"],
    output_datasets=["analytics.mart_features_credito"],
)
```

### 4.4 Linaje de modelos MLflow → DataHub

El vínculo entre las features (dbt) y los modelos (MLflow) se cierra registrando el dataset en MLflow y emitiendo un evento de linaje:

```python
# (fragmento ilustrativo, no ejecutable)
# Al registrar el modelo en MLflow
with mlflow.start_run() as run:
    mlflow.log_param("input_dataset", "analytics.mart_features_credito")
    mlflow.log_param("dvc_data_hash", get_dvc_commit_hash())
    # ...
    # Emitir linaje: mart_features_credito → modelo MLflow
    emit_lineage_event(
        job_name=f"train_model_{run.info.run_id[:8]}",
        input_datasets=["analytics.mart_features_credito"],
        output_datasets=[f"mlflow://models/CreditRiskBayesian/run/{run.info.run_id}"],
        run_id=run.info.run_id,
    )
```

## 5. Orquestación de Pipelines DataOps
### 5.1 Prefect para orquestación Python
Prefect es el orquestador recomendado para pipelines estadísticos en Python, con soporte nativo para reintentos, logging estructurado y observabilidad.

### Diagrama de flujo de Prefect

```mermaid
flowchart LR
    Extract[extract_transactions] --> Validate[validate_and_log]
    Validate --> Compute[compute_features]
    Compute --> Write[write_features]
```

```python
# (fragmento ilustrativo, no ejecutable)
# flows/data_pipeline.py
import os
import pandas as pd
from sqlalchemy import create_engine
from prefect import flow, task, get_run_logger
from prefect.tasks import task_input_hash
from datetime import timedelta
from services.data_service import compute_credit_features


def validate_data_contract(df: pd.DataFrame, suite_name: str = "training_suite") -> bool:
    """Valida un DataFrame contra un expectation suite de Great Expectations."""
    import great_expectations as gx

    context = gx.get_context()
    validator = context.get_validator(
        batch_request=gx.core.batch.RuntimeBatchRequest(
            datasource_name="pandas_datasource",
            data_connector_name="runtime_connector",
            data_asset_name="training_data",
            runtime_parameters={"batch_data": df},
            batch_identifiers={"run": "train"},
        ),
        expectation_suite_name=suite_name,
    )
    results = validator.validate()
    return results.success


@task(
    retries=3,
    retry_delay_seconds=60,
    cache_key_fn=task_input_hash,
    cache_expiration=timedelta(hours=6),
)
def extract_transactions(source_table: str) -> pd.DataFrame:
    logger = get_run_logger()
    logger.info(f"Extrayendo datos de {source_table}")
    engine = create_engine(os.environ["DATABASE_URL"])
    df = pd.read_sql(f"SELECT * FROM {source_table} WHERE fecha >= CURRENT_DATE - 90", engine)
    logger.info(f"Extraídas {len(df):,} filas")
    return df


@task
def validate_and_log(df: pd.DataFrame, contract_suite: str) -> pd.DataFrame:
    logger = get_run_logger()
    if not validate_data_contract(df, contract_suite):
        raise ValueError("Contrato de calidad de datos violado")
    logger.info("Contrato de datos válido")
    return df

@task
def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    return compute_credit_features(df)

@task
def write_features(df: pd.DataFrame, target_table: str) -> None:
    engine = create_engine(os.environ["DATABASE_URL"])
    df.to_sql(target_table, engine, if_exists="replace", index=False)

@flow(name="data-pipeline-credito")
def data_pipeline_credito():
    raw = extract_transactions("staging.stg_ventas")
    validated = validate_and_log(raw, "training_suite")
    features = compute_features(validated)
    write_features(features, "marts.mart_features_credito")
    emit_lineage_event(
        "data_pipeline_credito",
        ["staging.stg_ventas"],
        ["marts.mart_features_credito"],
    )

if __name__ == "__main__":
    data_pipeline_credito()
```

### 5.2 Integración DataOps ↔ MLOps

El pipeline DataOps se ejecuta antes del pipeline MLOps. La integración se logra mediante un flujo de orquestación que los encadena:

### Diagrama de flujo de integración DataOps ↔ MLOps

```mermaid
flowchart LR
    subgraph DataOps[DataOps]
        A[Ingesta] --> B[Validación GE]
        B --> C[Transformación dbt]
    end
    subgraph MLOps[MLOps]
        D[Feature store] --> E[Entrenamiento]
        E --> F[Registro MLflow]
        F --> G[Despliegue]
    end
    C --> D
```

```python
# (fragmento ilustrativo, no ejecutable)
@flow(name="full-training-pipeline")
def full_training_pipeline():
    # 1. DataOps: preparar los datos
    data_pipeline_credito()

    # 2. MLOps: entrenar y registrar el modelo
    run_id = training_pipeline(
        data_path="data/mart_features_credito.parquet",
        formula_vars=["total_transacciones_90d", "volumen_total_90d", "antiguedad_anos"],
        target="default_90d",
        experiment_name="credit_risk",
        model_name="CreditRiskBayesian",
    )
    return run_id
```

## 6. Principios DataOps: Resumen

| Principio | Implementación |
|-----------|----------------|
| Pipelines como código | dbt (SQL), Prefect/Airflow (Python), SQLMesh |
| Testing de datos | dbt tests, Great Expectations, pytest para ETL Python |
| Entornos aislados | Schemas por desarrollador en dbt, Docker para bases de datos de test |
| Datos de prueba | Sintéticos o anonimizados; nunca PII real en desarrollo |
| Linaje automatizado | OpenLineage, dbt docs, DataHub |
| Idempotencia | Todas las transformaciones producen el mismo resultado si se ejecutan múltiples veces |
| Versionado | Git para código dbt, DVC para datos, MLflow para modelos |
| Monitoreo | Soda Core para observabilidad continua, alertas por severidad |

### Referencias

- dbt: https://docs.getdbt.com/

- SQLMesh: https://sqlmesh.com/

- Prefect: https://www.prefect.io/

- OpenLineage: https://openlineage.io/

- DataHub: https://datahubproject.io/

- Great Expectations: https://docs.greatexpectations.io/

- Soda Core: https://docs.soda.io/

- Faker (datos sintéticos): https://faker.readthedocs.io/

## Documentos relacionados

- [Estrategia de Datos y Data Governance](Data_Governance.md): gobernanza, metadatos y contratos de datos.
- [Feature Store y Gestión de Features](Feature_Store.md): gestión de features reutilizables y point-in-time correctness.
- [MLflow para la Gestión del Ciclo de Vida de Modelos Estadísticos](MLflow.md): registro y versionado de modelos integrado con pipelines DataOps.
- [Guía de Despliegue](Deployment_Guide.md): automatización, CI/CD, Docker y despliegue de pipelines de datos y modelos.
