import Foundation
import React

@objc(KidNestSplash)
class KidNestSplash: NSObject {
  @objc
  func hide(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      SplashOverlay.shared.hide()
      resolve(nil)
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }
}
