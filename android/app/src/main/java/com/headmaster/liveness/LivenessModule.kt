package com.headmaster.liveness

import android.graphics.BitmapFactory
import android.net.Uri
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import java.io.File
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import kotlin.math.abs

class LivenessModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "LivenessModule"

    private fun buildDetector(): FaceDetector {
        val options = FaceDetectorOptions.Builder()
            .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
            .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
            .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
            .setMinFaceSize(0.15f)
            .enableTracking()
            .build()
        return FaceDetection.getClient(options)
    }

    @ReactMethod
    fun detectBlinkFromFrames(imagePaths: ReadableArray, promise: Promise) {
        if (imagePaths.size() < 3) {
            promise.reject("INSUFFICIENT_FRAMES", "Need at least 3 frames for blink detection")
            return
        }

        val detector = buildDetector()
        val eyeStates = mutableListOf<Pair<Float, Float>>()
        var processed = 0
        val latch = CountDownLatch(imagePaths.size())

        for (i in 0 until imagePaths.size()) {
            val path = imagePaths.getString(i) ?: continue
            val file = File(path.replace("file://", ""))
            if (!file.exists()) {
                latch.countDown()
                continue
            }

            val bitmap = BitmapFactory.decodeFile(file.absolutePath)
            if (bitmap == null) {
                latch.countDown()
                continue
            }

            val image = InputImage.fromBitmap(bitmap, 0)
            detector.process(image)
                .addOnSuccessListener { faces ->
                    if (faces.isNotEmpty()) {
                        val face = faces[0]
                        val left = face.leftEyeOpenProbability ?: 0.5f
                        val right = face.rightEyeOpenProbability ?: 0.5f
                        synchronized(eyeStates) {
                            eyeStates.add(Pair(left, right))
                        }
                    }
                    processed++
                    latch.countDown()
                }
                .addOnFailureListener {
                    latch.countDown()
                }
        }

        Thread {
            try {
                latch.await(10, TimeUnit.SECONDS)
                detector.close()

                if (eyeStates.size < 3) {
                    promise.reject("NO_FACE", "Could not detect face in enough frames. Hold still and blink.")
                    return@Thread
                }

                val avgOpen = eyeStates.map { (l, r) -> (l + r) / 2f }
                var blinkDetected = false

                for (i in 1 until avgOpen.size) {
                    val drop = avgOpen[i - 1] - avgOpen[i]
                    // Soft blink threshold — works with lighting lag on phones
                    if (drop > 0.12f && avgOpen[i] < 0.6f) {
                        blinkDetected = true
                        break
                    }
                    // open after closed
                    val rise = avgOpen[i] - avgOpen[i - 1]
                    if (rise > 0.12f && avgOpen[i - 1] < 0.55f) {
                        blinkDetected = true
                        break
                    }
                }

                // Eyes closed then open range pattern
                if (!blinkDetected) {
                    val minVal = avgOpen.minOrNull() ?: 1f
                    val maxVal = avgOpen.maxOrNull() ?: 0f
                    if (maxVal - minVal > 0.15f && minVal < 0.55f) {
                        blinkDetected = true
                    }
                }

                // Soft fallback: face across frames + mild eye variation (slow blinks)
                if (!blinkDetected && eyeStates.size >= 4) {
                    val variation = (avgOpen.maxOrNull() ?: 0f) - (avgOpen.minOrNull() ?: 0f)
                    if (variation > 0.08f) {
                        blinkDetected = true
                    }
                }

                val result = Arguments.createMap().apply {
                    putBoolean("blinkDetected", blinkDetected)
                    putBoolean("faceDetected", true)
                    putDouble("confidence", if (blinkDetected) 92.0 else 30.0)
                    putString("message", if (blinkDetected)
                        "Liveness verified successfully"
                    else
                        "Please blink your eyes naturally and try again")
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("LIVENESS_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun validateFaceQuality(imagePath: String, promise: Promise) {
        val detector = buildDetector()
        val file = File(imagePath.replace("file://", ""))

        if (!file.exists()) {
            promise.reject("FILE_NOT_FOUND", "Image file not found")
            return
        }

        val bitmap = BitmapFactory.decodeFile(file.absolutePath)
        if (bitmap == null) {
            promise.reject("INVALID_IMAGE", "Could not decode image")
            return
        }

        val image = InputImage.fromBitmap(bitmap, 0)
        detector.process(image)
            .addOnSuccessListener { faces ->
                detector.close()
                if (faces.isEmpty()) {
                    val result = Arguments.createMap().apply {
                        putBoolean("valid", false)
                        putString("message", "No face detected. Center your face in the frame.")
                    }
                    promise.resolve(result)
                    return@addOnSuccessListener
                }

                val face = faces[0]
                val leftEye = face.leftEyeOpenProbability ?: 0.5f
                val rightEye = face.rightEyeOpenProbability ?: 0.5f
                val smiling = face.smilingProbability ?: 0f
                val headEulerY = abs(face.headEulerAngleY)
                val headEulerZ = abs(face.headEulerAngleZ)

                val valid = leftEye > 0.5f && rightEye > 0.5f &&
                    headEulerY < 20f && headEulerZ < 15f

                val result = Arguments.createMap().apply {
                    putBoolean("valid", valid)
                    putDouble("leftEyeOpen", leftEye.toDouble())
                    putDouble("rightEyeOpen", rightEye.toDouble())
                    putDouble("smilingProbability", smiling.toDouble())
                    putDouble("headTurnY", headEulerY.toDouble())
                    putDouble("headTurnZ", headEulerZ.toDouble())
                    putString("message", when {
                        headEulerY >= 20f -> "Turn your face straight to the camera"
                        headEulerZ >= 15f -> "Keep your head level"
                        leftEye <= 0.5f || rightEye <= 0.5f -> "Open your eyes fully"
                        else -> "Face quality is good"
                    })
                }
                promise.resolve(result)
            }
            .addOnFailureListener { e ->
                detector.close()
                promise.reject("FACE_ERROR", e.message, e)
            }
    }
}
