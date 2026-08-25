import { Link, Navigate, useParams } from 'react-router-dom';
import { DemoShell } from '../components/DemoShell';
import { allScenarios, findScenario } from '../scenarios';

export function DemoPage(): JSX.Element {
  const params = useParams<{ demoId: string }>();
  const scenario = findScenario(params.demoId ?? '');
  if (!scenario) {
    return <Navigate to="/demos" replace />;
  }

  return (
    <section>
      <div className="demo-header">
        <h2>{scenario.name}</h2>
        <div className="demo-links">
          {allScenarios.map((entry) => (
            <Link
              key={entry.id}
              to={`/demos/${entry.id}`}
              className={entry.id === scenario.id ? 'active' : ''}
            >
              {entry.name}
            </Link>
          ))}
        </div>
      </div>
      <DemoShell scenario={scenario} />
    </section>
  );
}
