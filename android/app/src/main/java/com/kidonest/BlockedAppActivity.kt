package com.kidonest

import android.app.Activity
import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.view.animation.AlphaAnimation
import android.view.animation.DecelerateInterpolator
import android.widget.Button
import android.widget.TextView
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class BlockedAppActivity : Activity() {

  private var blockedPackage: String? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setupWindow()
    setContentView(R.layout.activity_blocked_app)
    bindContent(intent)
    animateIn()
  }

  override fun onNewIntent(intent: Intent?) {
    super.onNewIntent(intent)
    if (intent != null) {
      setIntent(intent)
      bindContent(intent)
    }
  }

  override fun onResume() {
    super.onResume()
    AppBlockPrefs.setBlockScreenActive(this, true)
    blockedPackage?.let { killPackage(it) }
  }

  override fun onPause() {
    AppBlockPrefs.setBlockScreenActive(this, false)
    super.onPause()
  }

  @Deprecated("Deprecated in Java")
  override fun onBackPressed() {
    openKidNest()
  }

  private fun setupWindow() {
    WindowCompat.setDecorFitsSystemWindows(window, false)
    window.addFlags(
      WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON,
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    }

    WindowInsetsControllerCompat(window, window.decorView).apply {
      hide(WindowInsetsCompat.Type.systemBars())
      systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
  }

  private fun bindContent(source: Intent) {
    blockedPackage = source.getStringExtra(EXTRA_BLOCKED_PACKAGE)
    val appLabel = resolveAppLabel(blockedPackage)

    findViewById<TextView>(R.id.blocked_app_name).text =
      getString(R.string.blocked_app_format, appLabel)

    findViewById<Button>(R.id.back_to_kidnest).setOnClickListener {
      openKidNest()
    }
  }

  private fun resolveAppLabel(packageName: String?): String {
    if (packageName.isNullOrBlank()) return "This app"
    return try {
      val pm = packageManager
      val info = pm.getApplicationInfo(packageName, 0)
      pm.getApplicationLabel(info).toString()
    } catch (_: PackageManager.NameNotFoundException) {
      "This app"
    }
  }

  private fun killPackage(packageName: String) {
    try {
      val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      am.killBackgroundProcesses(packageName)
    } catch (_: Exception) {
      // Best effort.
    }
  }

  private fun openKidNest() {
    AppBlockPrefs.setBlockScreenActive(this, false)
    val launch = packageManager.getLaunchIntentForPackage(packageName)
    if (launch != null) {
      launch.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      startActivity(launch)
      overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
    finish()
  }

  private fun animateIn() {
    val root = findViewById<View>(android.R.id.content)
    val fade = AlphaAnimation(0f, 1f).apply {
      duration = 220
      interpolator = DecelerateInterpolator()
    }
    root.startAnimation(fade)
  }

  companion object {
    const val EXTRA_BLOCKED_PACKAGE = "blocked_package"
  }
}
