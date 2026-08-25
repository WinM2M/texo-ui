export interface Scenario {
  id: string;
  name: string;
  systemPrompt: string;
  content: string;
  chunkDelay?: number;
  chunkSize?: number;
}

export class StreamSimulator {
  private readonly scenario: Scenario;
  private timer: ReturnType<typeof globalThis.setTimeout> | null = null;
  private index = 0;
  private paused = false;
  private stopped = false;
  private speed = 1;

  constructor(scenario: Scenario) {
    this.scenario = scenario;
  }

  start(onChunk: (chunk: string) => void, onEnd: () => void): void {
    this.stop();
    this.stopped = false;
    this.index = 0;
    const delay = this.scenario.chunkDelay ?? 30;
    const size = this.scenario.chunkSize ?? 5;

    const tick = (): void => {
      if (this.stopped) {
        return;
      }
      if (this.paused) {
        this.schedule(tick, delay);
        return;
      }
      if (this.index >= this.scenario.content.length) {
        onEnd();
        return;
      }

      const next = this.scenario.content.slice(this.index, this.index + size);
      this.index += size;
      onChunk(next);
      this.schedule(tick, Math.max(5, Math.floor(delay / this.speed)));
    };

    this.schedule(tick, delay);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }

  stop(): void {
    this.stopped = true;
    this.paused = false;
    if (this.timer !== null) {
      globalThis.clearTimeout(this.timer);
      this.timer = null;
    }
  }

  setSpeed(multiplier: number): void {
    this.speed = Math.max(0.25, multiplier);
  }

  private schedule(fn: () => void, ms: number): void {
    this.timer = globalThis.setTimeout(fn, ms);
  }
}
