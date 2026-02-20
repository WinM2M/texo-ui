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
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getKnownProviderModels,
  plannerProviders,
  resolveProviderModels,
  type PlannerProviderId,
} from '../utils/planner-providers';

const LAB_PREFS_KEY = 'texo.lab.preferences.v1';
const LAB_SPLIT_WIDTH_KEY = 'texo.lab.split-width.v1';
const LAB_SPLIT_HEIGHT_KEY = 'texo.lab.split-height.v1';

interface LabPreferences {
  providerId: PlannerProviderId;
  model: string;
  apiKey: string;
  baseUrl: string;
}

interface ProviderModelOption {
  providerId: PlannerProviderId;
  providerLabel: string;
  model: string;
}

function readLabPreferences(): LabPreferences | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  const raw = globalThis.localStorage.getItem(LAB_PREFS_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<LabPreferences>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const providerId =
      parsed.providerId === 'openai' ||
      parsed.providerId === 'anthropic' ||
      parsed.providerId === 'deepseek' ||
      parsed.providerId === 'mock'
        ? parsed.providerId
        : 'mock';
    return {
      providerId,
      model:
        typeof parsed.model === 'string' ? parsed.model : plannerProviders[providerId].defaultModel,
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
    };
  } catch {
    return null;
  }
}

function readLabSplitWidth(): number | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  const raw = globalThis.localStorage.getItem(LAB_SPLIT_WIDTH_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.min(75, Math.max(25, parsed));
}

function readLabSplitHeight(): number | null {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }
  const raw = globalThis.localStorage.getItem(LAB_SPLIT_HEIGHT_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.min(1200, Math.max(220, parsed));
}

