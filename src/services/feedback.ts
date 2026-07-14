import { Platform } from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import SoundPlayer from 'react-native-sound-player';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const SUCCESS_SOUND_URL =
  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

export function playSuccessSound() {
  try {
    SoundPlayer.playUrl(SUCCESS_SOUND_URL);
  } catch {
    // Sound optional
  }
}

export function triggerSuccessHaptic() {
  ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
}

export function triggerErrorHaptic() {
  ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
}

export function triggerLightHaptic() {
  ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
}

export function celebrateAttendance() {
  triggerSuccessHaptic();
  playSuccessSound();
}
