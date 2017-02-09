echo "android avd" starts emulator
cd $ANDROID_SDK/tools
adb uninstall de.moritzjacobs.pg.amroscorer
adb install android-debug.apk