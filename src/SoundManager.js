// src/SoundManager.js
// Audio playback (SYSTEM layer).
//
// Responsibilities:
// - Load sound assets during preload() (via loadSound)
// - Play sounds by key (SFX/music)
// - Provide a simple abstraction so gameplay code never touches audio directly
//
// Non-goals:
// - Does NOT subscribe to EventBus directly (Game wires events → play())
// - Does NOT decide when events happen (WORLD logic emits events)
// - Does NOT manage UI
//
// Architectural notes:
// - Game connects EventBus events (leaf:collected, player:damaged, etc.) to SoundManager.play().
// - This keeps audio concerns isolated from gameplay and supports easy swapping/muting.

export class SoundManager {
  constructor() {
    this.sfx = {};
    this.ready = {};
  }

  load(name, path) {
    // p5.sound loads asynchronously; keep a promise so callers can await readiness.
    const promise = new Promise((resolve, reject) => {
      const sound = loadSound(
        path,
        () => resolve(sound),
        (err) => reject(err),
      );

      this.sfx[name] = sound;
    });

    this.ready[name] = promise;
    return promise;
  }

  whenReady(name) {
    return (
      this.ready[name] ??
      Promise.reject(new Error(`No sound registered for '${name}'`))
    );
  }

  play(name) {
    const sound = this.sfx[name];
    if (!sound) return;

    try {
      // Some browsers throw if the sound isn't yet loaded; guard against that.
      sound.play();
    } catch (err) {
      // If it isn't loaded yet, play once it's ready.
      const ready = this.ready[name];
      if (ready) {
        ready.then(() => {
          try {
            this.sfx[name]?.play();
          } catch (_) {
            // ignore
          }
        });
      }
    }
  }
}
