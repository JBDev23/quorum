import * as LocalAuthentication from "expo-local-authentication";

export async function canUseBiometrics(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    return {
      ok: false,
      reason: "Este dispositivo no tiene autenticación biométrica.",
    };
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    return {
      ok: false,
      reason:
        "No hay huella o Face ID configurados. Actívalo en los ajustes del sistema.",
    };
  }

  return { ok: true };
}

/** Prompt biometric auth. Returns true if the user authenticated successfully. */
export async function authenticateForVote(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirma tu identidad para votar",
    cancelLabel: "Cancelar",
    disableDeviceFallback: false,
  });
  return result.success;
}
