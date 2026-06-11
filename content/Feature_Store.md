# Feature Store y Gestión de Features

## 1. Introducción: El Problema Fundamental del Feature Engineering

Uno de los problemas más comunes al desplegar modelos de machine learning en producción es el **training-serving skew**: la degradación del rendimiento del modelo porque las características (features) usadas durante el entrenamiento difieren de las usadas durante la inferencia en tiempo real.

Este problema surge cuando dos equipos diferentes implementan la misma feature lógica con código ligeramente distinto, o cuando el código de entrenamiento calcula features en SQL mientras que el servicio online las calcula en Python. Las sutiles discrepancias en el manejo de fechas, valores nulos o límites temporales provocan que el rendimiento offline no se reproduzca en producción.

Un feature store no es solo una base de datos. Es un sistema de corrección y rendimiento que cierra la brecha entre el entrenamiento offline y el servicio online.

---

## 2. ¿Qué es un Feature Store? El Desglose de sus Tres Responsabilidades

Un feature store no es una cosa única, sino tres responsabilidades en una misma caja:

| Componente | Propósito | Ejemplo de Implementación |
|------------|-----------|---------------------------|
| Registro de features | Metadatos sobre quién posee una feature, de qué fuente proviene, qué transformación la produjo y qué tipo tiene. | Feast Feature Registry |
| Materialización offline | Unir valores históricos de features en el momento correcto para construir datasets de entrenamiento. | Offline store con BigQuery |
| Servicio online | Búsqueda clave-valor con latencia de milisegundos que devuelve el feature más fresco en tiempo de inferencia. | Online store con Redis |

Estas tres capas son separables (por ejemplo, dbt + Snowflake pueden hacer registro y materialización, Redis puede hacer servicio online). <br>
Lo que añaden soluciones como Feast, Tecton o Hopsworks es empaquetar las tres bajo una misma API y garantizar consistencia entre ellas, especialmente contra el training-serving skew.

---

## 3. Arquitectura de un Feature Store Profesional

### 3.1. Online vs Offline Store

Un feature store tiene casi siempre dos motores de almacenamiento:

| Característica | Offline Store | Online Store |
|----------------|---------------|--------------|
| Propósito | Generación de datasets de entrenamiento y scoring batch | Inferencia en tiempo real |
| Latencia | Segundos a minutos | 1–10 ms (p99) |
| Datos que contiene | Históricos completos (petabytes) | Solo los valores más recientes por entidad |
| Ejemplos | BigQuery, Snowflake, Redshift, Delta Lake | Redis, DynamoDB, Cassandra, ScyllaDB |
| Patrón de consulta | SQL, DataFrames | Key-value lookup |
| Escala | TB–PB | GB |
| Consistencia | Fuerte | Eventual |

La misma feature vive en ambos lugares con diferente frescura. El almacenamiento offline guarda cada valor histórico; el online guarda "la fila más reciente" por entidad.

### 3.2. Frescura de Features: Batch, Streaming y Real-time

La frescura de un feature indica cuán recientemente refleja el estado actual. En función de la ventana de agregación, encontramos tres tipos:

| Tipo | Frecuencia de actualización | Ejemplo |
|------|----------------------------|---------|
| Batch | Por hora a diaria | "Número de compras en los últimos 30 días" |
| Streaming | Segundos a minutos | "Monto de transacciones en los últimos 5 minutos" |
| Real-time | En tiempo de solicitud | "Número de clics en la sesión actual" |

### 3.3. Registro de Features: El Catálogo Central

El registro de features es el componente central que almacena las definiciones, esquemas y metadatos de todas las features. Funciona como un catálogo vivo donde los equipos pueden:

- Descubrir qué features ya existen — evitando recalcular lo mismo una y otra vez.
- Entender quién las posee, de qué fuente provienen y cómo se transformaron.
- Rastrear qué modelos downstream dependen de cada feature (linaje bidireccional).

### 3.4. Feature Server

