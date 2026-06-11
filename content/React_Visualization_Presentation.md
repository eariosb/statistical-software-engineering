# Presentación y Visualización de Resultados Estadísticos en React / Next.js

## Introducción

El frontend de un producto estadístico es la interfaz donde los datos se materializan en decisiones. Un dashboard o informe interactivo mal diseñado puede arruinar incluso el modelo más preciso. Esta sección reúne las mejores prácticas, librerías recomendadas y trucos de experto para construir visualizaciones estadísticas de alto rendimiento, accesibles y estéticamente sólidas en aplicaciones React y Next.js.

---

## 1. Principios de visualización estadística en frontend

- **Comunicar incertidumbre**: Nunca mostrar solo una estimación puntual. Siempre acompañar de intervalos de confianza / credibilidad, bandas de error o distribuciones completas.

- **Jerarquía de la información**: El KPI principal debe ser evidente (posición superior izquierda, tamaño, color). Los detalles deben estar accesibles mediante drill-down o pestañas.

- **Contexto siempre presente**: Cada número debe ir acompañado de su referencia: vs. objetivo, vs. período anterior, vs. tendencia histórica.

- **Reducir la carga cognitiva**: Usar paletas de colores consistentes (verde = bueno, rojo = malo, azul = neutral), eliminar ruido visual, minimizar la leyenda.

- **Accesibilidad**: Cumplir WCAG 2.1 AA (contraste mínimo 4.5:1, navegación por teclado, texto alternativo). Usar patrones/texturas además del color.

- **Rendimiento**: Renderizar solo los datos visibles, evitar recálculos innecesarios (memorización, cliente-side cache, Web Workers para agregaciones pesadas).

---

## 2. Librerías de alta calidad para gráficos estadísticos en React

| Librería | Tipo | Fortalezas | Cuándo usarla |
| --- | --- | --- | --- |
| **Recharts** | React nativa (SVG) | Simple, componible, buena documentación, tooltips/leyendas animadas. | Dashboards empresariales, líneas, barras, áreas, radar. |
| **Visx (Airbnb)** | React + D3 | Componentes de bajo nivel altamente personalizables. | Visualizaciones científicas, ejes complejos, anotaciones. |
| **Plotly.js + react-plotly.js** | WebGL / SVG | Interactividad avanzada (zoom, pan, selección), boxplots, histograms. | Exploración, grandes volúmenes de datos, 3D. |
| **Vega-Lite / Vega** | Declarativo (JSON) | Generación automática de gráficos óptimos; react-vega. | Prototipado rápido, coherencia multiplataforma. |
| **Nivo** | React nativa | Completo (treemap, sankey, calendarios), temas y responsividad. | Visualizaciones poco comunes o con tema unificado. |
| **ECharts (Apache) + echarts-for-react** | Canvas / WebGL | Excelente rendimiento, mapas y time series en tiempo real. | Series largas (>10k puntos), monitoreo en tiempo real. |

**Recomendación:** comienza con **Recharts** para dashboards estándar. Usa **Plotly.js** cuando necesites gráficos estadísticos especializados o mapas, y **Visx** para componentes altamente personalizados.

---

## 3. Componentes esenciales para dashboards estadísticos

### 3.1 KPI card con tendencia e incertidumbre

