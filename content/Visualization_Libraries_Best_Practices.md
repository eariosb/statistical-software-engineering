# Buenas Prácticas y Librerías para Visualización Estadística en R y Python

## Introducción

La visualización de datos estadísticos es parte esencial de la comunicación de resultados. Un gráfico bien construido revela patrones, cuantifica la incertidumbre y guía la decisión, dando a entender el significado de los datos. Esta sección recoge las librerías de referencia, las prácticas recomendadas y los trucos de experto para generar visualizaciones estadísticas de alta calidad en R y Python, alineadas con los principios de ingeniería de software estadístico del proyecto.

---

## 1. Principios de visualización estadística (resumen)

- **Comunicar incertidumbre:** intervalos de confianza/credibilidad, bandas de error, distribuciones completas.

- **Jerarquía de la información:** destacar el mensaje principal (KPI, tendencia) sobre los detalles.

- **Contexto:** siempre incluir referencia temporal, comparación con objetivo o benchmark.

- **Accesibilidad:** paletas aptas para daltónicos, contraste suficiente, texto alternativo.

- **Simplicidad funcional:** eliminar elementos decorativos, maximizar la relación datos-tinta.

---

## 2. Librerías de referencia por lenguaje

### 2.1 R

| Librería | Enfoque | Características clave | Cuándo usarla |
| --- | --- | --- | --- |
| **ggplot2** | Gramática de gráficos | Capas, temas, estadísticos, escalas, facetas. | Base de cualquier gráfico estadístico. |
| **ggplot2 extensions** | Extensiones temáticas | `ggridges`, `ggdist`, `ggrepel`. | Gráficos especializados (distribuciones, posterior predictivo, etiquetas). |
| **plotly** | Interactividad | Convierte ggplot2 a interactivo (`ggplotly()`), tooltips, zoom. | Dashboards y exploración. |
| **patchwork** | Composición | Une múltiples gráficos con sintaxis simple (`plot1 + plot2`). | Paneles comparativos. |
| **gganimate** | Animación | Transiciones suaves entre frames. | Series temporales, evolución de distribuciones. |
| **bayesplot** | Diagnóstico bayesiano | Trazas, densidades posteriores, intervalos, R-hat. | Modelos MCMC. |
| **ggforce** | Geometrías avanzadas | Paralel coordinates, arcos, zoom en regiones. | Visualizaciones complejas. |

### 2.2 Python

| Librería | Enfoque | Características clave | Cuándo usarla |
| --- | --- | --- | --- |
| **matplotlib** | Base | Control total sobre elementos, estilo OO. | Gráficos personalizados y ejes complejos. |
| **seaborn** | Estadística | Integración con pandas, regresión, distribuciones, correlaciones. | Análisis exploratorio rápido. |
| **plotly** | Interactividad | Dashboards, 3D, mapas, animaciones, exportación HTML. | Entregas a usuarios finales y exploración interactiva. |
| **altair** | Declarativo (Vega-Lite) | Gráficos óptimos según tipo de datos. | Prototipado rápido, coherencia multiplataforma. |
| **bokeh** | Web interactivo | Streaming, herramientas de selección, linkage. | Aplicaciones web con grandes volúmenes. |
| **arviz** | Bayesiano | Visualización de posteriores, R-hat, ESS, traza, HDI. | Análisis de modelos bayesianos (PyMC, Stan). |
| **proplot** | Matplotlib mejorado | Paletas agradables, subplots simples, etiquetado LaTeX. | Alternativa más elegante a matplotlib puro. |

---

## 3. Prácticas recomendadas para gráficos estadísticos comunes

### 3.1 Distribuciones (histograma, densidad, boxplot)

| Aspecto | R (ggplot2) | Python (seaborn) |
| --- | --- | --- |
| **Histograma con densidad** | `geom_histogram(aes(y = ..density..)) + geom_density()` | `sns.histplot(..., kde=True)` |
| **Boxplot + violin** | `geom_boxplot() + geom_violin(alpha = 0.3)` | `sns.violinplot(..., inner="box")` |
| **Distribución marginal** | `ggExtra::ggMarginal()` | `sns.jointplot(kind="scatter", marginal_kws=...)` |

**Truco de experto:** comparar múltiples distribuciones con `geom_density_ridges()` o `sns.kdeplot(hue=..., common_norm=False)` con transparencia.

### 3.2 Series temporales con incertidumbre

| Elemento | R (ggplot2 + lubridate) | Python (matplotlib + pandas) |
| --- | --- | --- |
| **Banda de confianza** | `geom_ribbon(aes(ymin=lower, ymax=upper), alpha=0.3)` | `plt.fill_between(x, lower, upper, alpha=0.3)` |
| **Línea mediana** | `geom_line(aes(y=median))` | `plt.plot(x, median, lw=2)` |
| **Estacionalidad** | `facet_wrap(~ lubridate::month(date))` | `sns.lineplot(data=df, x="date", y="value", hue="month")` |

