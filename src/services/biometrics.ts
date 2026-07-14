import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export async function isBiometricAvailable(): Promise<{
  available: boolean;
  biometryType: string | null;
}> {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    let typeName: string | null = null;
    if (biometryType === BiometryTypes.TouchID) typeName = 'Touch ID';
    else if (biometryType === BiometryTypes.FaceID) typeName = 'Face ID';
    else if (biometryType === BiometryTypes.Biometrics) typeName = 'Fingerprint';
    return { available, biometryType: typeName };
  } catch {
    return { available: false, biometryType: null };
  }
}

export async function promptBiometric(
  promptMessage = 'Verify your identity to continue',
): Promise<boolean> {
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    return success;
  } catch {
    return false;
  }
}

export async function createBiometricKeys(): Promise<boolean> {
  try {
    const { keysExist } = await rnBiometrics.biometricKeysExist();
    if (!keysExist) {
      await rnBiometrics.createKeys();
    }
    return true;
  } catch {
    return false;
  }
}
