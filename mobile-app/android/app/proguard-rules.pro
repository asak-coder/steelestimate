# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native / Hermes safe rules
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.swmansion.** { *; }
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.react.**
-dontwarn com.facebook.hermes.**
-dontwarn com.swmansion.**
-dontwarn com.facebook.jni.**

# React Native autolinking / native modules
-keep class * extends com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.ReactPackage { *; }
-keep class * implements com.facebook.react.ReactPackage { *; }
-keep class * extends com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }
-keep class * implements com.facebook.react.turbomodule.core.interfaces.TurboModule { *; }

# React annotations and reflection used by some libraries
-keepclassmembers class * {
    @com.facebook.proguard.annotations.DoNotStrip *;
}
-keepattributes *Annotation*, InnerClasses, EnclosingMethod, Signature

# Networking / serialization
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-dontwarn org.conscrypt.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# AsyncStorage and common RN libs
-keep class com.reactnativecommunity.asyncstorage.** { *; }
-dontwarn com.reactnativecommunity.asyncstorage.**

# Preserve React Native JavaScript interface classes
-keep class com.facebook.react.modules.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep enums and helper classes used across the app
-keepclassmembers enum * { *; }
-keepclassmembers class * {
    public <init>(...);
}
