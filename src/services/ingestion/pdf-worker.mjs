import { readFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";

/**
 * Short-lived PDF extraction worker.
 *
 * Deliberately plain ESM rather than TypeScript. This file is a child-process
 * entry point, so it boots with bare `node` and never loads the tsx loader --
 * doing so cost roughly 3.5 s per upload against about 0.7 s here. It is
 * therefore excluded from `tsc` (the project does not enable `allowJs`), which
 * is the one trade-off of keeping it untyped.
 *
 * `pdf-parse` expands fonts, streams and cross-reference tables, costing on the
 * order of 240 MB for a modest document, and V8 never returns that memory to
 * the OS once parsing finishes. Parsing in the API process therefore pinned the
 * server near its ceiling after a single upload. Running here means the whole
 * allocation is reclaimed the moment this process exits, and a malformed PDF
 * can only take down the worker.
 *
 * Contract: read the file path from argv, send one result message, exit.
 */
async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    process.send?.({
      ok: false,
      name: "Error",
      message: "pdf-worker: no file path supplied",
    });
    process.exit(1);
    return;
  }

  let parser;

  try {
    parser = new PDFParse({ data: readFileSync(filePath) });
    const result = await parser.getText();

    process.send?.({ ok: true, text: result.text.trim() });
  } catch (error) {
    const failure =
      error instanceof Error ? error : new Error("Failed to extract PDF text");

    // The name is preserved so the API can still map a password-protected
    // document to a 400 rather than a generic 500.
    process.send?.({
      ok: false,
      name: failure.name || "Error",
      message: failure.message,
    });
  } finally {
    try {
      await parser?.destroy();
    } catch {
      // The worker is exiting; nothing can act on a destroy failure.
    }
  }
}

main();