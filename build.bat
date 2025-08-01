@echo off
echo 清理旧的构建文件...
rd /s /q dist
rd /s /q android\app\src\main\assets\public

echo 安装依赖...
npm install

echo 执行生产环境构建...
npm run build:prod

echo 添加 Android 平台...
npx cap add android

echo 同步到 Android 项目...
npx cap sync android

echo 构建 Android 应用...
cd android
gradlew assembleRelease
cd ..

echo 正在复制 APK 到 NAS...
net use Z: \\Hea_NAS\home /user:ErrorGz Hea@223344
copy android\app\build\outputs\apk\release\app-release.apk Z:\
net use Z: /delete

echo 构建完成！
echo Web 输出目录: ./dist
echo Android APK 输出目录: ./android/app/build/outputs/apk/release/app-release.apk
pause 