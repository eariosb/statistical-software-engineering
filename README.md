<div align="center">

  <img src="public/logo-portfolio.svg" width="110" alt="Statistical Software Engineering logo">

  <h1>Statistical Software Engineering</h1>

  <p>
    <b>The open-source handbook for taking statistical models from R/Python to production.</b><br>
    MLOps · DataOps · Shiny · Monitoring · Governance, written in Spanish
  </p>

  <p>
    <a href="https://statistical-software-engineering.vercel.app"><b>📖 Live site</b></a> ·
    <a href="README.es.md">🇪🇸 Versión en español</a> ·
    <a href="CONTRIBUTING.md">Contributing</a> ·
    <a href="#-roadmap">Roadmap</a>
  </p>

  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT%20%2B%20CC%20BY--SA%204.0-blue.svg" alt="License: MIT + CC BY-SA 4.0"></a>
    <a href="https://github.com/eariosb/statistical-software-engineering/actions/workflows/ci.yml"><img src="https://github.com/eariosb/statistical-software-engineering/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
    <a href="https://statistical-software-engineering.vercel.app"><img src="https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel" alt="Deployed on Vercel"></a>
    <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome"></a>
    <a href="https://nextjs.org"><img src="https://img.shields.io/badge/made%20with-Next.js%2016-000000?logo=nextdotjs" alt="Made with Next.js"></a>
  </p>

</div>

---

## Why this exists

Most statisticians and data scientists are never taught how to ship their models: how to version them, test them, deploy them, monitor them, or roll them back when they fail. The resources that do exist are fragmented across dozens of blogs, and almost none are available in Spanish.

This handbook bridges that gap. It is a single, opinionated, end-to-end reference that takes you from a statistical model in R or Python to a governed, monitored, production-grade data product.

## What's inside

| Section | What you'll learn |
|---|---|
| [Fundamentals](https://statistical-software-engineering.vercel.app/docs/Statistical_Software_Principles) | Principles of statistical software, layered architecture, a [30-minute hands-on guide](https://statistical-software-engineering.vercel.app/docs/Getting_Started) |
| [Technical implementation](https://statistical-software-engineering.vercel.app/docs/Statistical_Systems_Implementation_Guide) | System implementation, [MLflow & model registry](https://statistical-software-engineering.vercel.app/docs/MLflow), [Feature Stores](https://statistical-software-engineering.vercel.app/docs/Feature_Store) |
| [DataOps & governance](https://statistical-software-engineering.vercel.app/docs/DataOps_Statistical_Engineering) | DataOps pipelines, [data governance](https://statistical-software-engineering.vercel.app/docs/Data_Governance) frameworks |
| [Monitoring & security](https://statistical-software-engineering.vercel.app/docs/Monitoring) | Model monitoring, drift detection, [secrets management with Vault](https://statistical-software-engineering.vercel.app/docs/Secrets_Management) |
| [Operations & quality](https://statistical-software-engineering.vercel.app/docs/Deployment_Guide) | CI/CD + Docker deployment, [model rollback](https://statistical-software-engineering.vercel.app/docs/Rollback), [integration testing](https://statistical-software-engineering.vercel.app/docs/Integration_Tests), [MLOps compliance checklist](https://statistical-software-engineering.vercel.app/docs/MLOps_Compliance_Checklist) |
| [Visualization & UI](https://statistical-software-engineering.vercel.app/docs/Shiny_Best_Practices) | Shiny best practices, React dashboards, [UX/UI for data products](https://statistical-software-engineering.vercel.app/docs/UX_UI) |
| [Culture & skills](https://statistical-software-engineering.vercel.app/docs/Data_Culture) | Data culture, AI micro-agents and skills |
| [Strategy](https://statistical-software-engineering.vercel.app/docs/Roadmap) | Maturity roadmap, structured problem solving |

**Not sure where to begin?** → [Start here](https://statistical-software-engineering.vercel.app/start-here), guided paths for statisticians, data engineers, and students.

## A taste of the content

Five rules, distilled from the [MLOps Compliance Checklist](https://statistical-software-engineering.vercel.app/docs/MLOps_Compliance_Checklist):

> - Every model version is reproducible from versioned code, data, and environment.
> - Every production model has a registered owner and a documented rollback plan.
> - Data validation runs *before* training, never train on unvalidated data.
> - Drift metrics have explicit thresholds tied to alerts, not dashboards nobody watches.
> - Secrets never live in code or notebooks; they live in a vault.

## Demo

<!-- TODO: replace with a 10-15s GIF (search + dark mode + Mermaid diagrams) -->
![Demo: navigating the handbook](docs/demo.gif)

Or just browse the **[live site](https://statistical-software-engineering.vercel.app)**, full-text search, dark mode, and Mermaid diagrams included.

## Quick start

Run the handbook locally (Node.js ≥ 20.9):

```bash
git clone https://github.com/eariosb/statistical-software-engineering.git
cd statistical-software-engineering
npm install
npm run dev
```

Open `http://localhost:3000`. To produce the static export (`out/`):

```bash
npm run build
```

## 🗺 Roadmap

- [ ] English translations of the three core sections (MLOps checklist, Shiny, CI/CD)
- [ ] Feature Store hands-on example with Feast
- [ ] Bayesian model deployment guide (Stan/brms → API)
- [ ] Downloadable PDF edition of the full handbook
- [ ] Case studies from real production systems

## Contributing

Contributions are welcome, content (fixes, examples, translations) matters as much as code. Check the [good first issues](https://github.com/eariosb/statistical-software-engineering/labels/good%20first%20issue) and read the [contributing guide](CONTRIBUTING.md) (in Spanish, like the handbook).

## License

Code is licensed under [MIT](LICENSE). The handbook content in `content/` is licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

---

<div align="center">

### 🇪🇸 Versión en español

Este es un manual open source de **ingeniería de software estadístico**: cómo llevar modelos de R/Python a producción con MLOps, DataOps, Shiny, monitoreo y gobernanza. Todo el contenido está escrito en español.

**[Leer el README en español →](README.es.md)** · **[Visitar el sitio →](https://statistical-software-engineering.vercel.app)**

<br>

*If this handbook saves you time, a ⭐ helps others find it.*

</div>