El feature server es un servicio HTTP/gRPC sin estado que lee features del online store y las sirve a los modelos en producción. Feast lo implementa sobre FastAPI, y puede escalarse horizontalmente en Kubernetes.

---

## 4. Point-in-Time Correctness: El Mecanismo que Previene la Fuga de Datos

El **point-in-time correctness (PIT)** es probablemente la funcionalidad más importante (y menos comprendida) de un feature store. Resuelve un problema crítico: cómo construir un dataset de entrenamiento que use exclusivamente información que existía en el momento real en que ocurrió el evento a predecir.

### 4.1. El Problema de las LEFT JOIN tradicionales

Considera un modelo que predice si un usuario comprará en los próximos 7 días. Un enfoque naive sería:

```sql
-- ESTO ESTÁ MAL: Fuga de datos futuros
SELECT
    u.user_id,
    u.age,
    SUM(t.amount) as total_spent,
    CASE WHEN o.order_date > u.prediction_date THEN 1 ELSE 0 END AS label
FROM users u
LEFT JOIN transactions t ON u.user_id = t.user_id
LEFT JOIN orders o ON u.user_id = o.user_id
```

Esta consulta usa todas las transacciones históricas, incluyendo aquellas que ocurrieron después de la fecha de predicción. El modelo aprende con información del futuro y rendirá pobremente en producción.

### 4.2. La Solución: Point-in-Time Joins

Un feature store implementa joins temporales que garantizan que, para una entidad en un timestamp t_s dado, solo se incluyan features con timestamps ≤ t_s:

```python
# (fragmento ilustrativo, no ejecutable)
# Feast: Construcción de training dataset sin fugas
training_df = fs.get_historical_features(
    entity_df=entity_df,  # user_id, event_timestamp, label
    features=[
        "user_transaction_features:total_purchases",
        "user_transaction_features:avg_order_value",
        "user_profile:age"
    ]
)       
```

Internamente, Feast ejecuta un point-in-time join que por cada fila del entity DataFrame (user_id, event_timestamp) recupera los valores de feature que estaban disponibles en ese momento preciso, ni antes ni después.

### 4.3. Datos Offline vs Feature Values

Una distinción crucial que se debe establecer es: los **datos raw (crudos) no son features**. Las features son valores transformados derivados de datos raw, listos para consumo directo por un modelo.

| Nivel de abstracción | Ejemplo | Quién lo gestiona |
|----------------------|---------|-------------------|
| Datos raw | Tabla `transactions` con `amount`, `timestamp`, `user_id` | Data Lake / Warehouse |
| Features brutas | `user_transaction_features` como feature view | Feature Store (offline store) |
| Features transformadas | `avg_order_value_30d` | Feature Store (capa de transformación) |
| Vector de features | Conjunto de features para un modelo específico | Feature Service |

---

## 5. Feast en Acción: El Feature Store Open Source de Referencia

Feast es el feature store de código abierto más ampliamente utilizado, con soporte para caminos offline (batch training) y online (real-time serving).

## 5.1. Estructura de un Feature Repository

```bash
feature_repo/
├── feature_store.yaml      # Configuración del proyecto
├── entities.py             # Definición de entidades (user_id, item_id, etc.)
├── data_sources.py         # Fuentes de datos (Parquet, BigQuery, Redshift)
├── features/
│   ├── user_features.py    # Features de usuario
│   ├── transaction_features.py
│   └── session_features.py
└── tests/
    └── test_feature_views.py
5.2. Configuración de feature_store.yaml para Producción
yaml
project: fraud_detection
registry:
  registry_type: sql
  path: postgresql://user:pass@host:5432/feast_registry
provider: local  # local | gcp | aws
online_store:
  type: redis
  connection_string: "redis-cluster.internal:6379"
  redis_type: redis_cluster
offline_store:
  type: bigquery
  dataset: feature_store
entity_key_serialization_version: 2
```

## 5.3. Definiendo Entidades y Features

