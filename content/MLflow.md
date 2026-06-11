# MLflow para la Gestión del Ciclo de Vida de Modelos Estadísticos

MLflow es un componente fundamental en la ingeniería de software estadístico.

## 1. Rol de MLflow en la Ingeniería de Software Estadístico

La gestión del ciclo de vida de los modelos es un punto crítico en proyectos estadísticos. MLflow proporciona cuatro componentes principales:

- **Tracking**: registro de experimentos (parámetros, métricas, artefactos, entorno).

- **Models**: formato estándar para empaquetar modelos con sus dependencias.

- **Model Registry**: catálogo centralizado para versionar y promover modelos (staging, producción, archivado).

- **Projects**: formato para empaquetar código reproducible (menos utilizado, pero relevante para pipelines completos).

La adopción de MLflow aporta trazabilidad, gobernanza y automatización, y actúa como un elemento de unión entre equipos que utilizan diferentes lenguajes (Python, R) y frameworks.

## 2. Componentes y su Integración en la Arquitectura

### 2.1 Tracking Server (seguimiento de experimentos)

El Tracking Server almacena los metadatos de cada ejecución: parámetros, métricas, artefactos (modelos, gráficos, logs) y el código fuente.

### 2.2 Model Registry (registro de modelos)

El Model Registry actúa como un catálogo central que permite gestionar el ciclo de vida de los modelos registrados. Soporta:

- Versionado semántico de cada modelo.

- Transición entre estados (por ejemplo, de `staging` a `production`) mediante alias, lo que permite una promoción flexible y con trazabilidad.

- Almacenamiento asociado de la firma de entrada/salida (signature), el entorno de ejecución y las métricas de validación.

- Registro de quién realizó cada promoción y cuándo.

Este componente es esencial para entornos con requisitos de auditoría, ya que proporciona un historial inmutable de las versiones que han pasado a producción.

### 2.3 MLflow Models (formato de empaquetado)

MLflow Models define un formato estándar para empaquetar un modelo junto con sus dependencias y su lógica de inferencia. Un modelo empaquetado puede:

- Servirse mediante una API REST utilizando `mlflow models serve`.

- Convertirse en un contenedor Docker autocontenido con `mlflow models build-docker`.

- Desplegarse en plataformas como SageMaker, Azure ML o Kubernetes sin cambios en el código de inferencia.

Esta estandarización simplifica el paso de la experimentación a la producción y reduce la fricción entre equipos.

### 2.4 MLflow Projects (empaquetado de código)

Define un formato para empaquetar código de análisis reproducible, especificando sus dependencias y puntos de entrada. Aunque es el componente menos utilizado en proyectos grandes, es útil para definir pipelines completos de forma reproducible, especialmente cuando se combina con herramientas de orquestación.

## 3. Integración Técnica con Python y R

MLflow proporciona APIs nativas para Python y R, además de una API REST para cualquier otro lenguaje.

### 3.1 Ejemplo en Python (PyMC, scikit-learn)

```python
# (fragmento ilustrativo, no ejecutable)
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
from mlflow.models import infer_signature

mlflow.set_tracking_uri("http://mlflow-server:5000")
mlflow.set_experiment("credit_risk_model")

with mlflow.start_run(run_name="rf_baseline"):
    # Registrar parámetros
    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 5)

    # Entrenamiento
    model = RandomForestClassifier(n_estimators=100, max_depth=5)
    model.fit(X_train, y_train)

    # Registrar métricas
    y_pred = model.predict_proba(X_val)[:, 1]
    auc = roc_auc_score(y_val, y_pred)
    mlflow.log_metric("val_auc", auc)

    # Registrar firma del modelo (previene errores en producción)
    signature = infer_signature(X_train, model.predict(X_train))

    # Guardar y registrar el modelo en el Model Registry
    mlflow.sklearn.log_model(
        sk_model=model,
        artifact_path="model",
        signature=signature,
        registered_model_name="CreditRiskClassifier"
    )
```

### 3.2 Ejemplo en R (brms)
El paquete mlflow en R requiere que el paquete Python de MLflow esté instalado en el sistema (por ejemplo, dentro del contenedor). Las funciones son análogas.

```r
# (fragmento ilustrativo, no ejecutable)
library(mlflow)

mlflow_set_tracking_uri("http://mlflow-server:5000")
mlflow_set_experiment("bayesian_sales_forecast")

with(mlflow_start_run(), {
    # Registrar parámetros
    mlflow_log_param("chains", 4)
    mlflow_log_param("iter", 2000)

    # Ajustar modelo (brms)
    fit <- brm(y ~ x1 + x2, data = data, chains = 4, iter = 2000)

    # Registrar métricas de diagnóstico
    rhat_max <- max(brms::rhat(fit))
    mlflow_log_metric("rhat_max", rhat_max)

    # Guardar modelo serializado como artefacto
    saveRDS(fit, "model.rds")
    mlflow_log_artifact("model.rds")
})
```

