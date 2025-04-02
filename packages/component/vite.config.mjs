import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgVersion = process.env.npm_package_version || '0.0.0';

export default defineConfig({
  plugins: [
    react({
      // Include .js files that contain JSX
      include: /\.(jsx|js)$/
    }),
    dts({
      include: ['src/**/*.js'],
      beforeWriteFile: (filePath, content) => ({
        filePath: filePath.replace('.d.ts', '.d.ts'),
        content
      })
    })
  ],
  define: {
    'process.env.VITE_APP_VERSION': JSON.stringify(pkgVersion)
  },
  build: {
    outDir: 'build',
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'ReactScrollToBottom',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        switch (format) {
          case 'es':
            return `esm/index.js`;
          case 'cjs':
            return `index.js`;
          case 'umd':
            return `dist/react-scroll-to-bottom.development.js`;
        }
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'classnames', 'math-random', 'simple-update-in'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'classnames': 'classNames',
          'math-random': 'mathRandom',
          'simple-update-in': 'updateIn'
        },
        exports: 'named'
      }
    },
    sourcemap: true,
    minify: false
  },
  resolve: {
    extensions: ['.mjs', '.js', '.jsx', '.json']
  },
  esbuild: {
    loader: 'jsx',
    include: /\.(jsx|js)$/,
    exclude: []
  }
});
