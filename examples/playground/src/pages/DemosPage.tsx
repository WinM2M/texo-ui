import { Link } from 'react-router-dom';
import { allScenarios } from '../scenarios';

export function DemosPage(): JSX.Element {
  return (
    <section>
      <h2>Demos</h2>
      <p className="muted">
        Canned streams replayed through the parser. Every directive below is composed from the
        built-in Texo primitives — no demo-specific components.
      </p>
      <div className="demo-grid">
        {allScenarios.map((scenario) => (
          <Link key={scenario.id} to={`/demos/${scenario.id}`} className="demo-card">
            <h3>{scenario.name}</h3>
            <p>{scenario.systemPrompt}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