### 3.3 Model Registry: Gobernanza y Promoción de Modelos

El flujo típico de gestión de versiones es el siguiente:

- Una ejecución de entrenamiento registra un modelo en el Registry. Se crea una nueva versión (ej. versión 1).

- Tras validar las métricas (por ejemplo, AUC > 0.88), se promueve la versión al alias staging.

- En el entorno de pruebas (staging) se ejecutan pruebas de integración y de aceptación. Si superan, se promueve al alias production.

- La versión anterior en producción se puede cambiar a archived para mantener la trazabilidad.

La promoción puede realizarse manualmente desde la interfaz web de MLflow o mediante scripts automatizados. Para garantizar la calidad, se pueden implementar gates automáticos:

```python
# (fragmento ilustrativo, no ejecutable)
def evaluate_and_promote(model_uri, test_data, min_auc=0.88):
    model = mlflow.sklearn.load_model(model_uri)
    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    if auc >= min_auc:
        client = mlflow.tracking.MlflowClient()
        client.transition_model_version_stage(
            name="CreditRiskClassifier",
            version=version,
            stage="production"
        )
        return True
    return False
```

### 3.4 Integración en Pipelines CI/CD (GitHub Actions + Docker)

La automatización es clave para la reproducibilidad. A continuación se describen los flujos típicos.

#### 3.4.1 Entrenamiento y registro automático

Un workflow de CI (por ejemplo, al hacer push a la rama main o mediante una ejecución programada) ejecuta un script que:

Restaura el entorno (dependencias de Python o R).

Ejecuta el entrenamiento, logueando parámetros, métricas y artefactos en el Tracking Server.

Registra el modelo en el Model Registry.

La URI del Tracking Server se pasa como variable de entorno, no se incluye en el código.

## 3.5 Validación y promoción a staging
Tras el entrenamiento, un job independiente evalúa el modelo recién registrado. Si cumple los umbrales de calidad, se promueve automáticamente a staging. Esta promoción queda registrada en los logs del pipeline.

## 4. Despliegue a producción
La promoción a production puede ser manual (por ejemplo, desde la interfaz web de MLflow) o automática si el pipeline de staging tiene éxito. Una vez promocionado, otro pipeline (CD) puede:

Obtener la última versión con alias production.

Construir una imagen Docker del modelo usando mlflow models build-docker.

Etiquetar la imagen con el número de versión y subirla a un registro de contenedores (GitHub Container Registry, ECR).

Desplegar la imagen en el orquestador (Kubernetes, ECS).

### Segmento conceptual de GitHub Actions
```yaml
name: MLflow CI/CD

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Train and register
        run: python train.py
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}

  evaluate:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - name: Evaluate and promote to staging
        run: python evaluate.py

  deploy-production:
    needs: evaluate
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'  # promoción manual
    steps:
      - name: Build Docker image and deploy
        run: ./deploy.sh
```

## 5. Integración con Versionado de Datos (DVC)
MLflow no está diseñado para versionar datasets grandes. Para ello se utiliza DVC (Data Version Control) o Git LFS. La combinación proporciona trazabilidad completa:

DVC versiona los datos y mantiene los metadatos en el repositorio Git.

En cada ejecución de MLflow, se registra como parámetro el hash del commit de DVC (o el tag del dataset) que se utilizó.

De esta forma, dado un modelo registrado en MLflow, se puede recuperar la versión exacta de los datos que lo generaron y reproducir el experimento.

Consideraciones para Entornos Profesionales
Seguridad: El Tracking Server debe configurarse con autenticación (basic auth, OAuth mediante proxy inverso) y cifrado TLS. No debe exponerse directamente a internet sin estas medidas. Las credenciales se manejan mediante variables de entorno.

**Escalabilidad**: Para equipos grandes, el Tracking Server debe desplegarse con una base de datos gestionada (PostgreSQL) y un almacenamiento de artefactos escalable (S3, MinIO). El servidor MLflow puede ejecutarse en un orquestador con múltiples réplicas y balanceador de carga.

**Retención y limpieza**: Los artefactos de ejecuciones antiguas deben archivarse o eliminarse según políticas de retención. MLflow no incluye limpieza automática; debe implementarse un proceso externo (ej. un script que elimine ejecuciones anteriores a una fecha).

**Auditoría**: MLflow por sí mismo no es un sistema de auditoría inmutable (los registros pueden modificarse si se tiene acceso a la base de datos). Para proyectos altamente regulados, se debe complementar con logs firmados o con la captura de eventos de promoción mediante webhooks hacia un sistema de auditoría externo.

