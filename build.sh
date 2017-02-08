cd _dev; gulp dist; cd ..;
phonegap build android --debug --device
cp ./platforms/android/build/outputs/apk/android-debug.apk /usr/local/Cellar/android-sdk/24.4.1_1/tools/
mv ./platforms/android/build/outputs/apk/android-debug.apk /Users/mo/RealDropbox/Dropbox/
