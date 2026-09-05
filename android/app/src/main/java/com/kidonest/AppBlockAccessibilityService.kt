package com.kidonest

import android.accessibilityservice.AccessibilityService
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent

class AppBlockAccessibilityService : AccessibilityService() {

  private val handler = Handler(Looper.getMainLooper())
  private var lastBlockedPkg: String? = null
  private var lastBlockedAt: Long = 0L

  private val pollRunnable = object : Runnable {
    override fun run() {
      if (AppBlockPrefs.isMonitoringEnabled(this@AppBlockAccessibilityService)) {
        checkForegroundPackage(null)
      }
      handler.postDelayed(this, POLL_INTERVAL_MS)
    }
  }

  override fun onServiceConnected() {
    super.onServiceConnected()
    AppBlockPrefs.setAccessibilityConnected(this, true)
    handler.post(pollRunnable)
  }

  override fun onUnbind(intent: Intent?): Boolean {
    AppBlockPrefs.setAccessibilityConnected(this, false)
    return super.onUnbind(intent)
  }

  override fun onDestroy() {
    handler.removeCallbacks(pollRunnable)
    AppBlockPrefs.setAccessibilityConnected(this, false)
    super.onDestroy()
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    if (AppBlockPrefs.isBlockScreenActive(this)) return

    when (event.eventType) {
      AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED,
      AccessibilityEvent.TYPE_WINDOWS_CHANGED -> checkForegroundPackage(event)
    }
  }

  override fun onInterrupt() {}

  private fun checkForegroundPackage(event: AccessibilityEvent?) {
    if (!AppBlockPrefs.isMonitoringEnabled(this)) return
    if (AppBlockPrefs.isBlockScreenActive(this)) return

    val pkg = event?.packageName?.toString()
      ?: rootInActiveWindow?.packageName?.toString()
      ?: return

    if (isIgnoredPackage(pkg)) return
    if (pkg == packageName) return

    if (!AppBlockPrefs.isBlocked(this, pkg)) return

    val now = System.currentTimeMillis()
    if (pkg == lastBlockedPkg && now - lastBlockedAt < BLOCK_COOLDOWN_MS) return
    lastBlockedPkg = pkg
    lastBlockedAt = now

    blockApp(pkg)
  }

  private fun isIgnoredPackage(pkg: String): Boolean {
    return pkg.startsWith("com.android.systemui") ||
      pkg.contains("launcher", ignoreCase = true) ||
      pkg.startsWith("com.oneplus.launcher") ||
      pkg.startsWith("com.google.android.apps.nexuslauncher")
  }

  private fun blockApp(pkg: String) {
    if (AppBlockPrefs.isBlockScreenActive(this)) return

    killPackage(pkg)
    performGlobalAction(GLOBAL_ACTION_BACK)

    AppBlockPrefs.setBlockScreenActive(this, true)

    val intent = Intent(this, BlockedAppActivity::class.java).apply {
      addFlags(
        Intent.FLAG_ACTIVITY_NEW_TASK or
          Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP,
      )
      putExtra(BlockedAppActivity.EXTRA_BLOCKED_PACKAGE, pkg)
    }
    startActivity(intent)
  }

  private fun killPackage(packageName: String) {
    try {
      val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      am.killBackgroundProcesses(packageName)
    } catch (_: Exception) {
      // Best effort.
    }
  }

  companion object {
    private const val POLL_INTERVAL_MS = 200L
    private const val BLOCK_COOLDOWN_MS = 2000L
  }
}
