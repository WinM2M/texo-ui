import { buildTexoStreamSystemPrompt, type TexoComponentDoc } from '@texo-ui/core';
import { compileIntentPlanToTexo } from './intent-compiler';
import { generateMockIntentPlan } from './mock-llm-planner';

export type PlannerProviderId = 'mock' | 'openai' | 'anthropic' | 'deepseek';

export interface PlannerRequest {
  prompt: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  signal?: AbortSignal;
  componentDocs: TexoComponentDoc[];
  extraRules?: string[];
  onText: (chunk: string) => void;
}

export interface PlannerProvider {
  id: PlannerProviderId;
  label: string;
  defaultModel: string;
  requiresApiKey: boolean;
  supportsStreaming: boolean;
  generateTexoStreamText: (request: PlannerRequest) => Promise<string>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function buildSystemPrompt(request: PlannerRequest): string {
  return buildTexoStreamSystemPrompt({
    components: request.componentDocs,
    extraRules: [
      'Use only listed components unless absolutely necessary.',
      'Close every directive block with :::',
      ...(request.extraRules ?? []),
    ],
  });
}

async function readSSEText(
  stream: ReadableStream<Uint8Array>,
  onEvent: (json: Record<string, unknown>) => string | null,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';

  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    buffer += decoder.decode(result.value, { stream: true }).replace(/\r\n/g, '\n');

    let boundary = buffer.indexOf('\n\n');
    while (boundary >= 0) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const dataLines = block
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .filter(Boolean);

      for (const dataLine of dataLines) {
        if (dataLine === '[DONE]') {
          return output;
        }
        try {
          const parsed = JSON.parse(dataLine) as Record<string, unknown>;
          const delta = onEvent(parsed);
          if (delta) {
            output += delta;
          }
        } catch {
          continue;
        }
      }

      boundary = buffer.indexOf('\n\n');
    }
  }

  return output;
}

const mockProvider: PlannerProvider = {
  id: 'mock',
  label: 'Mock planner',
  defaultModel: 'mock-v1',
  requiresApiKey: false,
  supportsStreaming: true,
  async generateTexoStreamText(request): Promise<string> {
    const texo = compileIntentPlanToTexo(generateMockIntentPlan(request.prompt));
    let output = '';
    for (let index = 0; index < texo.length; index += 16) {
      if (request.signal?.aborted) {
        throw new DOMException('Generation cancelled', 'AbortError');
      }
      const chunk = texo.slice(index, index + 16);
      output += chunk;
      request.onText(chunk);
      await delay(18);
    }
    return output;
  },
};

const openAIProvider: PlannerProvider = {
  id: 'openai',
  label: 'OpenAI',
  defaultModel: 'gpt-4o-mini',
  requiresApiKey: true,
  supportsStreaming: true,
  async generateTexoStreamText(request): Promise<string> {
    const endpointBase = request.baseUrl?.trim() || 'https://api.openai.com/v1';
    const response = await fetch(`${endpointBase.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: request.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey ?? ''}`,
      },
      body: JSON.stringify({
        model: request.model,
        temperature: 0,
        stream: true,
        messages: [
          { role: 'system', content: buildSystemPrompt(request) },
          { role: 'user', content: request.prompt },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI request failed (${response.status})`);
    }

    return readSSEText(response.body, (event) => {
      const choices = event.choices;
      if (!Array.isArray(choices) || choices.length === 0) {
        return null;
      }
      const first = choices[0] as { delta?: { content?: unknown } };
      const content = first.delta?.content;
      if (typeof content !== 'string') {
        return null;
      }
      request.onText(content);
      return content;
    });
  },
};

const anthropicProvider: PlannerProvider = {
  id: 'anthropic',
  label: 'Anthropic',
  defaultModel: 'claude-3-5-haiku-latest',
  requiresApiKey: true,
  supportsStreaming: true,
  async generateTexoStreamText(request): Promise<string> {
    const endpointBase = request.baseUrl?.trim() || 'https://api.anthropic.com/v1';
    const response = await fetch(`${endpointBase.replace(/\/$/, '')}/messages`, {
      method: 'POST',
      signal: request.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': request.apiKey ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: request.model,
        max_tokens: 1800,
        temperature: 0,
        stream: true,
        system: buildSystemPrompt(request),
        messages: [{ role: 'user', content: request.prompt }],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic request failed (${response.status})`);
    }

    return readSSEText(response.body, (event) => {
      if (event.type !== 'content_block_delta') {
        return null;
      }
      const delta = event.delta as { text?: unknown } | undefined;
      if (!delta || typeof delta.text !== 'string') {
        return null;
      }
      request.onText(delta.text);
      return delta.text;
    });
  },
};

const deepSeekProvider: PlannerProvider = {
  id: 'deepseek',
  label: 'DeepSeek',
  defaultModel: 'deepseek-chat',
  requiresApiKey: true,
  supportsStreaming: true,
  async generateTexoStreamText(request): Promise<string> {
    const endpointBase = request.baseUrl?.trim() || 'https://api.deepseek.com/v1';
    const response = await fetch(`${endpointBase.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      signal: request.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.apiKey ?? ''}`,
      },
      body: JSON.stringify({
        model: request.model,
        temperature: 0,
        stream: true,
        messages: [
          { role: 'system', content: buildSystemPrompt(request) },
          { role: 'user', content: request.prompt },
        ],
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`DeepSeek request failed (${response.status})`);
    }

    return readSSEText(response.body, (event) => {
      const choices = event.choices;
      if (!Array.isArray(choices) || choices.length === 0) {
        return null;
      }
      const first = choices[0] as { delta?: { content?: unknown } };
      const content = first.delta?.content;
      if (typeof content !== 'string') {
        return null;
      }
      request.onText(content);
      return content;
    });
  },
};

export const plannerProviders: Record<PlannerProviderId, PlannerProvider> = {
  mock: mockProvider,
  openai: openAIProvider,
  anthropic: anthropicProvider,
  deepseek: deepSeekProvider,
};
