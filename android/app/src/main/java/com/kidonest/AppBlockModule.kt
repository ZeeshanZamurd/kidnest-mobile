package com.kidonest

import android.Manifest
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener

class AppBlockModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private var appListPermissionPromise: Promise? = null

  private val appListPermissionListener = PermissionListener { requestCode, _, grantResults ->
    if (requestCode != REQUEST_APP_LIST) return@PermissionListener false
    val granted = grantResults.isNotEmpty() &&
      grantResults[0] == PackageManager.PERMISSION_GRANTED
    appListPermissionPromise?.resolve(granted)
    appListPermissionPromise = null
    true
  }

  override fun getName(): String = "KidNestAppBlock"

  private fun isGetInstalledAppsPermissionDeclared(): Boolean {
    return try {
      reactContext.packageManager.getPermissionInfo(GET_INSTALLED_APPS, 0)
      true
    } catch (_: PackageManager.NameNotFoundException) {
      false
    }
  }

  /** OnePlus/Oppo grant app-list in Settings without updating checkSelfPermission. */
  private fun probeAppListAccess(): Boolean {
    val pm = reactContext.packageManager

    try {
      val installed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.getInstalledApplications(PackageManager.ApplicationInfoFlags.of(0L))
      } else {
        @Suppress("DEPRECATION")
        pm.getInstalledApplications(0)
      }
      if (installed.any { it.packageName == "android" }) return true
    } catch (e: Exception) {
      Log.w("KidNestAppBlock", "probe getInstalledApplications failed", e)
    }

    val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val launcherCount = try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.queryIntentActivities(launcherIntent, PackageManager.ResolveInfoFlags.of(0L)).size
      } else {
        @Suppress("DEPRECATION")
        pm.queryIntentActivities(launcherIntent, 0).size
      }
    } catch (e: Exception) {
      Log.w("KidNestAppBlock", "probe queryIntentActivities failed", e)
      0
    }

    return launcherCount >= 3
  }

  private fun hasAppListPermissionInternal(): Boolean {
    if (queryLaunchableApps().isNotEmpty()) return true
    if (probeAppListAccess()) return true
    if (!isGetInstalledAppsPermissionDeclared()) return true
    return ContextCompat.checkSelfPermission(reactContext, GET_INSTALLED_APPS) ==
      PackageManager.PERMISSION_GRANTED
  }

  @ReactMethod
  fun getInstalledApps(promise: Promise) {
    try {
      val apps = queryLaunchableApps()
      val result = Arguments.createArray()
      for ((pkg, label) in apps) {
        val map = Arguments.createMap()
        map.putString("packageName", pkg)
        map.putString("appLabel", label)
        result.pushMap(map)
      }
      promise.resolve(result)
    } catch (e: Exception) {
      promise.reject("APP_LIST_ERROR", e.message, e)
    }
  }

  @ReactMethod
  fun hasAppListPermission(promise: Promise) {
    promise.resolve(hasAppListPermissionInternal())
  }

  @ReactMethod
  fun requestAppListPermission(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      if (hasAppListPermissionInternal()) {
        promise.resolve(true)
        return@runOnUiThread
      }

      if (!isGetInstalledAppsPermissionDeclared()) {
        promise.resolve(probeAppListAccess())
        return@runOnUiThread
      }

      val activity = reactContext.currentActivity as? PermissionAwareActivity
      if (activity == null) {
        promise.reject("NO_ACTIVITY", "Activity not available")
        return@runOnUiThread
      }

      // OnePlus/Oppo often grant via Settings without a runtime dialog — don't re-request if
      // the OS reports denied but we can already read apps.
      if (ContextCompat.checkSelfPermission(reactContext, GET_INSTALLED_APPS) !=
        PackageManager.PERMISSION_GRANTED
      ) {
        if (probeAppListAccess()) {
          promise.resolve(true)
          return@runOnUiThread
        }
      }

      appListPermissionPromise = promise
      activity.requestPermissions(
        arrayOf(GET_INSTALLED_APPS),
        REQUEST_APP_LIST,
        appListPermissionListener,
      )
    }
  }

  @ReactMethod
  fun openAppListPermissionSettings(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      val intents = listOf(
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = Uri.fromParts("package", reactContext.packageName, null)
        },
        Intent().apply {
          action = "com.oplus.security.permission.AppListPermissionActivity"
          putExtra("packageName", reactContext.packageName)
        },
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS),
      )

      for (intent in intents) {
        try {
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          val activity = reactContext.currentActivity
          if (activity != null && !activity.isFinishing) {
            activity.startActivity(intent)
          } else {
            reactContext.startActivity(intent)
          }
          promise.resolve(true)
          return@runOnUiThread
        } catch (e: Exception) {
          Log.w("KidNestAppBlock", "App list settings intent failed", e)
        }
      }

      promise.reject("NO_SETTINGS", "Could not open app list permission settings")
    }
  }

  @ReactMethod
  fun getDeviceInfo(promise: Promise) {
    val map = Arguments.createMap()
    map.putString("manufacturer", Build.MANUFACTURER ?: "")
    map.putString("brand", Build.BRAND ?: "")
    map.putString("model", Build.MODEL ?: "")
    promise.resolve(map)
  }

  @ReactMethod
  fun hasAccessibilityPermission(promise: Promise) {
    promise.resolve(isAccessibilityEnabled())
  }

  @ReactMethod
  fun openAccessibilitySettings(promise: Promise) {
    UiThreadUtil.runOnUiThread {
      val component = ComponentName(
        reactContext.packageName,
        AppBlockAccessibilityService::class.java.name,
      )

      for (intent in buildAccessibilityIntents(component)) {
        try {
          intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
          val activity = reactContext.currentActivity
          if (activity != null && !activity.isFinishing) {
            activity.startActivity(intent)
          } else {
            reactContext.startActivity(intent)
          }
          promise.resolve(true)
          return@runOnUiThread
        } catch (e: Exception) {
          Log.w("KidNestAppBlock", "Intent failed: ${intent.action}", e)
        }
      }

      promise.reject("NO_SETTINGS", "Could not open accessibility settings on this device")
    }
  }

  @ReactMethod
  fun setBlockedPackages(packages: ReadableArray) {
    val set = mutableSetOf<String>()
    for (i in 0 until packages.size()) {
      val value = packages.getString(i)
      if (!value.isNullOrBlank()) set.add(value)
    }
    AppBlockPrefs.setBlockedPackages(reactContext, set)
  }

  @ReactMethod
  fun setMonitoringEnabled(enabled: Boolean) {
    AppBlockPrefs.setMonitoringEnabled(reactContext, enabled)
  }

  @ReactMethod
  fun isMonitoringEnabled(promise: Promise) {
    promise.resolve(AppBlockPrefs.isMonitoringEnabled(reactContext))
  }

  private fun queryLaunchableApps(): List<Pair<String, String>> {
    val pm = reactContext.packageManager
    val ownPackage = reactContext.packageName
    val seen = mutableSetOf<String>()
    val result = mutableListOf<Pair<String, String>>()

    fun addApp(pkg: String, appInfo: ApplicationInfo? = null) {
      if (pkg == ownPackage || seen.contains(pkg)) return
      seen.add(pkg)

      val info: ApplicationInfo = appInfo ?: try {
        pm.getApplicationInfo(pkg, 0)
      } catch (_: Exception) {
        return
      }

      val label = pm.getApplicationLabel(info).toString()
      result.add(pkg to label)
    }

    val launcherIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val resolveList = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      pm.queryIntentActivities(launcherIntent, PackageManager.ResolveInfoFlags.of(0L))
    } else {
      @Suppress("DEPRECATION")
      pm.queryIntentActivities(launcherIntent, 0)
    }

    for (resolveInfo in resolveList) {
      addApp(resolveInfo.activityInfo.packageName)
    }

    if (result.size < 5) {
      val installed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        pm.getInstalledApplications(PackageManager.ApplicationInfoFlags.of(0L))
      } else {
        @Suppress("DEPRECATION")
        pm.getInstalledApplications(0)
      }

      for (appInfo in installed) {
        if (pm.getLaunchIntentForPackage(appInfo.packageName) != null) {
          addApp(appInfo.packageName, appInfo)
        }
      }
    }

    if (result.isEmpty()) {
      try {
        @Suppress("DEPRECATION")
        val withInternet = pm.getPackagesHoldingPermissions(arrayOf(Manifest.permission.INTERNET), 0)
        for (pkgInfo in withInternet) {
          addApp(pkgInfo.packageName, pkgInfo.applicationInfo)
        }
      } catch (e: Exception) {
        Log.w("KidNestAppBlock", "getPackagesHoldingPermissions failed", e)
      }
    }

    return result.sortedBy { it.second.lowercase() }
  }

  private fun buildAccessibilityIntents(component: ComponentName): List<Intent> {
    val componentFlat = component.flattenToString()
    val intents = mutableListOf<Intent>()

    intents.add(
      Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        putExtra(":settings:fragment_args_key", componentFlat)
        putExtra(
          ":settings:show_fragment",
          "com.android.settings.accessibility.ToggleAccessibilityServicePreferenceFragment",
        )
      },
    )

    intents.add(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))

    intents.add(
      Intent().apply {
        setClassName("com.android.settings", "com.android.settings.SubSettings")
        putExtra(":settings:show_fragment", "com.android.settings.accessibility.ToggleAccessibilityServicePreferenceFragment")
        putExtra(":settings:fragment_args_key", componentFlat)
      },
    )

    intents.add(
      Intent("android.settings.ACCESSIBILITY_DETAILS_SETTINGS").apply {
        putExtra(Intent.EXTRA_COMPONENT_NAME, componentFlat)
      },
    )

    intents.add(
      Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        setPackage("com.android.settings")
      },
    )

    intents.add(
      Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
        setPackage("com.oneplus.settings")
      },
    )

    intents.add(
      Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
        data = Uri.fromParts("package", reactContext.packageName, null)
      },
    )

    return intents
  }

  private fun isAccessibilityEnabled(): Boolean {
    val pkg = reactContext.packageName
    val serviceSimple = AppBlockAccessibilityService::class.java.simpleName
    val serviceFull = AppBlockAccessibilityService::class.java.name

    try {
      val am = reactContext.getSystemService(Context.ACCESSIBILITY_SERVICE) as? AccessibilityManager
      if (am != null) {
        @Suppress("DEPRECATION")
        val services = am.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        if (services.any {
          val si = it.resolveInfo.serviceInfo
          si.packageName.equals(pkg, ignoreCase = true) &&
            (si.name.contains("AppBlockAccessibility", ignoreCase = true) ||
              si.name.endsWith(serviceSimple, ignoreCase = true))
        }) {
          return true
        }
      }
    } catch (e: Exception) {
      Log.w("KidNestAppBlock", "AccessibilityManager check failed", e)
    }

    val enabledServices = Settings.Secure.getString(
      reactContext.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
    ) ?: return false

    if (enabledServices.isBlank()) return false

    return enabledServices.split(':').any { entry ->
      val normalized = entry.trim()
      normalized.contains(pkg, ignoreCase = true) &&
        (normalized.contains("AppBlockAccessibility", ignoreCase = true) ||
          normalized.contains(serviceSimple, ignoreCase = true) ||
          normalized.equals("$pkg/$serviceFull", ignoreCase = true) ||
          normalized.equals("$pkg/.$serviceSimple", ignoreCase = true))
    }
  }

  companion object {
    private const val GET_INSTALLED_APPS = "com.android.permission.GET_INSTALLED_APPS"
    private const val REQUEST_APP_LIST = 9912
  }
}