```python
# (ejemplo ejecutable)
# features/user_features.py
from datetime import timedelta
from feast import Entity, FeatureView, Field, FileSource
from feast.types import Float32, Int64, String

# 1. Definir la entidad (clave por la que se agrupan las features)
user = Entity(
    name="user_id",
    join_keys=["user_id"],
    description="Identificador único del usuario"
)

# 2. Definir la fuente de datos
user_transactions_source = FileSource(
    path="data/user_transactions.parquet",
    timestamp_field="event_timestamp",
    created_timestamp_column="created_timestamp",
)

# 3. Definir el Feature View (la feature propiamente dicha)
user_transaction_features = FeatureView(
    name="user_transaction_features",
    entities=[user],
    ttl=timedelta(days=7),           # Caduca después de 7 días en online store
    schema=[
        Field(name="total_purchases", dtype=Int64),
        Field(name="avg_order_value", dtype=Float32),
        Field(name="days_since_last_purchase", dtype=Int64),
        Field(name="purchase_frequency", dtype=Float32)
    ],
    source=user_transactions_source,
)
```

## 5.4. Materialización: Sincronizando Offline → Online
La materialización es el proceso que copia features del offline store al online store, ejecutándose típicamente en un horario programado (ej. cada hora con Airflow).

```python
# (fragmento ilustrativo, no ejecutable)
# DAG en Airflow
from airflow.decorators import dag, task
from feast import FeatureStore
from datetime import datetime, timedelta

@dag(schedule_interval="0 * * * *", start_date=datetime(2026, 1, 1))
def feast_materialization():
    store = FeatureStore(repo_path="feature_repo/")

    @task
    def materialize():
        store.materialize(
            start_date=datetime.utcnow() - timedelta(hours=1),
            end_date=datetime.utcnow()
        )
```

## 5.5. Entrenamiento Offline vs Servicio Online

```python
# (fragmento ilustrativo, no ejecutable)
# Entrenamiento: get_historical_features() usa offline store
training_df = store.get_historical_features(
    entity_df=entity_df,        # user_id, event_timestamp, label
    features=[
        "user_transaction_features:total_purchases",
        "user_transaction_features:avg_order_value",
        "user_profile:age"
    ]
).to_df()

# Inferencia: get_online_features() usa online store
features = store.get_online_features(
    features=[
        "user_transaction_features:total_purchases",
        "user_transaction_features:avg_order_value"
    ],
    entity_rows=[{"user_id": "user_123"}]
).to_dict()
```

## 5.6. Cuándo Introducir un Feature Store

La decisión de introducir Feast debe basarse en umbrales prácticos:

| Escenario | Valor de Feast | Justificación |
|-----------|----------------|---------------|
| 1 modelo, 1 equipo, 1 fuente de datos | **Bajo — omitir** | El costo operativo supera el beneficio |
| Múltiples modelos compartiendo features | **Alto — elimina cómputo duplicado** | La reutilización de features paga la infraestructura |
| Training-serving skew observado en producción | **Crítico — función principal de Feast** | Feast garantiza la misma lógica en entrenamiento e inferencia |
| Features en tiempo real con latencia < 10 ms | **Alto — el patrón online store brilla** | Redis + feature server resuelven la latencia |
| Batch-only, sin inferencia real-time | **Moderado — el registro ayuda** | El catálogo de features ya aporta valor |

> **Recomendación práctica:** introducir Feast a partir del umbral de **3 modelos o 2 equipos**. Antes de ese punto, el costo operativo excede el valor obtenido.

## 6. El Ecosistema de Herramientas en 2026

El mercado de feature stores ha madurado. La era dorada 2020–2022 terminó, y en mayo de 2026 el mercado se ha dividido en dos grandes vertientes:

### 6.1. Plataformas Dedicadas (Enterprise)

