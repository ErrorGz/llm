const { defineConfig } = require('@vitejs/vite')
const vue = require('@vitejs/plugin-vue')
const path = require('path')

module.exports = defineConfig({
    plugins: [vue()],
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // 生产环境移除 console
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        },
        // 针对移动端的优化
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['vue']
                }
            }
        }
    }
}) 