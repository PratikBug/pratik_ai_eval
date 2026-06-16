import { Link } from "react-router-dom";
import {
  B1_FLOW_STEPS,
  B1_MERMAID_DIAGRAM,
  B1_REPO_STRUCTURE,
} from "./howItWorksContent";

const FLOW_NODES = [
  { label: "Reviewer UI", sub: "B1InventoryDemo.tsx", step: 1 },
  { label: "Vite API", sub: "POST /api/b1/scan", step: 2 },
  { label: "scan_repo.py", sub: "orchestrator", step: 2 },
  { label: "repo_source.py", sub: "git clone", step: 3 },
  { label: "inventory_scanner.py", sub: "classify artifacts", step: 4 },
  { label: "render_report.py", sub: "Markdown report", step: 5 },
  { label: "Results in browser", sub: "summary + report", step: 6 },
];

export function HowItWorksPage() {
  return (
    <div className="page how-it-works-page">
      <Link to="/" className="back-link">
        ← All tasks
      </Link>

      <section className="panel how-hero">
        <p className="eyebrow">B1 architecture</p>
        <h1>How repo artifact inventory works</h1>
        <p className="hero-copy">
          End-to-end flow from the reviewer pasting a Bitbucket URL in the dashboard through git
          clone, multi-language scanning, and live results in the browser.
        </p>
        <div className="task-actions">
          <Link to="/tasks/B1" className="btn btn-primary">
            Try live B1 demo
          </Link>
        </div>
      </section>

      <section className="panel flow-panel">
        <h2>Pipeline diagram</h2>
        <p className="section-copy">
          The reviewer UI, Vite middleware, and Python scanner work together on the same machine
          during <code>npm run dev</code>.
        </p>

        <div className="flow-chart" aria-label="B1 scan pipeline diagram">
          {FLOW_NODES.map((node, index) => (
            <div className="flow-chart-row" key={node.label}>
              <div className="flow-node">
                <span className="flow-step-badge">Step {node.step}</span>
                <strong>{node.label}</strong>
                <span>{node.sub}</span>
              </div>
              {index < FLOW_NODES.length - 1 && (
                <div className="flow-arrow" aria-hidden="true">
                  ↓
                </div>
              )}
            </div>
          ))}
        </div>

        <h3>Mermaid view</h3>
        <pre className="diagram-code">{B1_MERMAID_DIAGRAM}</pre>
      </section>

      <section className="panel steps-panel">
        <h2>Step-by-step detail</h2>
        <ol className="step-list">
          {B1_FLOW_STEPS.map((step) => (
            <li key={step.id} className="step-card">
              <div className="step-card-head">
                <span className="step-number">{step.id}</span>
                <div>
                  <h3>{step.title}</h3>
                  <code>{step.file}</code>
                </div>
              </div>
              <p className="step-summary">{step.summary}</p>
              <p className="step-detail">{step.detail}</p>
              {step.output && (
                <p className="step-output">
                  <strong>Output:</strong> {step.output}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="panel structure-panel">
        <h2>Repository structure</h2>
        <p className="section-copy">
          Key files involved in the B1 task and the reviewer frontend integration.
        </p>
        <pre className="diagram-code">{B1_REPO_STRUCTURE}</pre>
      </section>

      <section className="panel requirements-panel">
        <h2>Runtime requirements</h2>
        <ul className="checklist">
          <li>
            <code>npm run dev</code> in <code>frontend/</code> — enables UI and{" "}
            <code>/api/b1/scan</code>
          </li>
          <li>
            <code>python3</code> and <code>git</code> on PATH — used by the scanner plugin
          </li>
          <li>
            Public Bitbucket repos work without login; private repos need local git credentials
          </li>
          <li>
            Shallow clone (<code>--depth 1</code>) keeps scans fast for reviewer demos
          </li>
        </ul>
      </section>
    </div>
  );
}
