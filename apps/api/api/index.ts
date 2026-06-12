import type { IncomingMessage, ServerResponse } from "http";
import app from "../src/index.js";

let readyPromise: Promise<void> | null = null;

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse
) {
  readyPromise ??= Promise.resolve(app.ready()).then(() => undefined);
  await readyPromise;

  app.server.emit("request", request, response);
}
