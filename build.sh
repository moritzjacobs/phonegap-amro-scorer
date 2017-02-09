source ~/.bash_profile
cd _dev; gulp dist; cd ..;
phonegap build android --debug --device
cp ./platforms/android/build/outputs/apk/android-debug.apk $ANDROID_SDK/tools/
mv ./platforms/android/build/outputs/apk/android-debug.apk $DROPBOX_HOME/android-debug/
