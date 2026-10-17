import { fork } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Extraction runs in a short-lived child process.
 *
 * `pdf-parse` needs on the order of 240 MB for a modest PDF and that memory is
 * not returned to the OS once parsing finishes, so doing it in-process pinned
 * the API server near its memory ceiling after the first upload. A child
 * process hands all of it back on exit.
 */

/**
 * Resolved through `import.meta.url` so the worker travels with the source.
 * The replacement strips the leading slash `URL.pathname` puts in front of a
 * Windows drive letter, matching the alias handling in the build config.
 */
const WORKER_PATH = new URL("./pdf-worker.mjs", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

/** Upper bound so a pathological PDF cannot hang the request forever. */
const WORKER_TIMEOUT_MS = 60_000;

type WorkerResult =
  | { ok: true; text: string }
  | { ok: false; name: string; message: string };

function runWorker(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    /*
     * `execArgv: []` is load-bearing. `fork` inherits the parent's
     * `process.execArgv` by default, and this API process runs under tsx --
     * so without an explicit override the worker would load the TypeScript
     * loader too and cost ~3.5 s per upload instead of ~0.7 s. The worker is
     * plain ESM and needs no loader.
     */
    const child = fork(WORKER_PATH, [filePath], {
      execArgv: [],
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    });

    let settled = false;

    const settle = (finish: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      // Ensure the worker is gone even when it answered successfully.
      child.kill();
      finish();
    };

    const timer = setTimeout(() => {
      settle(() => reject(new Error("PDF processing timed out")));
    }, WORKER_TIMEOUT_MS);

    child.once("message", (message: WorkerResult) => {
      settle(() => {
        if (message.ok) {
          resolve(message.text);
          return;
        }

        // Rebuild the error with its original name so callers keep working.
        const failure = new Error(message.message);
        failure.name = message.name;
        reject(failure);
      });
    });

    child.once("error", (error) => {
      settle(() => reject(error));
    });

    child.once("exit", (code) => {
      // Only surfaces when the worker died without reporting a result.
      settle(() =>
        reject(
          new Error(`PDF worker exited unexpectedly (code ${code ?? "unknown"})`),
        ),
      );
    });
  });
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  // The buffer is staged on disk because the worker reads from a path; keeping
  // it out of the IPC queue avoids a second full copy of the upload.
  const filePath = join(tmpdir(), `mindora-pdf-${randomUUID()}.pdf`);

  await writeFile(filePath, buffer);

  try {
    return await runWorker(filePath);
  } finally {
    // Runs on success and on failure so a rejected upload leaves nothing behind.
    await unlink(filePath).catch(() => undefined);
  }
}