### 3.3 Modelos bayesianos – Distribuciones posteriores

| R (bayesplot) | Python (arviz) |
| --- | --- |
| `mcmc_areas(fit, pars = c("beta1","beta2"))` | `az.plot_posterior(trace, var_names=["beta1","beta2"])` |
| `mcmc_trace(fit, pars = "beta1")` | `az.plot_trace(trace, var_names=["beta1"])` |
| `mcmc_intervals(fit, pars = c("beta1","beta2"))` | `az.plot_forest(trace, var_names=["beta1","beta2"])` |

### 3.4 Matriz de correlación (heatmap)

| R | Python |
| --- | --- |
| `corrplot::corrplot(cor(df), method = "color", type = "upper")` | `sns.heatmap(df.corr(), annot=True, cmap="RdBu_r", center=0)` |

**Mejora:** ordenar las variables con clustering jerárquico (`ggcorrplot(..., hc.order = TRUE)`).

---

## 4. Trucos de experto para elevar la calidad profesional

| Área | Técnica | Ejemplo / Librería |
| --- | --- | --- |
| **Temas predefinidos** | Mantener consistencia con `theme_minimal()` / `sns.set_style("whitegrid")`. | `ggplot2::theme_set(theme_minimal())` |
| **Paletas de color** | Usar paletas aptas para daltónicos: `scale_fill_viridis_c()` / `sns.color_palette("viridis")`. | [ColorBrewer](https://colorbrewer2.org), `wesanderson`. |
| **Anotaciones** | Etiquetar líneas directamente con `geom_label_repel` o `plotly textposition`. | `plotly` `textposition`. |
| **Formato de ejes** | Escalas logarítmicas y formatos de porcentaje (`scales::percent`). | `scale_y_continuous(labels = scales::percent)` |
| **Tamaño de texto** | Títulos >14pt, ejes >10pt, etiquetas >8pt para impresión. | `theme(text = element_text(size = 12))`. |
| **Transparencia** | Alpha blending para densidad (`alpha=0.1`). | `geom_point(alpha = 0.1)` o `sns.scatterplot(alpha = 0.1)`. |
| **Cacheo** | Cachear objetos de ggplot/dash para evitar re-render en apps. | Shiny: `bindCache()`, Dash: callbacks con `cache`. |

---

## 5. Optimización de rendimiento para grandes volúmenes de datos

| Técnica | R | Python |
| --- | --- | --- |
| **Muestreo aleatorio** | `sample_frac(0.1)` antes de graficar. | `df.sample(frac=0.1)` |
| **Agregación previa** | Calcular media, IQR y graficar solo estadísticos. | `df.groupby().agg(...)` |
| **Hexbin** | `geom_hex()` para densos scatter. | `plt.hexbin(x, y, gridsize=20)` |
| **Canvas/WebGL** | Usar `plotly` con modo `gl` en shiny (plotly no usa canvas en ggplot). | `plotly` `scattergl`, `scattermapbox`. |

---

## 6. Recursos de alto valor

### Libros

- **R Graphics Cookbook** – Winston Chang (2ª ed., 2018)

- **ggplot2: Elegant Graphics for Data Analysis** – Hadley Wickham (3ª ed., 2021)

- **Fundamentals of Data Visualization** – Claus O. Wilke (2019)

- **Python Data Science Handbook** – Jake VanderPlas (2022)

- **Interactive Data Visualization for the Web** – Scott Murray (2017)


### Galerías y documentación

- [R Graph Gallery](https://r-graph-gallery.com)

- [Python Graph Gallery](https://python-graph-gallery.com)

- [Plotly Express Gallery](https://plotly.com/python/plotly-express)

- [Seaborn examples](https://seaborn.pydata.org/examples)

- [From Data to Viz](https://www.data-to-viz.com)

---

## 7. Checklist para una visualización estadística profesional

- [ ] El gráfico responde a una pregunta clara y está anotado con la respuesta.
- [ ] La incertidumbre está cuantificada (intervalos, bandas, densidades).
- [ ] Las escalas son apropiadas (cero en barras, log si procede).
- [ ] La paleta de colores es accesible y semántica.
- [ ] Las etiquetas son legibles (tamaño, contraste) y evitan redundancias.
- [ ] El gráfico funciona en modo claro/oscuro si se requiere.
- [ ] El código es reproducible (semillas fijas, versions de librerías documentadas).
- [ ] El gráfico se exporta en formato vectorial cuando se necesita alta calidad.

---

> *“Un buen gráfico vale más que mil palabras, pero un gráfico excelente permite tomar la decisión correcta.”*
