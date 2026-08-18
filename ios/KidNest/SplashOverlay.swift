import UIKit

/// Plain gradient backdrop while React Native loads — animated splash owns all branding.
final class SplashOverlay {
  static let shared = SplashOverlay()

  private var overlay: UIView?

  private init() {}

  func show(on window: UIWindow) {
    guard overlay == nil else { return }

    let view = UIView(frame: window.bounds)
    view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.isUserInteractionEnabled = false
    view.backgroundColor = UIColor(red: 243 / 255, green: 238 / 255, blue: 255 / 255, alpha: 1)
    window.addSubview(view)
    overlay = view
  }

  func hide() {
    guard let overlay else { return }
    UIView.animate(
      withDuration: 0.25,
      delay: 0,
      options: [.curveEaseOut],
      animations: { overlay.alpha = 0 },
      completion: { _ in
        overlay.removeFromSuperview()
        self.overlay = nil
      }
    )
  }
}