| Herramienta | Origen | Fortalezas | Consideraciones |
|-------------|--------|------------|-----------------|
| **Tecton** | Empresarial | Automatiza pipelines de features; soporta streaming con latencia <100 ms; auditoría avanzada y compliance SOC 2; abstrae la complejidad de data engineering | Comercial; costo elevado; ideal para organizaciones grandes |
| **Hopsworks** | Académico/Empresarial | Plataforma completa que incluye feature store, MLOps y cómputo; utiliza Apache Hudi y Spark | Alta latencia para volúmenes pequeños; curva de aprendizaje pronunciada |
| **Chalk** | Moderno | Enfoque en simplicidad y developer experience | Menos maduro que Tecton |

### 6.2. Integraciones Nativas (Lakehouse/Warehouse)

| Herramienta | Estrategia | Ventaja Principal |
|-------------|------------|-------------------|
| **Databricks Feature Store** | Parte de Unity Catalog | "Ya vive en tu plataforma de datos" — sin infraestructura adicional |
| **Snowflake Feature Store** | Nativo en Snowpark | Mismo modelo de gobernanza que el resto de los datos |
| **Vertex AI Feature Store (Google)** | Gestionado | Integración nativa con el ecosistema GCP |
| **SageMaker Feature Store (AWS)** | Gestionado | Integración nativa con ecosistema AWS |

### 6.3. Feast como Opción Open Source

Para organizaciones que prefieren mantener el control de su infraestructura sin vendor lock-in, **Feast** sigue siendo la opción más sólida del ecosistema open source. Su arquitectura probada, comunidad activa y capacidad de desplegarse en Kubernetes lo convierten en la base ideal sobre la cual construir una plataforma de features propia..

## 7. Integración con MLflow: El Flujo Completo

### 7.1. Roles Complementarios

Feast y MLflow no son competidores — resuelven problemas fundamentalmente diferentes en el ciclo de vida del ML.

| Capacidad | Feast | MLflow | Kubeflow |
|-----------|-------|--------|----------|
| Definir y versionar esquemas de features | ✅ Sí | ❌ No | ❌ No |
| Almacenar y servir features (online + offline) | ✅ Sí | ❌ No | ❌ No |
| Point-in-time correctness para features | ✅ Sí | ❌ No | ❌ No |
| Linaje y registro de features | ✅ Sí | ❌ No | ❌ No |
| Validación de calidad de datos en features | ✅ Sí | ❌ No | ❌ No |
| Registrar experimentos, métricas y parámetros | ❌ No | ✅ Sí | ❌ No |
| Model registry (promover modelos, alias) | ❌ No | ✅ Sí | ❌ No |
| Orquestar pipelines multi-step | ❌ No | ❌ No | ✅ Sí |

Un error común es pensar que MLflow puede rastrear features. MLflow puede registrar nombres de features como parámetros, pero **no puede definir, almacenar, transformar ni servir features**. No tiene concepto de offline store, online store, ni point-in-time joins.

## 7.2. Arquitectura de Integración

```text
Flujo completo con Feast + MLflow + Kubeflow:

a. Feature Engineering (Feast)
   ├─ Definir features en feature_repo/
   ├─ feast apply → registra en Feature Registry
   └─ Materialización programada (offline → online)

b. Experimentación (MLflow)
   ├─ get_historical_features(Feast) → training_df
   ├─ Entrenar modelo
   └─ mlflow.log_param("features", ["feature1", "feature2"])
       mlflow.log_metric("rhat", max_rhat)
       mlflow.log_artifact("model.pkl")

c. Registro del Modelo (MLflow Model Registry)
   ├─ mlflow.register_model()
   ├─ Promoción: Staging → Production
   └─ Model versioning + aliases

d. Orquestación (Kubeflow)
   ├─ Pipeline: ingest → transform → train → deploy
   └─ Cada paso invoca Feast y MLflow según corresponda

e. Inferencia (Feast Online Store + MLflow Serving)
   ├─ get_online_features(Feast) → feature_vector
   ├─ Modelo servido por MLflow o integración propia
   └─ Predicción retornada
```
## 7.3. Integración Práctica

```python
# (fragmento ilustrativo, no ejecutable)
# Ejemplo: flujo de entrenamiento que integra Feast y MLflow
import mlflow
from feast import FeatureStore

# 1. Obtener features desde Feast
store = FeatureStore(repo_path="feature_repo/")
training_df = store.get_historical_features(
    entity_df=entity_df,
    features=["user_features:total_purchases", "user_features:avg_order_value"]
).to_df()
```

