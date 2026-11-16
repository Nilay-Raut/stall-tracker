import type { Instrumentation } from "next";

/**
 * Logs every server error as one JSON line (read with `docker compose logs app`).
 * Only the path is logged, never the query string, headers or cookies, so no
 * session tokens or form data end up in the logs. `digest` matches the code
 * shown to the owner on the error screen.
 */
export const onRequestError: Instrumentation.onRequestError = (error, request, context) => {
  const details =
    error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) };
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;

  console.error(
    JSON.stringify({
      level: "error",
      time: new Date().toISOString(),
      digest,
      method: request.method,
      path: request.path.split("?")[0],
      route: context.routePath,
      type: context.routeType,
      ...details,
    }),
  );
};
