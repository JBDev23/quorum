/** Detect flaky / offline failures from fetch, Supabase, or RN networking. */
export function isNetworkError(error: unknown): boolean {
  const msg = (
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error ?? "")
  ).toLowerCase();

  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("networkerror") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("offline") ||
    msg.includes("sin conexión") ||
    msg.includes("no hay conexión")
  );
}

export const NETWORK_VOTE_MESSAGE =
  "No hay conexión o la red falló al depositar el voto. Comprueba tu conexión e inténtalo de nuevo.";

export const NETWORK_LOAD_MESSAGE =
  "No hay conexión. Comprueba tu red e inténtalo de nuevo.";

export function toNetworkAwareMessage(
  error: unknown,
  fallback: string,
  networkMessage: string = NETWORK_LOAD_MESSAGE
): string {
  if (isNetworkError(error)) return networkMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
