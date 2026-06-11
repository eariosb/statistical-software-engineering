# Getting Started

**Flujo completo: desde cero hasta API y dashboard en ~30 minutos**

Esta guía recorre el ciclo completo de ingeniería de software estadístico con un ejemplo práctico y ejecutable.

# ¿Qué valor tiene este ejemplo?

Este ejemplo mínimo sienta las bases para proyectos reales: desde la validación de datos hasta el despliegue. Una vez interiorizado, podrás escalarlo a modelos más complejos (bayesianos, deep learning) y añadir monitoreo, reentrenamiento automático o feature stores.

## Producto Final

Un sistema completo de ingeniería de software estadístico que resuelve un problema real: predecir una variable continua (`y`) a partir de dos características (`x1`, `x2`) usando un modelo de regresión lineal. Aunque el problema es simple, el **valor real está en la infraestructura que lo rodea**:

- **Reproducibilidad**: todo el entorno, dependencias y datos se versionan (Poetry, DVC opcional).

- **Validación de datos**: se verifica calidad y esquema antes de entrenar (sin datos “sucios”).

- **Experiment tracking**: cada ejecución queda registrada en MLflow (parámetros, métricas, modelo).

- **Model registry**: se promueve automáticamente la mejor versión con el alias `champion`.

- **API productiva**: se expone el modelo como servicio REST con FastAPI, listo para integrarse a cualquier aplicación.

- **Dashboard interactivo**: un frontend en Next.js consume la API y permite visualizar predicciones y la curva del modelo.

- **Despliegue listo para producción**: con Docker Compose se empaquetan todos los servicios (API, frontend, MLflow).

---

## Utilidad para tu aprendizaje

Al completar esta guía, habrás adquirido competencias directamente transferibles a entornos profesionales:

- Estructurar un proyecto estadístico siguiendo una arquitectura en capas (core, servicios, interfaces).

- Automatizar la validación de datos con scripts simples (pandas) evitando bibliotecas pesadas al inicio.

- Gestionar experimentos y modelos con MLflow (tracking, registry, aliases).

- Crear una API documentada y robusta con FastAPI, cargando el modelo champion desde MLflow.

- Construir un dashboard interactivo en Next.js/TypeScript que consuma la API y muestre predicciones en tiempo real.

- Orquestar múltiples servicios con Docker para un despliegue consistente en cualquier entorno.

---

## Utilidad específica de cada paso

### Paso 0 – Estructura del proyecto
**Utilidad**: Aprender a organizar el código por capas, separando la lógica de negocio (`services`), la presentación (`interfaces/api`) y los contratos (`contracts`). Esta estructura facilita el mantenimiento y el testing.

### Paso 1 – Dataset y validación
**Utilidad**: Comprender la necesidad de **datos deterministas** (semilla fija) y la validación temprana. El script `train_contract.py` evita que datos corruptos lleguen al entrenamiento, un hábito esencial en MLOps.

### Paso 2 – Versionado con DVC (opcional)
**Utilidad**: Ver cómo se vincula el código con los datos. Si más adelante cambias el dataset, DVC permite volver a cualquier versión anterior y reproducir el modelo exacto.

### Paso 3 – Entrenamiento y MLflow
**Utilidad**: Registrar cada ejecución (parámetros, métricas, artefactos) y asignar un alias (`champion`) para saber qué modelo está en producción. En un equipo, esto elimina la confusión de “¿cuál es el último modelo bueno?”.

### Paso 4 – API FastAPI
**Utilidad**: Pasar del modelo local a un servicio accesible por HTTP. Se aprende a cargar el modelo champion desde el registry y exponer endpoints con documentación automática (Swagger).

### Paso 5 – Dashboard con Next.js
**Utilidad**: Conectar una interfaz de usuario real al modelo. Además, el botón **“Generar curva desde API”** demuestra cómo se puede explorar el comportamiento del modelo de forma interactiva, consultando la API en tiempo real.

### Paso 6 – Docker Compose
**Utilidad**: Preparar el sistema para producción. Levantar todos los servicios (API, frontend, MLflow) con un solo comando garantiza que el entorno de desarrollo refleje el de producción.
---

## Prerrequisitos