### 5.1 Relación con Otros Componentes del Sistema

**Contratos de datos y trazabilidad de ingesta**: MLflow añade la trazabilidad de modelos, cerrando el ciclo desde los datos hasta el artefacto desplegado.

**APIs y despliegue**: El formato estándar de MLflow Models permite generar contenedores listos para producción sin código adicional de inferencia.

**CI/CD con GitHub Actions y Docker**: MLflow proporciona los metadatos necesarios para decidir si una nueva versión debe ser promocionada y desplegada.

**Checklist profesional**: Se añaden verificaciones como "experiment tracking configurado", "model registry en uso" y "promoción automatizada con gates de calidad".

**Pipeline Integrado**: DVC + Contratos de Calidad + MLflow
Esta sección muestra el ejemplo concreto de integración que cierra la trazabilidad completa desde los datos hasta el modelo en producción. Es el flujo de referencia para cualquier entrenamiento en el sistema.

### 5.2 El problema que resuelve
Sin esta integración, es imposible responder con certeza:

- ¿Con qué versión exacta de los datos fue entrenado el modelo en producción?

- ¿Pasaron esos datos el contrato de calidad antes del entrenamiento?

- ¿Puedo reproducir exactamente ese entrenamiento?

Con la integración DVC + Great Expectations + MLflow, la respuesta es sí a las tres preguntas.

## 6. Flujo completo

```text
1. DVC rastrea el dataset (hash del commit Git como identificador)
2. Great Expectations valida el contrato de calidad
3. Entrenamiento (PyMC / statsmodels)
4. MLflow registra parámetros + métricas + hash DVC + hash Git
5. Gate de calidad automático (R-hat, ESS, métricas de negocio)
6. Promoción a staging si pasa el gate

```

## 7. Implementación

```python
# (ejemplo ejecutable)
import subprocess
import json
from pathlib import Path
import mlflow
import great_expectations as gx
import pymc as pm
import arviz as az
import pandas as pd

def get_dvc_hash() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], capture_output=True, text=True
    ).stdout.strip()

def validate_quality_contract(df: pd.DataFrame, suite_name: str) -> bool:
    context = gx.get_context()
    validator = context.get_validator(
        batch_request=gx.core.batch.RuntimeBatchRequest(
            datasource_name="pandas_ds",
            data_connector_name="runtime_connector",
            data_asset_name="training_data",
            runtime_parameters={"batch_data": df},
            batch_identifiers={"run": "train"},
        ),
        expectation_suite_name=suite_name,
    )
    results = validator.validate()
    return results.success

def training_pipeline_integrated(
    data_path: str,
    formula_vars: list[str],
    target: str,
    experiment_name: str,
    model_name: str,
    quality_suite: str = "training_suite",
    min_ess: float = 100.0,
) -> str:
    # Paso 1: Cargar datos versionados por DVC
    df = pd.read_parquet(data_path)
    dvc_hash = get_dvc_hash()

    # Paso 2: Validar contrato de calidad ANTES del entrenamiento
    if not validate_quality_contract(df, quality_suite):
        raise ValueError(
            f"Contrato de calidad violado para suite='{quality_suite}'. "
            "Entrenamiento abortado. Revisar audit/data_validation.json."
        )

    mlflow.set_tracking_uri("http://mlflow-server:5000")
    mlflow.set_experiment(experiment_name)

    with mlflow.start_run(run_name=f"run_{dvc_hash[:8]}") as run:
        # Paso 3: Entrenar el modelo
        with pm.Model() as model:
            # [especificación del modelo según formula_vars y target]
            trace = pm.sample(2000, chains=4, return_inferencedata=True, random_seed=2026)

        # Paso 4: Registrar TODO en MLflow (parámetros + hash DVC = trazabilidad completa)
        mlflow.log_params({
            "formula": f"{target} ~ {' + '.join(formula_vars)}",
            "prior_type": "weakly_informative",
            "chains": 4,
            "iterations": 2000,
            "random_seed": 2026,
            "dvc_data_hash": dvc_hash,            # ← vínculo datos ↔ modelo
            "data_path": data_path,
            "quality_suite": quality_suite,
            "decision_doc": "docs/decisions/001-prior-selection.md",
        })

        # Diagnósticos
        rhat_max = float(az.rhat(trace).max().to_array().max())
        ess_min = float(az.ess(trace).min().to_array().min())
        divergences = int(trace.sample_stats.diverging.sum())
        converged = rhat_max < 1.01 and ess_min >= min_ess and divergences == 0

        mlflow.log_metrics({
            "rhat_max": rhat_max,
            "ess_min": ess_min,
            "divergences": divergences,
        })

        # Artefactos: traza y diagnósticos en audit/
        Path("audit").mkdir(exist_ok=True)
        diag_path = f"audit/diagnostics_{run.info.run_id[:8]}.json"
        with open(diag_path, "w") as f:
            json.dump({
                "rhat_max": rhat_max,
                "ess_min": ess_min,
                "divergences": divergences,
                "converged": converged,
                "run_id": run.info.run_id,
                "dvc_hash": dvc_hash,
            }, f, indent=2)

        az.to_netcdf(trace, "trace.nc")
        mlflow.log_artifact("trace.nc")
        mlflow.log_artifact(diag_path)

        # Registrar el modelo en el Registry
        mlflow.register_model(f"runs:/{run.info.run_id}/trace", model_name)

        # Paso 5: Gate de calidad automático → promoción a staging
        if converged:
            client = mlflow.tracking.MlflowClient()
            versions = client.get_latest_versions(model_name, stages=["None"])
            if versions:
                client.set_registered_model_alias(model_name, "staging", versions[0].version)
                print(f"✓ Modelo v{versions[0].version} promovido a staging.")
        else:
            print(f"✗ Gate no superado: R-hat={rhat_max:.4f}, ESS={ess_min:.1f}, divergencias={divergences}")

    return run.info.run_id
```

