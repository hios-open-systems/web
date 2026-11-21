export type Paddle = 'dot' | 'dash' | 'manual';

// One key-down starts a stream. Releasing a paddle lets its current element finish.
export class MorseKeyer {
  private held: Paddle | null = null;
  private pending: Paddle | null = null;
  private mark: Paddle | null = null;
  private began = 0;
  private busy = false;
  private timer = 0;
  private boundary = 0;

  constructor(private unit: number, private tone: (on: boolean) => void,
    private symbol: (symbol: string) => void, private letter: () => void) {}

  down(key: Paddle) {
    if (this.held) return;
    this.held = key;
    if (this.busy) this.pending = key;
    else this.start(key);
  }

  up(key: Paddle) {
    if (this.held !== key) return;
    this.held = null;
    if (this.mark === 'manual') this.finish(performance.now() - this.began < 2 * this.unit ? '.' : '-');
    if (this.pending === 'manual') this.pending = null;
  }

  private start(key: Paddle) {
    window.clearTimeout(this.boundary);
    this.busy = true;
    this.mark = key;
    this.began = performance.now();
    this.tone(true);
    if (key !== 'manual') {
      const dot = key === 'dot';
      this.timer = window.setTimeout(() => this.finish(dot ? '.' : '-'), this.unit * (dot ? 1 : 3));
    }
  }

  private finish(symbol: string) {
    this.mark = null;
    this.tone(false);
    this.symbol(symbol);
    this.boundary = window.setTimeout(this.letter, this.unit * 2.5);
    this.timer = window.setTimeout(() => {
      this.busy = false;
      const next = this.pending ?? this.held;
      this.pending = null;
      if (next) this.start(next);
    }, this.unit);
  }

  stop() {
    window.clearTimeout(this.timer);
    window.clearTimeout(this.boundary);
    this.held = this.pending = this.mark = null;
    this.busy = false;
    this.tone(false);
  }
}
