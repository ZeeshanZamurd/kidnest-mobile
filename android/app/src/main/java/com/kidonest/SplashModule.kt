package com.kidonest

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SplashModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "KidNestSplash"

    @ReactMethod
    fun hide(promise: Promise) {
        SplashState.keepOnScreen = false
        promise.resolve(null)
    }
}