- Python 3.11 o superior
- Poetry (gestor de dependencias)
- Git (opcional, pero recomendado)
- Docker y Docker Compose (opcional, para el despliegue completo)
- Node.js 18+ y npm (para el dashboard)

---



## Paso 0: Estructura del proyecto

Crea el directorio del proyecto y la estructura de carpetas:

```bash
mkdir mi_proyecto
cd mi_proyecto
mkdir -p core services interfaces/api utils tests audit data models contracts
poetry init --name mi_proyecto --python "^3.11" --no-interaction
```

Añade las dependencias principales y de desarrollo:

```bash
poetry add fastapi uvicorn scikit-learn pandas numpy mlflow pyarrow
poetry add --group dev pytest
```

La estructura resultante será:

```text
mi_proyecto/
├── core/                  # Lógica estadística pura
├── services/              # Orquestación
├── interfaces/
│   └── api/               # FastAPI
├── utils/                 # Utilidades
├── tests/                 # Pruebas
├── audit/                 # Trazas y logs
├── data/                  # Datos
├── models/                # Artefactos (modelos serializados)
├── contracts/             # Contratos de datos
├── pyproject.toml
└── poetry.lock
```

## Paso 1: Dataset sintético y contrato de datos
### 1.1 Generar datos sintéticos

Crea el archivo data/generate_data.py:

```python
import numpy as np
import pandas as pd

np.random.seed(2026) 
n = 1000 
X1 = np.random.normal(0, 1, n) 
X2 = np.random.normal(0, 1, n) 
noise = np.random.normal(0, 0.5, n) 
y = 3.0 + 2.0 * X1 - 1.5 * X2 + noise

df = pd.DataFrame({"x1": X1, "x2": X2, "y": y})
df.to_csv("data/train.csv", index=False)
print(f"Dataset generado: {len(df)} filas")
```

Ejecuta:

```bash
poetry run python data/generate_data.py
```

### 1.2 Validación de datos con pandas

Crea `contracts/train_contract.py` con validaciones simples pero efectivas:

```python
import pandas as pd


def validate_data(path: str = "data/train.csv") -> pd.DataFrame:
    df = pd.read_csv(path)

    # Esquema: columnas requeridas
    required = {"x1", "x2", "y"}
    assert required.issubset(df.columns), f"Faltan columnas: {required - set(df.columns)}"

    # Sin valores nulos
    assert not df[["x1", "x2", "y"]].isnull().any().any(), "Hay valores nulos"

    # Rangos esperados (3 sigma para N(0,1) con margen)
    assert df["x1"].between(-5, 5).all(), "x1 fuera de rango"
    assert df["x2"].between(-5, 5).all(), "x2 fuera de rango"

    # Tipos numéricos
    for col in ["x1", "x2", "y"]:
        assert pd.api.types.is_numeric_dtype(df[col]), f"{col} no es numérico"

    print(f"Validación exitosa: {len(df)} filas, {len(df.columns)} columnas")
    return df


if __name__ == "__main__":
    validate_data()
```

Ejecuta:

```bash
poetry run python contracts/train_contract.py
```

## Paso 2: Versionado de datos con DVC (opcional)

Si deseas versionar los datos junto con el código, instala DVC y configúralo:

```bash
poetry add dvc
poetry run dvc init
poetry run dvc add data/train.csv
git add data/train.csv.dvc data/.gitignore
git commit -m "Add training data with DVC"
```

## Paso 3: Entrenamiento y registro en MLflow
### 3.1 Iniciar el servidor de MLflow

Abre una terminal (o una pestaña nueva) y ejecuta:

```bash
poetry run mlflow server \
  --host 127.0.0.1 \
  --port 5000 \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlruns
```

### 3.2 Script de entrenamiento

Crea services/train_model.py:

```python
import mlflow
import mlflow.sklearn
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import train_test_split

mlflow.set_tracking_uri("http://127.0.0.1:5000")
mlflow.set_experiment("getting_started")

# Cargar datos
df = pd.read_csv("data/train.csv")
X = df[["x1", "x2"]]
y = df["y"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=2026
)

with mlflow.start_run(run_name="linear_regression_baseline"):
    model = LinearRegression()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    mlflow.log_params({
        "model_type": "linear_regression",
        "features": ["x1", "x2"],
        "test_size": 0.2,
        "random_state": 2026
    })
    mlflow.log_metrics({"rmse": rmse, "r2": r2})

    signature = mlflow.models.infer_signature(X_test, y_pred)
    mlflow.sklearn.log_model(model, "model", signature=signature)

    # Registrar el modelo en el Registry y asignarle el alias "champion"
    model_uri = mlflow.get_artifact_uri("model")
    result = mlflow.register_model(model_uri, "linear_model")

    client = mlflow.tracking.MlflowClient()
    client.set_registered_model_alias("linear_model", "champion", result.version)

    print(f"Modelo registrado: linear_model v{result.version}")
    print(f"RMSE: {rmse:.4f}, R2: {r2:.4f}")
    print(f"Coeficientes: {model.coef_}, Intercepto: {model.intercept_:.4f}")
```

Ejecuta el entrenamiento (en la terminal original, sin cerrar el servidor de MLflow):

```bash
poetry run python services/train_model.py
```

## Paso 4: API REST con FastAPI

Crea el archivo interfaces/api/main.py:

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import mlflow
import pandas as pd

app = FastAPI(title="Statistical API", version="1.0.0")

mlflow.set_tracking_uri("http://127.0.0.1:5000")
MODEL_URI = "models:/linear_model@champion"

try:
    model = mlflow.sklearn.load_model(MODEL_URI)
    print(f"Modelo cargado: {MODEL_URI}")
except Exception as e:
    print(f"Error cargando modelo: {e}")
    model = None

class PredictRequest(BaseModel):
    x1: float = Field(..., description="Feature 1")
    x2: float = Field(..., description="Feature 2")

class PredictResponse(BaseModel):
    prediction: float
    model_version: str

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible")
    X = pd.DataFrame({"x1": [req.x1], "x2": [req.x2]})
    pred = float(model.predict(X)[0])
    return PredictResponse(prediction=round(pred, 4), model_version=MODEL_URI)
```

Levanta la API:

```bash
poetry run uvicorn interfaces.api.main:app --reload --port 8000
```

Prueba el endpoint desde otra terminal:

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"x1": 1.0, "x2": -0.5}'
```

Ejemplo de respuesta:

```json
{
  "prediction": 5.75,
  "model_version": "models:/linear_model@champion"
}
```

## Paso 5: Dashboard con Next.js y Recharts
### 5.1 Crear el proyecto Next.js

Abre una nueva terminal (sin cerrar las anteriores) y ejecuta:

```bash
npx create-next-app@latest dashboard --typescript --tailwind --app --no-src-dir cd dashboard npm install recharts
```

### 5.2 Código del dashboard

Reemplaza el contenido de dashboard/app/page.tsx con:

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PredictionResponse {
  prediction: number;
  model_version: string;
}

