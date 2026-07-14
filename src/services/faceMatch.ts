import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import { FACE_MATCH_THRESHOLD } from '../constants/config';

export async function detectFaces(imagePath: string): Promise<Face[]> {
  try {
    const faces = await FaceDetection.detect(imagePath, {
      performanceMode: 'accurate',
      landmarkMode: 'all',
      classificationMode: 'all',
      minFaceSize: 0.15,
    });
    return faces;
  } catch {
    return [];
  }
}

function getFaceMetrics(face: Face) {
  const bounds = face.frame;
  const area = bounds.width * bounds.height;
  const leftEye = face.leftEyeOpenProbability ?? 0.5;
  const rightEye = face.rightEyeOpenProbability ?? 0.5;
  const smile = face.smilingProbability ?? 0;
  const headY = Math.abs(face.rotationY ?? 0);
  const headZ = Math.abs(face.rotationZ ?? 0);
  return { area, leftEye, rightEye, smile, headY, headZ };
}

function compareFaces(captured: Face, reference: Face): number {
  const c = getFaceMetrics(captured);
  const r = getFaceMetrics(reference);

  const eyeScore = 100 - Math.abs(c.leftEye - r.leftEye) * 50 - Math.abs(c.rightEye - r.rightEye) * 50;
  const poseScore = 100 - Math.abs(c.headY - r.headY) * 2 - Math.abs(c.headZ - r.headZ) * 2;
  const sizeRatio = Math.min(c.area, r.area) / Math.max(c.area, r.area);
  const sizeScore = sizeRatio * 100;

  const score = eyeScore * 0.2 + poseScore * 0.3 + sizeScore * 0.5;
  return Math.max(0, Math.min(100, score));
}

export async function matchFaceWithReferences(
  capturedImagePath: string,
  references: Array<{ id: number; face_photo: string; full_name: string; roll_number: string }>,
): Promise<{
  matched: boolean;
  studentId: number | null;
  studentName: string | null;
  rollNumber: string | null;
  confidence: number;
}> {
  const capturedFaces = await detectFaces(capturedImagePath);
  if (capturedFaces.length === 0) {
    return {
      matched: false,
      studentId: null,
      studentName: null,
      rollNumber: null,
      confidence: 0,
    };
  }

  const capturedFace = capturedFaces[0];
  let bestMatch = { id: 0, name: '', roll: '', confidence: 0 };

  for (const ref of references) {
    if (!ref.face_photo) continue;
    const refFaces = await detectFaces(ref.face_photo);
    if (refFaces.length === 0) continue;

    const confidence = compareFaces(capturedFace, refFaces[0]);
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        id: ref.id,
        name: ref.full_name,
        roll: ref.roll_number,
        confidence,
      };
    }
  }

  const matched = bestMatch.confidence >= FACE_MATCH_THRESHOLD;

  return {
    matched,
    studentId: matched ? bestMatch.id : null,
    studentName: matched ? bestMatch.name : null,
    rollNumber: matched ? bestMatch.roll : null,
    confidence: Math.round(bestMatch.confidence * 10) / 10,
  };
}

export async function validateCapturedFace(imagePath: string): Promise<{
  valid: boolean;
  message: string;
}> {
  const faces = await detectFaces(imagePath);
  if (faces.length === 0) {
    return { valid: false, message: 'No face detected. Center your face in the oval.' };
  }
  if (faces.length > 1) {
    return { valid: false, message: 'Multiple faces detected. Only one person please.' };
  }

  const face = faces[0];
  const leftEye = face.leftEyeOpenProbability ?? 0;
  const rightEye = face.rightEyeOpenProbability ?? 0;
  const headY = Math.abs(face.rotationY ?? 0);
  const headZ = Math.abs(face.rotationZ ?? 0);

  if (headY > 20) return { valid: false, message: 'Look straight at the camera' };
  if (headZ > 15) return { valid: false, message: 'Keep your head level' };
  if (leftEye < 0.4 || rightEye < 0.4) {
    return { valid: false, message: 'Open your eyes fully' };
  }

  return { valid: true, message: 'Face detected successfully' };
}
