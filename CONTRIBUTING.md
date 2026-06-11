# Guía de Contribución

Gracias por contribuir a este proyecto de ingeniería de software estadístico. Esta guía cubre todo lo necesario para añadir o modificar documentación sin romper la estructura existente.

Al participar aceptas nuestro [Código de Conducta](CODE_OF_CONDUCT.md).

---

## 0. Cómo contribuir contenido (no solo código)

Este es un proyecto de **conocimiento**: las contribuciones de contenido valen tanto o más que las de código. No necesitas saber Next.js ni TypeScript para aportar. Formas de contribuir contenido:

- **Corregir errores** en el manual: erratas, conceptos imprecisos, enlaces rotos, código que no ejecuta. Usa la plantilla de issue [Reportar error en el contenido](.github/ISSUE_TEMPLATE/reportar_error_contenido.md).
- **Proponer un tema nuevo**: ¿falta una sección sobre algo que dominas (p. ej. Airflow, dbt, modelos bayesianos en producción)? Usa la plantilla [Proponer tema](.github/ISSUE_TEMPLATE/proponer_tema.md) antes de escribir, para alinear el enfoque.
- **Ampliar una sección existente** con ejemplos ejecutables, casos reales o referencias.
- **Traducir secciones al inglés**: crea el archivo como `content/en/Nombre_Seccion.md` (misma estructura que el original). Empieza por las marcadas como `good first issue`.
- **Revisar PRs de contenido**: comentar con criterio técnico también es contribuir.

Si es tu primera contribución, busca los issues etiquetados [`good first issue`](https://github.com/eariosb/statistical-software-engineering/labels/good%20first%20issue).

### Licencia de tus contribuciones (licencia dual)

Este repositorio usa licencia dual (ver [LICENSE](LICENSE)):

- El **código** (`app/`, `components/`, `lib/`, `scripts/`, configuración) está bajo **MIT**.
- El **contenido del manual** (`content/`) está bajo **CC BY-SA 4.0**.

Al enviar un PR aceptas que tu aporte se publique bajo la licencia que corresponda según su ubicación: MIT para código, CC BY-SA 4.0 para contenido. CC BY-SA garantiza que el manual y sus derivados permanezcan siempre abiertos, exigiendo atribución a sus autores (tú incluido: tu nombre queda en el historial de Git y en la sección de contribuyentes).

---

## 1. Cómo añadir un nuevo documento Markdown

1. Crea el archivo en `content/` con el nombre en `PascalCase`, por ejemplo `content/Mi_Nuevo_Tema.md`.
2. Abre `navigation.json` en la raíz del proyecto y añade una entrada al grupo correspondiente:

```json
{ "title": "Mi Nuevo Tema", "slug": "Mi_Nuevo_Tema" }
```

3. El `slug` debe coincidir exactamente con el nombre del archivo sin extensión.
4. Verifica que la app siga compilando: `npm run build`.

---

## 2. Convenciones de formato Markdown

- **Listas**: usa `-` para ítems de lista. No uses `◦`, `•` ni numeración automática cuando el orden no importa.
- **Bloques de código**: usa triple backtick con el lenguaje especificado:

  ````markdown
  ```python
  import pandas as pd
  ```
  ````

  Nunca dejes el lenguaje en blanco (```` ``` ```` sin especificar).

- **Tablas**: usa el formato estándar de Markdown con tuberías `|`. Incluye la fila de separación (`|---|---|`).
- **Líneas en blanco**: deja siempre una línea en blanco antes y después de un encabezado, lista o bloque de código.
- **Longitud de línea**: máximo 120 caracteres por línea en texto narrativo (no aplica a código).
- **Negrita**: usa `**texto**` con doble asterisco, no guiones bajos `__texto__`.

### Encabezados

- El título principal es `# H1` (uno por documento).
- Las secciones usan `## H2` y las subsecciones `### H3`.
- No saltes niveles (de `##` a `####`).

---

## 3. Uso de Mermaid

- Prefiere `flowchart TB` (top-to-bottom) sobre `LR` salvo que el diagrama sea explícitamente horizontal.
- No uses `<br>` dentro de etiquetas de nodos; usa una descripción concisa en una sola línea.
- Usa comillas dobles en etiquetas que contengan espacios o caracteres especiales:

  ```mermaid
  flowchart TB
      A["Inicio del pipeline"] --> B["Validación de datos"]
      B --> C["Entrenamiento"]
  ```

- Evita nodos con más de ~60 caracteres; si el texto es largo, divídelo en dos nodos.

---

## 4. Estándares para bloques de código Python y R

Cada bloque de código debe indicar al inicio si es ejecutable o ilustrativo:

```python
# (ejemplo ejecutable)
import pandas as pd
df = pd.DataFrame({"x": [1, 2, 3]})
print(df.head())
```

```python
# (fragmento ilustrativo, no ejecutable)
# Requiere: modelo entrenado y X_test definidos previamente
y_pred = model.predict(X_test)
```

Para bloques ejecutables:

- T