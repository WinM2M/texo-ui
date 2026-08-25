import { Link } from 'react-router-dom';

export function LandingPage(): JSX.Element {
  return (
    <section className="landing">
      <header>
        <h1>Texo Playground</h1>
        <p>Stream-first generative UI demos with a lab-first workflow.</p>
      </header>
      <div className="architecture">
        <pre>{`LLM Stream -> @texo-ui/core Parser -> AST -> @texo-ui/react Renderer -> Interactive UI`}</pre>
      </div>
      <div className="category-cards">
        <Link to="/demos" className="category-card demos">
          🎬 Demos
        </Link>
        <Link to="/lab" className="category-card lab">
          🧪 Generative Lab
        </Link>
      </div>
      <Link to="/lab" className="cta">
        Try Now
      </Link>
    </section>
  );
}
