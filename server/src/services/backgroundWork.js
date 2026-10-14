import { waitUntil } from "@vercel/functions";

export function createBackgroundWork({
  waitUntil: extendLifetime = waitUntil,
  schedule = setImmediate,
  isVercel = () => process.env.VERCEL === "1",
} = {}) {
  return function queueBackgroundWork(work, { onError } = {}) {
    const task = (isVercel()
      ? Promise.resolve().then(work)
      : new Promise((resolve) => schedule(resolve)).then(work)
    ).catch(async (error) => {
      try {
        if (onError) await onError(error);
        else console.warn("Background automation failed; durable jobs remain recoverable");
      } catch {
        // Observability must not create a second unhandled rejection.
      }
    });
    if (isVercel()) {
      try { extendLifetime(task); }
      catch { console.warn("Background lifetime unavailable; durable jobs remain recoverable"); }
    }
    return task;
  };
}

export const queueBackgroundWork = createBackgroundWork();
