import Foundation
import UIKit
import Vision
import React

@objc(LivenessModule)
class LivenessModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc func detectBlinkFromFrames(
    _ imagePaths: [String],
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard imagePaths.count >= 3 else {
      reject("INSUFFICIENT_FRAMES", "Need at least 3 frames", nil)
      return
    }

    var eyeOpenValues: [Float] = []
    let group = DispatchGroup()

    for path in imagePaths {
      group.enter()
      guard let image = loadImage(from: path) else {
        group.leave()
        continue
      }

      detectFace(in: image) { face in
        if let face = face {
          eyeOpenValues.append(face)
        }
        group.leave()
      }
    }

    group.notify(queue: .main) {
      guard eyeOpenValues.count >= 3 else {
        reject("NO_FACE", "Could not detect face. Hold still and blink.", nil)
        return
      }

      var blinkDetected = false
      for i in 1..<eyeOpenValues.count {
        let drop = eyeOpenValues[i - 1] - eyeOpenValues[i]
        if drop > 0.3 && eyeOpenValues[i] < 0.4 {
          blinkDetected = true
          break
        }
      }

      if !blinkDetected {
        let minVal = eyeOpenValues.min() ?? 1
        let maxVal = eyeOpenValues.max() ?? 0
        if maxVal - minVal > 0.35 && minVal < 0.35 {
          blinkDetected = true
        }
      }

      resolve([
        "blinkDetected": blinkDetected,
        "faceDetected": true,
        "confidence": blinkDetected ? 92.0 : 30.0,
        "message": blinkDetected
          ? "Liveness verified successfully"
          : "Please blink your eyes naturally and try again"
      ])
    }
  }

  @objc func validateFaceQuality(
    _ imagePath: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let image = loadImage(from: imagePath) else {
      reject("FILE_NOT_FOUND", "Image not found", nil)
      return
    }

    detectFaceDetails(in: image) { result in
      resolve(result)
    }
  }

  private func loadImage(from path: String) -> UIImage? {
    let cleanPath = path.replacingOccurrences(of: "file://", with: "")
    if let image = UIImage(contentsOfFile: cleanPath) {
      return image
    }
    if let url = URL(string: path), let data = try? Data(contentsOf: url) {
      return UIImage(data: data)
    }
    return nil
  }

  private func detectFace(in image: UIImage, completion: @escaping (Float?) -> Void) {
    guard let cgImage = image.cgImage else {
      completion(nil)
      return
    }

    let request = VNDetectFaceLandmarksRequest { request, _ in
      guard let results = request.results as? [VNFaceObservation],
            let face = results.first,
            let landmarks = face.landmarks,
            let leftEye = landmarks.leftEye,
            let rightEye = landmarks.rightEye else {
        completion(nil)
        return
      }

      let leftOpen = self.estimateEyeOpenness(leftEye)
      let rightOpen = self.estimateEyeOpenness(rightEye)
      completion((leftOpen + rightOpen) / 2)
    }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    DispatchQueue.global(qos: .userInitiated).async {
      try? handler.perform([request])
    }
  }

  private func detectFaceDetails(in image: UIImage, completion: @escaping ([String: Any]) -> Void) {
    guard let cgImage = image.cgImage else {
      completion(["valid": false, "message": "Invalid image"])
      return
    }

    let request = VNDetectFaceLandmarksRequest { request, _ in
      guard let results = request.results as? [VNFaceObservation],
            let face = results.first else {
        completion(["valid": false, "message": "No face detected. Center your face."])
        return
      }

      let headY = abs(face.yaw?.doubleValue ?? 0) * 180 / .pi
      let headZ = abs(face.roll?.doubleValue ?? 0) * 180 / .pi
      let leftOpen = face.landmarks?.leftEye.map { self.estimateEyeOpenness($0) } ?? 0.5
      let rightOpen = face.landmarks?.rightEye.map { self.estimateEyeOpenness($0) } ?? 0.5

      let valid = leftOpen > 0.5 && rightOpen > 0.5 && headY < 20 && headZ < 15
      var message = "Face quality is good"
      if headY >= 20 { message = "Turn your face straight to the camera" }
      else if headZ >= 15 { message = "Keep your head level" }
      else if leftOpen <= 0.5 || rightOpen <= 0.5 { message = "Open your eyes fully" }

      completion([
        "valid": valid,
        "leftEyeOpen": leftOpen,
        "rightEyeOpen": rightOpen,
        "headTurnY": headY,
        "headTurnZ": headZ,
        "message": message
      ])
    }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    DispatchQueue.global(qos: .userInitiated).async {
      try? handler.perform([request])
    }
  }

  private func estimateEyeOpenness(_ eye: VNFaceLandmarkRegion2D) -> Float {
    let points = eye.normalizedPoints
    guard points.count >= 4 else { return 0.5 }
    let minY = points.map { $0.y }.min() ?? 0
    let maxY = points.map { $0.y }.max() ?? 0
    let openness = Float(maxY - minY) * 10
    return min(1, max(0, openness))
  }
}
