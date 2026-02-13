import { createRegistry, TexoRenderer, type TexoAction } from '@texo-ui/react';
import {
  BUILTIN_COMPONENT_CATALOG,
  createBuiltInComponents,
  type CatalogComponent,
} from '@texo-ui/kit';
import {
  buildTexoStreamSystemPrompt,
  type RecoveryEvent,
  type TexoComponentDoc,
} from '@texo-ui/core';
import { useMemo, useRef, useState } from 'react';
import { plannerProviders, type PlannerProviderId } from '../utils/planner-providers';

export function LabPage(): JSX.Element {
  const registry = useMemo(() => createRegistry(createBuiltInComponents()), []);
  const abortRef = useRef<AbortController | null>(null);

  const [providerId, setProviderId] = useState<PlannerProviderId>('mock');
  const [model, setModel] = useState(plannerProviders.mock.defaultModel);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [prompt, setPrompt] = useState('Create a compact analytics dashboard with a filter form.');
  const [streamTextValue, setStreamTextValue] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [actions, setActions] = useState<TexoAction[]>([]);
  const [recoveryEvents, setRecoveryEvents] = useState<RecoveryEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const provider = plannerProviders[providerId];

  const componentDocs = useMemo<TexoComponentDoc[]>(
    () =>
      BUILTIN_COMPONENT_CATALOG.map((item: CatalogComponent) => ({
        name: item.name,
        summary: item.summary,
        props: item.props,
        example: item.example,
      })),
    [],
  );

  const sharedRules = useMemo(
    () => [
      'Output must be directly renderable by TexoRenderer as markdown + directives.',
      'Do not return JSON object wrappers.',
      'Close every directive with :::.',
    ],
    [],
  );

  const systemPromptPreview = useMemo(
    () => buildTexoStreamSystemPrompt({ components: componentDocs, extraRules: sharedRules }),
    [componentDocs, sharedRules],
  );

  const onProviderChange = (nextProviderId: PlannerProviderId): void => {
    setProviderId(nextProviderId);
    setModel(plannerProviders[nextProviderId].defaultModel);
  };

  const cancel = (): void => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
  };

  const run = async (): Promise<void> => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setErrors([]);
    setActions([]);
    setRecoveryEvents([]);
    setStreamTextValue('');
    setIsGenerating(true);

    try {
      if (provider.requiresApiKey && !apiKey.trim()) {
        setErrors([`${provider.label} provider requires an API key.`]);
        return;
      }

      await provider.generateTexoStreamText({
        prompt,
        model: model.trim() || provider.defaultModel,
        apiKey: apiKey.trim() || undefined,
        baseUrl: baseUrl.trim() || undefined,
        signal: abortController.signal,
        componentDocs,
        extraRules: sharedRules,
        onText: (chunk) => {
          setStreamTextValue((prev) => prev + chunk);
        },
      });
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Generation cancelled.'
          : error instanceof Error
            ? error.message
            : 'Unknown planner error';
      setErrors([message]);
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }
      setIsGenerating(false);
    }
  };

  return (
    <section className="lab-page">
      <header className="lab-header">
        <h2>Generative Lab</h2>
        <p>Prompt -&gt; LLM Texo Stream -&gt; Built-in UI rendering</p>
      </header>

      <div className="lab-grid">
        <article className="panel">
          <h3>Prompt</h3>
          <div className="lab-controls">
            <label>
              Provider
              <select
                className="lab-select"
                value={providerId}
                onChange={(e) => onProviderChange(e.target.value as PlannerProviderId)}
              >
                {Object.values(plannerProviders).map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Model
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="lab-input"
                placeholder={provider.defaultModel}
              />
            </label>
            <label>
              Base URL (optional)
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="lab-input"
                placeholder={
                  provider.id === 'anthropic'
                    ? 'https://api.anthropic.com/v1'
                    : provider.id === 'deepseek'
                      ? 'https://api.deepseek.com/v1'
                      : 'https://api.openai.com/v1'
                }
              />
            </label>
            <label>
              API key {provider.requiresApiKey ? '(required)' : '(optional)'}
              <input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="lab-input"
                placeholder={provider.id === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
              />
            </label>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="lab-input"
            rows={5}
          />
          <div className="lab-actions">
            <button
              type="button"
              className="cta"
              onClick={() => void run()}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Texo Stream'}
            </button>
            <button type="button" className="lab-cancel" onClick={cancel} disabled={!isGenerating}>
              Cancel
            </button>
          </div>
          {errors.length > 0 ? (
            <pre className="chat-box">{errors.map((error) => `- ${error}`).join('\n')}</pre>
          ) : null}
        </article>

        <article className="panel">
          <h3>Built-in Catalog</h3>
          <ul className="lab-catalog">
            {BUILTIN_COMPONENT_CATALOG.map((item: CatalogComponent) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.summary}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <h3>Texo System Prompt</h3>
          <pre className="chat-box">{systemPromptPreview}</pre>
        </article>

        <article className="panel">
          <h3>Texo Stream</h3>
          <pre className="chat-box">{streamTextValue || 'LLM texo stream appears here.'}</pre>
        </article>

        <article className="panel">
          <h3>Rendered UI</h3>
          <TexoRenderer
            content={streamTextValue}
            registry={registry}
            onAction={(action) => setActions((prev) => [...prev, action])}
            onError={(event) => setRecoveryEvents((prev) => [...prev, event])}
          />
        </article>

        <article className="panel">
          <h3>Interaction/Recovery Log</h3>
          <pre className="chat-box">
            {JSON.stringify({ actions, recoveryEvents }, null, 2) || 'No events yet.'}
          </pre>
        </article>
      </div>
    </section>
  );
}