## 8. Recuperar el dataset exacto de un modelo en producción

```python
# (fragmento ilustrativo, no ejecutable)
def reproduce_training(model_name: str, version: int) -> pd.DataFrame:
    client = mlflow.tracking.MlflowClient()
    mv = client.get_model_version(model_name, str(version))
    run = client.get_run(mv.run_id)

    dvc_hash = run.data.params["dvc_data_hash"]
    data_path = run.data.params["data_path"]

    # Restaurar el estado del repositorio al commit exacto
    subprocess.run(["git", "checkout", dvc_hash], check=True)
    subprocess.run(["dvc", "checkout"], check=True)
    return pd.read_parquet(data_path)
```

## 9. Diferencia entre Data Contract y validación de calidad

- Concepto	Herramienta	Qué verifica
- Esquema y tipos	Pydantic, JSONSchema	Estructura del dato (columnas, tipos, nulidad)
- Calidad de datos	Great Expectations	Distribuciones, rangos, unicidad, frescura
- Contrato completo	YAML + GE + Soda	Ambos: esquema + calidad estadística
- El contrato de datos es más amplio que la validación de esquema. La validación de esquema confirma que el dato tiene la forma correcta; la validación de calidad confirma que el contenido es estadísticamente plausible y cumple expectativas de negocio.

## GitHub Actions: pipeline completo
```yaml
name: MLflow Training Pipeline

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  train-and-validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: pip install poetry && poetry install --sync

      - name: DVC checkout (restaurar datos versionados)
        run: |
          dvc remote modify origin --local access_key_id ${{ secrets.AWS_ACCESS_KEY }}
          dvc pull
        env:
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_KEY }}

      - name: Linting
        run: ruff check . && black --check .

      - name: Unit tests
        run: pytest tests/unit/ --cov=src --cov-report=xml

      - name: Integration tests
        run: pytest tests/integration/ -v

      - name: Train model (with DVC + GE + MLflow)
        run: python -m src.pipelines.training
        env:
          MLFLOW_TRACKING_URI: ${{ secrets.MLFLOW_TRACKING_URI }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

  build-and-scan:
    needs: train-and-validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t statistical-api:${{ github.sha }} .

      - name: Scan for vulnerabilities
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: statistical-api:${{ github.sha }}
          exit-code: "1"
          severity: CRITICAL

      - name: Push to registry
        run: |
          echo ${{ secrets.GHCR_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/${{ github.repository }}/statistical-api:${{ github.sha }}

  deploy-staging:
    needs: build-and-scan
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to staging
        run: ./scripts/deploy_staging.sh ${{ github.sha }}

      - name: Smoke tests
        run: pytest tests/smoke/ --base-url=https://staging.api.example.com

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    environment:
      name: production
      url: https://api.example.com
    steps:
      - name: Deploy to production
        run: ./scripts/deploy_production.sh ${{ github.sha }}
```
## Documentos relacionados

- [Getting Started](Getting_Started.md): flujo completo de entrenamiento y registro de modelos.
- [Monitoreo de Modelos en Producción](Monitoring.md): alertas y drift detection post-despliegue.
- [Estrategia de Rollback de Modelos](Rollback.md): revertir a versiones anteriores del registry.
- [Guía de Despliegue](Deployment_Guide.md): integración de MLflow en pipelines de entrega continua.
- [Feature Store y Gestión de Features](Feature_Store.md): gestión de features reutilizables para entrenamiento e inferencia.