## 7.4. Iniciar experimento en MLflow

```mlflow
with mlflow.start_run() as run:
    # Log de metadatos del feature store
    mlflow.log_param("feature_store_version", "v2.1")
    mlflow.log_param("features_used", ["total_purchases", "avg_order_value"])

    # Entrenar modelo
    model = train_model(training_df)

    # Calcular métricas
    rhat, ess = compute_diagnostics(model)
    mlflow.log_metric("rhat_max", rhat)
    mlflow.log_metric("ess_min", ess)

    # Registrar el modelo
    mlflow.sklearn.log_model(model, "model")
    mlflow.register_model(f"runs:/{run.info.run_id}/model", "fraud_detection_model")
```

## 8. Mejores Prácticas

### 8.1. Gestión de Features como Activos Versionados

| Práctica | Implementación | Justificación |
|----------|----------------|---------------|
| Versionar definiciones de features | Cuando cambias una transformación, crea `avg_order_value_v2` en lugar de modificar la existente. | Permite reproducir modelos antiguos y migrar gradualmente. |
| Feature discovery | Centralizar todas las features en un catálogo accesible (Feast Registry). | Los equipos pueden reutilizar features ya validadas. |
| Documentación de linaje | Cada feature debe tener owner, fuente, transformación y modelos dependientes. | Auditoría y comprensión del impacto de cambios. |

### 8.2. Prevención de Fugas de Datos

| Práctica | Descripción |
|----------|-------------|
| Usar point-in-time joins siempre | Las `LEFT JOIN` estándar pueden filtrar datos futuros al training set. Usar siempre la funcionalidad PIT del feature store. |
| Validar la construcción del dataset | Verificar que `max(event_timestamp)` en `training_df ≤ max(label_timestamp)` — si no, hay fuga. |
| Test de consistencia | Muestrear pequeñas entidades y comparar valores offline vs online; cualquier discrepancia debe investigarse. |

### 8.3. Monitoreo Continuo

| Métrica | Propósito | Herramientas |
|---------|-----------|--------------|
| Feature freshness | ¿Los features online están actualizados? | Feast metadata + alertas en materialización |
| Null rate | ¿Ha aumentado la tasa de valores nulos? | Soda Core, Great Expectations |
| Distribution drift | ¿La distribución de la feature ha cambiado significativamente? | Evidently AI, WhyLabs |
| Training-serving skew | ¿Los valores online difieren sistemáticamente de los offline de entrenamiento? | Pruebas A/B de features |

### 8.4. Diseño para Consistencia

| Práctica | Descripción |
|----------|-------------|
| Entity keys consistentes | Usar las mismas claves de entidad en todas las features de un mismo modelo. |
| Pipelines determinísticos | La misma feature pipeline debe producir siempre el mismo resultado para la misma entrada (misma semilla, mismo orden). |
| TTL y caducidad | Definir `ttl` (time-to-live) apropiado para cada feature view, especialmente para features que no deban persistir indefinidamente en online store. |


### Referencias

- Feast documentation: https://docs.feast.dev/

- Tecton: https://www.tecton.ai/

- Hopsworks: https://www.hopsworks.ai/

- Databricks Feature Store: https://docs.databricks.com/machine-learning/feature-store/

- Snowflake Feature Store: https://docs.snowflake.com/en/developer-guide/feature-store

- MLflow: https://mlflow.org/
## Documentos relacionados

- [DataOps para Ingeniería Estadística](DataOps_Statistical_Engineering.md): pipelines de datos que alimentan y actualizan el feature store.
- [MLflow para la Gestión del Ciclo de Vida de Modelos Estadísticos](MLflow.md): registro de modelos entrenados con features del store.
- [Monitoreo de Modelos en Producción](Monitoring.md): detección de feature drift y degradación de la calidad de las features.