```tsx
interface KPIProps {
  value: number;
  lower: number;
  upper: number;
  previousValue?: number;
  title: string;
}

export function KPI({ value, lower, upper, previousValue, title }: KPIProps) {
  const delta = previousValue ? ((value - previousValue) / previousValue) * 100 : null;
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value.toFixed(2)}</p>
      <p className="text-xs text-gray-400">
        Intervalo [{lower.toFixed(2)}, {upper.toFixed(2)}]
      </p>
      {delta !== null && (
        <p className={`text-xs ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% vs periodo anterior
        </p>
      )}
    </div>
  );
}
```

### 3.2 Gráfico de series temporales con banda de incertidumbre

```tsx
import {
  LineChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface DataPoint {
  date: string;
  median: number;
  lower: number;
  upper: number;
}

export function TimeSeriesWithUncertainty({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="upper" stroke="none" fill="#8884d8" fillOpacity={0.3} />
        <Area type="monotone" dataKey="lower" stroke="none" fill="#8884d8" fillOpacity={0.3} />
        <Line type="monotone" dataKey="median" stroke="#8884d8" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### 3.3 Distribución posterior (histograma o densidad)

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface HistogramBin {
  binStart: number;
  binEnd: number;
  count: number;
}

export function PosteriorHistogram({ bins }: { bins: HistogramBin[] }) {
  const data = bins.map((b) => ({
    name: `${b.binStart.toFixed(2)}-${b.binEnd.toFixed(2)}`,
    count: b.count,
  }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

### 3.4 Matriz de correlación (heatmap)

Para heatmaps complejos, Plotly.js es preferible:

```tsx
import Plot from 'react-plotly.js';

function CorrelationHeatmap({ matrix, variables }: { matrix: number[][]; variables: string[] }) {
  return (
    <Plot
      data={[
        {
          z: matrix,
          x: variables,
          y: variables,
          type: 'heatmap',
          colorscale: 'RdBu',
          zmin: -1,
          zmax: 1,
        },
      ]}
      layout={{ width: 600, height: 500, title: 'Matriz de correlación' }}
    />
  );
}
```

---

## 4. Gestión de color y paletas profesionales

### 4.1 Principios

- **Secuencial:** una sola tonalidad de azul para datos ordenados (rentabilidad, temperatura).
- **Divergente:** dos tonalidades con centro en 0 o referencia (rojo-blanco-azul para residuos).
- **Cualitativo:** paletas de alto contraste (Tableau 10, Set2) para segmentos.
- **Accesible:** `viridis`, `plasma`, `cividis` para usuarios daltónicos.

### 4.2 Paletas recomendadas

| Propósito | Paleta | Uso |
| --- | --- | --- |
| Datos secuenciales | `Blues` (Recharts / Plotly) | Rentabilidad, concentración. |
| Datos divergentes | `RdBu` | Correlaciones, desviaciones. |
| Categorías | `Tableau 10`, `Set2` | Segmentos de clientes, regiones. |
| Daltónicos | `viridis`, `plasma`, `cividis` | Mapas de calor, superficies. |
| Neutral | grises (`slate`, `zinc`) | Grids, ejes, textos. |

### 4.3 Implementación en Tailwind + Recharts

```tsx
import colors from 'tailwindcss/colors';

<Line stroke={colors.blue[500]} />
<Area fill={colors.blue[500]} fillOpacity={0.3} />
```

Para paletas divergentes en Plotly:

```js
colorscale: [
  [0, 'rgb(165,0,38)'],
  [0.5, 'rgb(255,255,255)'],
  [1, 'rgb(0,104,55)'],
]
```

### 4.4 Herramientas para generar paletas

- [ColorBrewer](https://colorbrewer2.org)
- [Viz Palette](https://projects.susielu.com/viz-palette)
- [Huemint](https://huemint.com)

---

## 5. Trucos de experto para dashboards de alto rendimiento

| Técnica | Descripción | Ejemplo / librería |
| --- | --- | --- |
| Virtualización de gráficos | Renderizar solo los puntos visibles en series largas (>5k). | `react-visx` con Voronoi, `echarts` con dataZoom. |
| Memorización de componentes | Evitar re-renders usando `React.memo` y `useCallback`. | `React.memo(MyChart, arePropsEqual)`. |
| Caché de consultas | Guardar resultados de modelos para evitar refetch. | `react-query`, `swr`. |
| Web Workers para agregaciones | Calcular estadísticas fuera del hilo principal. | `worker-loader`, `comlink`. |
| Debounce en controles | Retrasar actualizaciones mientras el usuario escribe/arrastra. | Hook `useDebounce`. |
| Lazy loading | Cargar gráficos complejos solo cuando entran al viewport. | `react-lazyload`, `IntersectionObserver`. |
| SVG vs Canvas | SVG para <1000 elementos; Canvas para volúmenes masivos. | Recharts (SVG), Plotly (Canvas). |

**Ejemplo de debounce:**

```tsx
const [value, setValue] = useState(100);
const debouncedValue = useDebounce(value, 300);

useEffect(() => {
  // Refrescar datos cuando cambie debouncedValue
}, [debouncedValue]);
```

---

## 6. Accesibilidad y usabilidad

- Contraste: texto sobre fondos de gráficos debe cumplir 4.5:1 y usar ejes suaves (#e2e8f0).
- Tooltips informativos: mostrar significados (percentil, intervalo).
- Teclado: permitir navegación (tabs, focus visible) y accesos alternativos (descripciones resumidas).
- Color no único: usar patrones o etiquetas directas en lugar de depender solo del color.
- Texto alternativo: describir tendencias principales con `aria-label`.

```tsx
<div role="img" aria-label="Gráfico de ventas por mes: pico en junio con 120k, mínimo en febrero con 80k">
  <LineChart ... />
</div>
```

---

## 7. Caso práctico: Dashboard de predicción con intervalo de credibilidad

```tsx
"use client";
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { predict } from '@/lib/statistical-api';

export default function PredictionDashboard() {
  const [x1, setX1] = useState(1);
  const [x2, setX2] = useState(0);
  const [prediction, setPrediction] = useState<{ median: number; lower: number; upper: number } | null>(null);

  const handlePredict = async () => {
    const res = await predict({ x1, x2 });
    setPrediction({ median: res.prediction, lower: res.prediction - 0.2, upper: res.prediction + 0.2 });
  };

  const sensitivity = [
    { x: -2, y: 3.2 },
    { x: -1, y: 4.5 },
    { x: 0, y: 5.8 },
    { x: 1, y: 7.1 },
    { x: 2, y: 8.4 },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-2 gap-4">
        <input type="number" value={x1} onChange={(e) => setX1(+e.target.value)} placeholder="x1" />
        <input type="number" value={x2} onChange={(e) => setX2(+e.target.value)} placeholder="x2" />
        <button onClick={handlePredict} className="col-span-2 bg-blue-600 text-white p-2">
          Predecir
        </button>
      </div>

      {prediction && (
        <div className="mt-6 p-4 border rounded">
          <p>Predicción: {prediction.median.toFixed(4)}</p>
          <p>Intervalo 95%: [{prediction.lower.toFixed(4)}, {prediction.upper.toFixed(4)}]</p>
          <div className="mt-4">
            <h3>Sensibilidad a x1 (fijando x2=0)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sensitivity}>
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="y" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 8. Recursos y referencias de alto valor

| Recurso | Descripción | Enlace |
| --- | --- | --- |
| Recharts examples | Galería oficial de ejemplos | https://recharts.org |
| Plotly.js statistical charts | Boxplots, histograms, violin plots | https://plotly.com/charts |
| ColorBrewer | Paletas profesionales | https://colorbrewer2.org |
| Visx gallery | Componentes reutilizables basados en D3 | https://airbnb.io/visx |
| Nivo examples | Componentes listos para usar | https://nivo.rocks |
| ECharts handbook | Documentación oficial | https://echarts.apache.org |

---


> “El mejor gráfico no es el más bonito, sino el que responde a la pregunta correcta y muestra la incertidumbre sin abrumar.”
