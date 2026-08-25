import { Link, useLocation } from 'react-router-dom';

const MODES = [
  { id: 'lab', label: 'Lab', color: '#f59e0b' },
  { id: 'demos', label: 'Demos', color: '#2563eb' },
] as const;

export function ModeSwitcher(): JSX.Element {
  const location = useLocation();
  return (
    <nav className="mode-switcher">
      {MODES.map((mode) => {
        const active = location.pathname.startsWith(`/${mode.id}`);
        return (
          <Link
            key={mode.id}
            to={`/${mode.id}`}
            className="mode-link"
            style={{
              borderColor: 'transparent',
              background: active ? `${mode.color}22` : 'transparent',
            }}
          >
            <span>{mode.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
