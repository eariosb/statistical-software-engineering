<div align="center">

  <img src="public/logo-portfolio.svg" width="110" alt="Logo de Ingeniería de Software Estadístico">

  <h1>Ingeniería de Software Estadístico</h1>

  <p>
    <b>El manual open source para llevar modelos estadísticos de R/Python a producción.</b><br>
    MLOps · DataOps · Shiny · Monitoreo · Gobernanza, escrito en español 🇪🇸🇨🇴
  </p>

  <p>
    <a href="https://statistical-software-engineering.vercel.app"><b>📖 Sitio en vivo</b></a> ·
    <a href="README.md">🇬🇧 English README</a> ·
    <a href="CONTRIBUTING.md">Cómo contribuir</a> ·
    <a href="#-roadmap">Roadmap</a>
  </p>

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/licencia-MIT%20%2B%20CC%20BY--SA%204.0-blue.svg" alt="Licencia: MIT + CC BY-SA 4.0"></a>
    <a href="https://github.com/eariosb/statistical-software-engineering/actions/workflows/ci.yml"><img src="https://github.com/eariosb/statistical-software-engineering/actions/workflows/ci.yml/badge.svg" alt="Estado CI"></a>
    <a href="https://statistical-software-engineering.vercel.app"><img src="https://img.shields.io/badge/desplegado%20en-Vercel-black?logo=vercel" alt="Desplegado en Vercel"></a>
    <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-bienvenidos-brightgreen.svg" alt="PRs bienvenidos"></a>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/hecho%20con-Next.js%2016-000000?logo=nextdotjs" alt="Hecho con Next.js"></a>
  </p>

</div>

---

## Por qué existe este manual

A la mayoría de estadísticos y científicos de datos nunca nos enseñaron a poner modelos en producción: cómo versionarlos, probarlos, desplegarlos, monitorearlos o revertirlos cuando fallan. Los recursos que existen están dispersos en decenas de blogs, y casi ninguno está en español.

Este manual cierra esa brecha: una referencia única, opinada y de extremo a extremo que te lleva desde un modelo estadístico en R o Python hasta un producto de datos gobernado, monitoreado y listo para producción.

## Qué encontrarás

| Sección | Qué aprenderás |
|---|---|
| [Fundamentos](https://statistical-software-engineering.vercel.app/docs/Statistical_Software_Principles) | Principios del software estadístico, arquitectura en capas y una [guía práctica de 30 minutos](https://statistical-software-engineering.vercel.app/docs/Getting_Started) |
| [Implementación técnica](https://statistical-software-engineering.vercel.app/docs/Statistical_Systems_Implementation_Guide) | Implementación de sistemas, [MLflow y registro de modelos](https://statistical-software-engineering.vercel.app/docs/MLflow), [Feature Stores](https://statistical-software-engineering.vercel.app/docs/Feature_Store) |
| [DataOps y gobernanza](https://statistical-software-engineering.vercel.app/docs/DataOps_Statistical_Engineering) | Pipelines DataOps y marcos de [gobernanza de datos](https://statistical-software-engineering.vercel.app/docs/Data_Governance) |
| [Monitoreo y seguridad](https://statistical-software-engineering.vercel.app/docs/Monitoring) | Monitoreo de modelos, detección de drift, [gestión de secretos con Vault](https://statistical-software-engineering.vercel.app/docs/Secrets_Management) |
| [Operaciones y calidad](https://statistical-software-engineering.vercel.app/docs/Deployment_Guide) | Despliegue con CI/CD + Docker, [rollback de modelos](https://statistical-software-engineering.vercel.app/docs/Rollback), [pruebas de integración](https://statistical-software-engineering.vercel.app/docs/Integration_Tests) y el [checklist de compliance MLOps](https://statistical-software-engineering.vercel.app/docs/MLOps_Compliance_Checklist) |
| [Visualización y UI](https://statistical-software-engineering.vercel.app/docs/Shiny_Best_Practices) | Buenas prácticas Shiny, dashboards en React y [UX/UI para productos de datos](https://statistical-software-engineering.vercel.app/docs/UX_UI) |
| [Cultura y habilidades](https://statistical-software-engineering.vercel.app/docs/Data_Culture) | Cultura de datos, microagentes y skills de IA |
| [Estrategia](https://statistical-software-engineering.vercel.app/docs/Roadmap) | Roadmap de madurez y resolución estructurada de problemas |

**¿No sabés por dónde empezar?** → [Empieza aquí](https://statistical-software-engineering.vercel.app/start-here), rutas guiadas para estadísticos, ingenieros de datos y estudiantes.

## Una muestra del contenido

Cinco reglas destiladas del [Checklist de Compliance MLOps](https://statistical-software-engineering.vercel.app/docs/MLOps_Compliance_Checklist):

> - Toda versión de modelo es reproducible desde código, datos y entorno versionados.
> - Todo modelo en producción tiene un responsable registrado y un plan de rollback documentado.
> - La validación de datos corre *antes* del entrenamiento, nunca entrenes con datos sin validar.
> - Las métricas de drift tienen umbrales explícitos conectados a alertas, no a dashboards que nadie mira.
> - Los secretos nunca viven en el código ni en notebooks; viven en un vault.

## Demo

<!-- TODO: reemplazar con un GIF de 10-15s (buscador + modo oscuro + diagramas Mermaid) -->
![Demo: navegando el manual](docs/demo.gif)

O simplemente visita el **[sitio en vivo](https://statistical-software-engineering.vercel.app)**, con buscador de texto completo, modo oscuro y diagramas Mermaid.

## Inicio rápido

Ejecuta el manual en local (Node.js ≥ 20.9):

```bash
git clone https://github.com/eariosb/statistical-software-engineering.git
cd statistical-software-engineering
npm install
npm run dev
```

Abre `http://localhost:3000`. Para generar el export estático (`out/`):

```bash
npm run build
```

## 🗺 Roadmap

- [ ] Traducción al inglés de las tres secciones núcleo (checklist MLOps, Shiny, CI/CD)
- [ ] Ejemplo práctico de Feature Store con Feast
- [ ] Guía de despliegue de modelos bayesianos (Stan/brms → API)
- [ ] Edición PDF descargable del manual completo
- [ ] Casos de estudio de sistemas reales en producción

## Cómo contribuir

Las contribuciones son bienvenidas, el contenido (correcciones, ejemplos, traducciones) importa tanto como el código. Revisa los [good first issues](https://github.com/eariosb/statistical-software-engineering/labels/good%20first%20issue) y la [guía de contribución](CONTRIBUTING.md).

## Licencia

El código está bajo licencia [MIT](LICENSE). El contenido del manual en `content/` está bajo [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.es).

---

<div align="center">

*Si este manual te ahorra tiempo, una ⭐ ayuda a que otros lo encuentren.*

</div>
