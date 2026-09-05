package com.kidonest

import android.content.Context

object AppBlockPrefs {
  private const val PREFS = "kidnest_app_block"
  private const val KEY_BLOCKED = "blocked_packages"
  private const val KEY_MONITORING = "monitoring_enabled"
  private const val KEY_BLOCK_SCREEN_ACTIVE = "block_screen_active"
  private const val KEY_ACCESSIBILITY_CONNECTED = "accessibility_connected"

  fun setBlockedPackages(context: Context, packages: Set<String>) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putStringSet(KEY_BLOCKED, packages.toSet())
      .commit()
  }

  fun getBlockedPackages(context: Context): Set<String> {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getStringSet(KEY_BLOCKED, emptySet()) ?: emptySet()
  }

  fun isBlocked(context: Context, packageName: String): Boolean {
    return getBlockedPackages(context).contains(packageName)
  }

  fun setMonitoringEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_MONITORING, enabled)
      .commit()
  }

  fun isMonitoringEnabled(context: Context): Boolean {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_MONITORING, false)
  }

  fun setBlockScreenActive(context: Context, active: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_BLOCK_SCREEN_ACTIVE, active)
      .commit()
  }

  fun isBlockScreenActive(context: Context): Boolean {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_BLOCK_SCREEN_ACTIVE, false)
  }

  fun setAccessibilityConnected(context: Context, connected: Boolean) {
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_ACCESSIBILITY_CONNECTED, connected)
      .commit()
  }

  fun isAccessibilityConnected(context: Context): Boolean {
    return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getBoolean(KEY_ACCESSIBILITY_CONNECTED, false)
  }
}