export default function Home() {
  const [x1, setX1] = useState(0.0);
  const [x2, setX2] = useState(0.0);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [modelVersion, setModelVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x1, x2 }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const data: PredictionResponse = await res.json();
      setPrediction(data.prediction);
      setModelVersion(data.model_version);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generar gráfico consultando la API real
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const generateChart = async () => {
    // Esta función también se llama automáticamente al montar el componente
    setChartLoading(true);
    const points = [];
    for (let x = -2; x <= 2; x += 0.2) {
      try {
        const res = await fetch("http://127.0.0.1:8000/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ x1: x, x2: 0 }),
        });
        if (res.ok) {
          const data = await res.json();
          points.push({ x: Number(x.toFixed(2)), y: data.prediction });
        }
      } catch {
        // ignorar puntos fallidos
      }
    }
    setChartData(points);
    setChartLoading(false);
  };

  // Auto-cargar la curva al montar el componente
  useEffect(() => {
    generateChart();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">
          Predictor Lineal
        </h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              x1 (feature 1)
            </label>
            <input
              type="number"
              value={x1}
              onChange={(e) => setX1(parseFloat(e.target.value))}
              step="0.1"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              x2 (feature 2)
            </label>
            <input
              type="number"
              value={x2}
              onChange={(e) => setX2(parseFloat(e.target.value))}
              step="0.1"
              className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {loading ? "Prediciendo..." : "Predecir"}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              Error: {error}
            </div>
          )}

          {prediction !== null && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-lg">
                <strong>Predicción:</strong> {prediction.toFixed(4)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Modelo: {modelVersion}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Relación lineal (x2 = 0)
          </h2>
          <button
            onClick={generateChart}
            disabled={chartLoading}
            className="mb-4 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
          >
            {chartLoading ? "Cargando..." : "Regenerar curva desde API"}
          </button>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                label={{ value: "x1", position: "insideBottom" }}
              />
              <YAxis
                label={{ value: "y", angle: -90, position: "insideLeft" }}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="y"
                stroke="#3b82f6"
                name="Predicción real"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}
```

### 5.3 Ejecutar el dashboard

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador. Deberías ver:

- Un formulario para ingresar `x1` y `x2` y obtener la predicción real desde la API.
- La curva de sensibilidad generada automáticamente al cargar la página consultando el endpoint `/predict` para un rango de valores.
- Un botón **"Regenerar curva desde API"** para actualizar el gráfico manualmente.
## Paso 6: Despliegue con Docker Compose (opcional)

Para ejecutar todo el sistema con un solo comando, añade los siguientes archivos.

### 6.1 Dockerfile para la API

Crea Dockerfile en la raíz del proyecto:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml poetry.lock ./
RUN pip install poetry && \
    poetry config virtualenvs.create false && \
    poetry install --no-interaction --no-ansi

COPY . .

EXPOSE 8000

CMD ["uvicorn", "interfaces.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 6.2 Dockerfile para el dashboard

Crea dashboard/Dockerfile:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias (usando ci para entornos CI/CD)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación Next.js
RUN npm run build

# Segunda etapa: imagen de producción
FROM node:18-alpine

WORKDIR /app

# Copiar el build y los archivos necesarios desde la etapa builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production

# Exponer el puerto en el que corre Next.js
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
```

### 6.3 Archivo docker-compose.yml

En la raíz del proyecto (junto al Dockerfile de la API), crea docker-compose.yml:

```yaml
version: "3.9"

services:
  mlflow:
    image: ghcr.io/mlflow/mlflow:latest
    ports:
      - "5000:5000"
    command: >
      mlflow server
      --host 0.0.0.0
      --port 5000
      --backend-store-uri sqlite:///mlflow.db
      --default-artifact-root /mlruns
    volumes:
      - ./mlruns:/mlruns
      - ./mlflow.db:/mlflow.db

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MLFLOW_TRACKING_URI=http://mlflow:5000
    depends_on:
      - mlflow
    volumes:
      - ./data:/app/data
      - ./models:/app/models

  dashboard:
    build: ./dashboard
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_STATS_API_URL=http://api:8000
    depends_on:
      - api
```

Levanta todos los servicios:

```bash
docker-compose up --build
```

Accede a:

- **API**: http://localhost:8000

- **Dashboard**: http://localhost:3000

- **MLflow UI**: http://localhost:5000

## Resumen de Comandos (sin Docker)

```bash
## 1. Generar datos
poetry run python data/generate_data.py

## 2. Validar contrato

poetry run python contracts/train_contract.py

## 3. Iniciar MLflow server (en una terminal aparte)

poetry run mlflow server --host 127.0.0.1 --port 5000 --backend-store-uri sqlite:///mlflow.db

## 4. Entrenar y registrar modelo

poetry run python services/train_model.py

## 5. Levantar API

poetry run uvicorn interfaces.api.main:app --reload --port 8000

## 6. Levantar dashboard (en otra terminal)

cd dashboard && npm run dev
```

## Próximos Pasos

- [Manual Completo](Complete_Manual.md): fundamentos, principios y arquitectura.
- [MLflow y Gestión de Modelos](MLflow.md): tracking avanzado, registro y promociones.
- [Monitoreo de Modelos](Monitoring.md): data drift, métricas operacionales, alertas.
- [Guía de Implementación](Statistical_Systems_Implementation_Guide.md): despliegue avanzado, Celery, rollback.

## Notas Finales
Si encuentras errores de conexión entre el dashboard y la API, verifica que el puerto 8000 esté accesible (en Docker, usa http://api:8000). En desarrollo local, http://127.0.0.1:8000 funciona.

El dataset sintético garantiza resultados deterministas con la semilla fija.

Para reproducir el mismo entrenamiento desde cero, el alias champion siempre apunta a la última versión registrada.

¡Has completado el ciclo completo!
