import { NativeModules } from 'react-native';

export interface LivenessResult {
  blinkDetected: boolean;
  faceDetected: boolean;
  confidence: number;
  message: string;
}

export interface FaceQualityResult {
  valid: boolean;
  leftEyeOpen: number;
  rightEyeOpen: number;
  smilingProbability: number;
  headTurnY: number;
  headTurnZ: number;
  message: string;
}

interface LivenessModuleInterface {
  detectBlinkFromFrames(imagePaths: string[]): Promise<LivenessResult>;
  validateFaceQuality(imagePath: string): Promise<FaceQualityResult>;
}

const { LivenessModule } = NativeModules;

export default LivenessModule as LivenessModuleInterface;
