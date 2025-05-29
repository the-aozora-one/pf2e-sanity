import copy from 'rollup-plugin-copy'
import scss from 'rollup-plugin-scss'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        sourcemap: true,
        rollupOptions: {
            input: './src/index.js',
            output: {
                dir: 'dist',
                entryFileNames: 'index.js',
                format: 'umd',
            },
        },
    },
    plugins: [
        scss({
            output: 'dist/module.css',
            sourceMap: true,
            watch: [
                'src/styles/module.scss',
            ],
        }),
        copy({
            targets: [
                {
                    src: 'src/lang',
                    dest: 'dist',
                }, {
                    src: 'src/templates',
                    dest: 'dist',
                },
            ],
            hook: 'writeBundle',
        }),
    ],
})