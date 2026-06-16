import { Link, Outlet, useLocation } from "react-router-dom";

export function Layout() {
  const location = useLocation();
  const onHowItWorks = location.pathname === "/how-it-works";

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
            <Link
              to="/how-it-works"
              className={`header-link${onHowItWorks ? " header-link-active" : ""}`}
            >
              How it works
            </Link>
            <a href="/tasks.json" target="_blank" rel="noreferrer" className="header-link">
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
