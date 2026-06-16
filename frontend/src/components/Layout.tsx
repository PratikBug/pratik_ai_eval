import { Link, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">CA</span>
            <div>
              <strong>Coding Agent Eval</strong>
              <span>Reviewer dashboard</span>
            </div>
          </Link>
          <nav className="header-nav">
            <a href="/tasks.json" target="_blank" rel="noreferrer">
              tasks.json
            </a>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
