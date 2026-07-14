#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LivenessModule, NSObject)

RCT_EXTERN_METHOD(detectBlinkFromFrames:(NSArray *)imagePaths
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(validateFaceQuality:(NSString *)imagePath
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
