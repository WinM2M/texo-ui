import type { RootNode } from '@texo-ui/core';
import { TexoPipeline, type RecoveryEvent } from '@texo-ui/core';
import { TexoRenderer, createRegistry, type TexoAction } from '@texo-ui/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiRequestForm,
  AutoDashboard,
  CodeVisualizer,
  DecisionMatrix,
  DynamicForm,
  ExpenseList,
  ImagePicker,
  InteractiveChart,
  InventoryGrid,
  MemeEditor,
  SettlementCalculator,
  TarotDeck,
  TournamentBracket,
} from './index';
import { DebugConsole } from './DebugConsole';
import type { Scenario } from '../utils/stream-simulator';
import { StreamSimulator } from '../utils/stream-simulator';

function asDirective<P>(
  Component: (props: {
    attributes: P;
    status: 'streaming' | 'complete';
    onAction?: (action: TexoAction) => void;
  }) => JSX.Element,
): (props: Record<string, unknown>) => JSX.Element {
  return function Wrapped(props: Record<string, unknown>): JSX.Element {
    return <Component attributes={props as P} status="complete" />;
  };
}

function createPlaygroundRegistry() {
  const registry = createRegistry();
  registry.register('tournament-bracket', asDirective(TournamentBracket));
  registry.register('tarot-deck', asDirective(TarotDeck));
  registry.register('meme-editor', asDirective(MemeEditor));
  registry.register('image-picker', asDirective(ImagePicker));
  registry.register('inventory-grid', asDirective(InventoryGrid));
  registry.register('api-request-form', asDirective(ApiRequestForm));
  registry.register('code-visualizer', asDirective(CodeVisualizer));
  registry.register('decision-matrix', asDirective(DecisionMatrix));
  registry.register('settlement-calculator', asDirective(SettlementCalculator));
  registry.register('auto-dashboard', asDirective(AutoDashboard));
  registry.register('interactive-chart', asDirective(InteractiveChart));
  registry.register('dynamic-form', asDirective(DynamicForm));
  registry.register('expense-list', asDirective(ExpenseList));
  return registry;
}

export function DemoShell({ scenario }: { scenario: Scenario }): JSX.Element {
  const [streamText, setStreamText] = useState('');
  const [actions, setActions] = useState<TexoAction[]>([]);
  const [errors, setErrors] = useState<RecoveryEvent[]>([]);
  const [ast, setAst] = useState<RootNode | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showConsole, setShowConsole] = useState(true);
  const [speed, setSpeed] = useState(1);

  const registry = useMemo(() => createPlaygroundRegistry(), []);
  const simulatorRef = useRef<StreamSimulator | null>(null);
  const parserRef = useRef(new TexoPipeline());

  useEffect(() => {
    return () => {
      simulatorRef.current?.stop();
    };
  }, []);

  const start = (): void => {
    parserRef.current.reset();
    setStreamText('');
    setActions([]);
    setErrors([]);
    setAst(null);

    const simulator = new StreamSimulator(scenario);
    simulator.setSpeed(speed);
    simulatorRef.current = simulator;
    simulator.start(
      (chunk) => {
        setStreamText((prev) => prev + chunk);
        parserRef.current.push(chunk);
        setAst(parserRef.current.getAST());
      },
      () => {
        parserRef.current.end();
        setAst(parserRef.current.getAST());
      },
    );
  };

  return (
    <div className="demo-shell">
      <aside className="panel panel-chat">
        <h3>{scenario.name}</h3>
        <p className="muted">Streaming simulator</p>
        <div className="controls">
          <button type="button" onClick={start}>
            Replay
          </button>
          <button type="button" onClick={() => simulatorRef.current?.pause()}>
            Pause
          </button>
          <button type="button" onClick={() => simulatorRef.current?.resume()}>
            Resume
          </button>
          <label>
            Speed
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.5}
              value={speed}
              onChange={(e) => {
                const next = Number(e.target.value);
                setSpeed(next);
                simulatorRef.current?.setSpeed(next);
              }}
            />
          </label>
          <button type="button" onClick={() => setShowPrompt((v) => !v)}>
            {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
          </button>
        </div>
        {showPrompt ? <pre className="prompt-box">{scenario.systemPrompt}</pre> : null}
        <pre className="chat-box">{streamText || 'Press Replay to stream scenario...'}</pre>
      </aside>

      <main className="panel panel-render">
        <TexoRenderer
          content={streamText}
          registry={registry}
          onAction={(action) => setActions((prev) => [...prev, action])}
          onError={(event) => setErrors((prev) => [...prev, event])}
        />
      </main>

      <DebugConsole
        ast={ast}
        actions={actions}
        errors={errors}
        open={showConsole}
        onToggle={() => setShowConsole((v) => !v)}
      />
    </div>
  );
}
