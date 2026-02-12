import { Link } from 'react-router-dom';

export function LandingPage(): JSX.Element {
  return (
    <section className="landing">
      <header>
        <h1>Texo Playground</h1>
        <p>Stream-first generative UI demos across Casual, Pro, and Data scenarios.</p>
      </header>
      <div className="architecture">
        <pre>{`LLM Stream -> @texo-ui/core Parser -> AST -> @texo-ui/react Renderer -> Interactive UI`}</pre>
      </div>
      <div className="category-cards">
        <Link to="/casual" className="category-card casual">
          🎮 Casual
        </Link>
        <Link to="/pro" className="category-card pro">
          🔧 Pro
        </Link>
        <Link to="/data" className="category-card data">
          📊 Data
        </Link>
      </div>
      <Link to="/casual/tournament" className="cta">
        Try Now
      </Link>
    </section>
  );
}
