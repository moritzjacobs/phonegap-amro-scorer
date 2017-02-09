source ~/.bash_profile
echo "android avd" starts emulator
cd $ANDROID_SDK/tools
adb uninstall de.moritzjacobs.pg.appname
adb install android-debug.apk