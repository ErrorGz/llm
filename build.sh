#!/bin/bash

# 清理旧的构建文件
rm -rf dist
rm -rf android/app/src/main/assets/public

# 安装依赖
npm install

# 执行生产环境构建
npm run build:prod

# 确保 Android 平台已添加
if grep -q "android" capacitor.config.json; then
    echo "Android 平台已存在，跳过添加..."
else
    echo "正在添加 Android 平台..."
    npx cap add android
fi

# 将构建后的文件复制到 Android 项目
npx cap sync android

# 使用 Gradle 构建 Android 应用
cd android
./gradlew assembleRelease

# 复制 APK 到 NAS
echo "正在复制 APK 到 NAS..."
cd ~/dev/llm/android/app/build/outputs/apk/release
smbclient //Hea_NAS/home -U ErrorGz Hea@223344 -c "put app-release.apk"
cd ../../../../../../

echo "构建完成！"
echo "Web 输出目录: ./dist"
echo "Android APK 输出目录: ./android/app/build/outputs/apk/release/app-release.apk"