export function LabPage(): JSX.Element {
  const registry = useMemo(() => createRegistry(createBuiltInComponents()), []);
  const abortRef = useRef<AbortController | null>(null);
  const pageRef = useRef<HTMLElement | null>(null);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const splitDragStateRef = useRef<{ startX: number; startLeftPercent: number } | null>(null);
  const verticalDragStateRef = useRef<{ startY: number; startHeight: number } | null>(null);
  const initialPrefs = useMemo(() => readLabPreferences(), []);
  const initialSplitWidth = useMemo(() => readLabSplitWidth(), []);
  const initialSplitHeight = useMemo(() => readLabSplitHeight(), []);

  const [providerId, setProviderId] = useState<PlannerProviderId>(
    initialPrefs?.providerId ?? 'mock',
  );
  const [model, setModel] = useState(
    initialPrefs?.model ?? plannerProviders[initialPrefs?.providerId ?? 'mock'].defaultModel,
  );
  const [apiKey, setApiKey] = useState(initialPrefs?.apiKey ?? '');
  const [baseUrl, setBaseUrl] = useState(initialPrefs?.baseUrl ?? '');
  const [prompt, setPrompt] = useState('Create a compact analytics dashboard with a filter form.');
  const [streamTextValue, setStreamTextValue] = useState('');
  const [editableStreamText, setEditableStreamText] = useState('');
  const [renderStreamText, setRenderStreamText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [actions, setActions] = useState<TexoAction[]>([]);
  const [recoveryEvents, setRecoveryEvents] = useState<RecoveryEvent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [leftPanelWidthPercent, setLeftPanelWidthPercent] = useState(initialSplitWidth ?? 50);
  const [isResizingPanels, setIsResizingPanels] = useState(false);
  const [mainRowHeight, setMainRowHeight] = useState<number | null>(initialSplitHeight);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [modelOptionsByProvider, setModelOptionsByProvider] = useState<
    Record<PlannerProviderId, string[]>
  >({
    mock: getKnownProviderModels('mock'),
    openai: getKnownProviderModels('openai'),
    anthropic: getKnownProviderModels('anthropic'),
    deepseek: getKnownProviderModels('deepseek'),
  });

  const provider = plannerProviders[providerId];

  const providerModelOptions = useMemo<ProviderModelOption[]>(() => {
    const byProvider = { ...modelOptionsByProvider };
    const selectedList = byProvider[providerId] ?? [];
    if (model && !selectedList.includes(model)) {
      byProvider[providerId] = [model, ...selectedList];
    }

    return (Object.keys(plannerProviders) as PlannerProviderId[]).flatMap((id) => {
      const providerEntry = plannerProviders[id];
      const models = byProvider[id] ?? [];
      return models.map((modelName) => ({
        providerId: id,
        providerLabel: providerEntry.label,
        model: modelName,
      }));
    });
  }, [modelOptionsByProvider, providerId, model]);

  const selectedProviderModelValue = `${providerId}::${model}`;

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
      'When using texo-grid, always declare rows/columns and explicit cells with unique id values.',
      'For cell coordinates, prefer 1-based row/column values.',
      'Place components into grid cells with optional mount field instead of nesting as grid children.',
      'Support theming with texo-theme using scope: global/local and token keys (background, foreground, accent, line, radius, border, paddingY, paddingX, shadow).',
      'Prefer texo-theme preset names first, then override only needed tokens.',
      'For calculator/keypad screens prefer texo-button stylePreset: wide or raised.',
      'For time-series requests use texo-chart line with multi-series, and set xEditable: true when axis changes should be allowed.',
      'For editable date windows, include startDate/dayStep and optional rangeStartDate/rangeEndDate.',
      'If prompt asks for pie from last-day values, output a second texo-chart pie using each series final value.',
    ],
    [],
  );

  const systemPromptPreview = useMemo(
    () => buildTexoStreamSystemPrompt({ components: componentDocs, extraRules: sharedRules }),
    [componentDocs, sharedRules],
  );

  const onProviderModelChange = (value: string): void => {
    const [nextProviderId, nextModel] = value.split('::') as [PlannerProviderId, string];
    if (!plannerProviders[nextProviderId] || !nextModel) {
      return;
    }
    setProviderId(nextProviderId);
    setModel(nextModel);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async (): Promise<void> => {
      const entries = await Promise.all(
        (Object.keys(plannerProviders) as PlannerProviderId[]).map(async (id) => {
          const models = await resolveProviderModels(
            id,
            apiKey.trim() || undefined,
            baseUrl.trim() || undefined,
          );
          return [id, models] as const;
        }),
      );

      if (cancelled) {
        return;
      }

      setModelOptionsByProvider((prev) => {
        const next = { ...prev };
        entries.forEach(([id, models]) => {
          next[id] = models;
        });
        return next;
      });
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [apiKey, baseUrl]);

  useEffect(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      return;
    }
    const payload: LabPreferences = {
      providerId,
      model,
      apiKey,
      baseUrl,
    };
    globalThis.localStorage.setItem(LAB_PREFS_KEY, JSON.stringify(payload));
  }, [providerId, model, apiKey, baseUrl]);

  useEffect(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      return;
    }
    globalThis.localStorage.setItem(LAB_SPLIT_WIDTH_KEY, String(leftPanelWidthPercent));
  }, [leftPanelWidthPercent]);

  useEffect(() => {
    if (typeof globalThis.localStorage === 'undefined') {
      return;
    }
    if (mainRowHeight === null) {
      globalThis.localStorage.removeItem(LAB_SPLIT_HEIGHT_KEY);
      return;
    }
    globalThis.localStorage.setItem(LAB_SPLIT_HEIGHT_KEY, String(mainRowHeight));
  }, [mainRowHeight]);

  useEffect(() => {
    if (!isResizingPanels) {
      return;
    }

    const onPointerMove = (event: PointerEvent): void => {
      const container = splitContainerRef.current;
      const dragState = splitDragStateRef.current;
      if (!container || !dragState) {
        return;
      }

      const containerWidth = container.getBoundingClientRect().width;
      if (containerWidth <= 0) {
        return;
      }

      const deltaX = event.clientX - dragState.startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const nextPercent = Math.min(75, Math.max(25, dragState.startLeftPercent + deltaPercent));
      setLeftPanelWidthPercent(nextPercent);
    };

    const stopResize = (): void => {
      splitDragStateRef.current = null;
      setIsResizingPanels(false);
    };

    globalThis.addEventListener('pointermove', onPointerMove);
    globalThis.addEventListener('pointerup', stopResize);
    globalThis.addEventListener('pointercancel', stopResize);

    return () => {
      globalThis.removeEventListener('pointermove', onPointerMove);
      globalThis.removeEventListener('pointerup', stopResize);
      globalThis.removeEventListener('pointercancel', stopResize);
    };
  }, [isResizingPanels]);

  useEffect(() => {
    if (!isResizingHeight) {
      return;
    }

    const onPointerMove = (event: PointerEvent): void => {
      const page = pageRef.current;
      const dragState = verticalDragStateRef.current;
      if (!page || !dragState) {
        return;
      }

      const deltaY = event.clientY - dragState.startY;
      const pageRect = page.getBoundingClientRect();
      const maxHeight = Math.max(260, pageRect.height - 180);
      const nextHeight = Math.min(maxHeight, Math.max(220, dragState.startHeight + deltaY));
      setMainRowHeight(nextHeight);
    };

    const stopResize = (): void => {
      verticalDragStateRef.current = null;
      setIsResizingHeight(false);
    };

    globalThis.addEventListener('pointermove', onPointerMove);
    globalThis.addEventListener('pointerup', stopResize);
    globalThis.addEventListener('pointercancel', stopResize);

    return () => {
      globalThis.removeEventListener('pointermove', onPointerMove);
      globalThis.removeEventListener('pointerup', stopResize);
      globalThis.removeEventListener('pointercancel', stopResize);
    };
  }, [isResizingHeight]);

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
    setEditableStreamText('');
    setRenderStreamText('');
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
          setEditableStreamText((prev) => prev + chunk);
          setRenderStreamText((prev) => prev + chunk);
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

  const retryRenderFromEditableStream = (): void => {
    setErrors([]);
    setActions([]);
    setRecoveryEvents([]);
    setRenderStreamText(editableStreamText);
  };

  const restoreEditableStreamFromLatestOutput = (): void => {
    setEditableStreamText(streamTextValue);
  };

  const startPanelResize = (event: React.PointerEvent<HTMLButtonElement>): void => {
    splitDragStateRef.current = {
      startX: event.clientX,
      startLeftPercent: leftPanelWidthPercent,
    };
    setIsResizingPanels(true);
  };

  const startVerticalResize = (event: React.PointerEvent<HTMLButtonElement>): void => {
    const container = splitContainerRef.current;
    if (!container) {
      return;
    }
    verticalDragStateRef.current = {
      startY: event.clientY,
      startHeight: container.getBoundingClientRect().height,
    };
    setIsResizingHeight(true);
  };

  return (
    <section
      className={`lab-page${isResizingHeight ? ' lab-page--resizing-height' : ''}`}
      ref={pageRef}
    >
      <header className="lab-header">
        <h2>Generative Lab</h2>
        <p>Prompt -&gt; LLM Texo Stream -&gt; Built-in UI rendering</p>
      </header>

      <div
        className={`lab-main-row${isResizingPanels ? ' lab-main-row--resizing' : ''}`}
        ref={splitContainerRef}
        style={
          {
            '--lab-left-panel-width': `${leftPanelWidthPercent}%`,
            ...(mainRowHeight ? { height: `${mainRowHeight}px` } : {}),
          } as React.CSSProperties
        }
      >
        <article className="panel">
          <h3>Prompt</h3>
          <div className="lab-controls">
            <label>
              Provider + Model
              <select
                className="lab-select"
                value={selectedProviderModelValue}
                onChange={(e) => onProviderModelChange(e.target.value)}
              >
                {providerModelOptions.map((option) => (
                  <option
                    key={`${option.providerId}-${option.model}`}
                    value={`${option.providerId}::${option.model}`}
                  >
                    {option.providerLabel} / {option.model}
                  </option>
                ))}
              </select>
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

        <button
          type="button"
          className="lab-pane-divider"
          aria-label="Resize prompt and rendered UI panels"
          aria-orientation="vertical"
          onPointerDown={startPanelResize}
        />

        <article className="panel lab-render-panel">
          <h3>Rendered UI</h3>
          <TexoRenderer
            content={renderStreamText}
            registry={registry}
            trimLeadingTextBeforeDirective
            renderDirectivesOnly
            onAction={(action) => setActions((prev) => [...prev, action])}
            onError={(event) => setRecoveryEvents((prev) => [...prev, event])}
          />
        </article>
      </div>

      <button
        type="button"
        className="lab-height-divider"
        aria-label="Resize prompt/rendered area height"
        aria-orientation="horizontal"
        onPointerDown={startVerticalResize}
      />

      <div className="lab-details">
        <details className="panel lab-detail">
          <summary>Texo Stream</summary>
          <p className="muted">
            Edit the stream and retry UI rendering without re-calling the model.
          </p>
          <textarea
            value={editableStreamText}
            onChange={(event) => setEditableStreamText(event.target.value)}
            className="lab-input lab-stream-editor"
            rows={16}
            placeholder="LLM texo stream appears here."
          />
          <div className="lab-stream-actions">
            <button
              type="button"
              className="cta"
              onClick={retryRenderFromEditableStream}
              disabled={isGenerating || editableStreamText.trim().length === 0}
            >
              Retry UI from Stream
            </button>
            <button
              type="button"
              className="lab-cancel"
              onClick={restoreEditableStreamFromLatestOutput}
              disabled={isGenerating || streamTextValue.length === 0}
            >
              Reset to Latest Output
            </button>
          </div>
        </details>

        <details className="panel lab-detail">
          <summary>Texo System Prompt</summary>
          <pre className="chat-box">{systemPromptPreview}</pre>
        </details>

        <details className="panel lab-detail">
          <summary>Built-in Catalog</summary>
          <ul className="lab-catalog">
            {BUILTIN_COMPONENT_CATALOG.map((item: CatalogComponent) => (
              <li key={item.name}>
                <strong>{item.name}</strong>
                <p>{item.summary}</p>
              </li>
            ))}
          </ul>
        </details>

        <details className="panel lab-detail">
          <summary>Interaction/Recovery Log</summary>
          <pre className="chat-box">
            {JSON.stringify({ actions, recoveryEvents }, null, 2) || 'No events yet.'}
          </pre>
        </details>
      </div>
    </section>
  );
}
