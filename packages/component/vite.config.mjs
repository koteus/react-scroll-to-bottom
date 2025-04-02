import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgVersion = process.env.npm_package_version || '0.0.0';

// Check if we're building the browser bundle
const isBrowserBuild = process.env.BROWSER_BUILD === 'true';

export default defineConfig({
  plugins: [
    react({
      // Include .js files that contain JSX
      include: /\.(jsx|js)$/
    }),
    !isBrowserBuild && dts({
      include: ['src/**/*.js'],
      beforeWriteFile: (filePath, content) => {
        return {
          filePath: filePath.replace('.d.ts', '.d.ts'),
          content
        };
      }
    })
  ],
  define: {
    'process.env.VITE_APP_VERSION': JSON.stringify(pkgVersion)
  },
  build: isBrowserBuild ? {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/browser.js'),
      name: 'ReactScrollToBottom',
      formats: ['umd'],
      fileName: () => 'react-scroll-to-bottom.development.js'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    },
    sourcemap: true,
    minify: false
  } : {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.js'),
        browser: resolve(__dirname, 'src/browser.js')
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        return format === 'es'
          ? `esm/${entryName}.js`
          : `${entryName}.js`;
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
    target: 'es2020',
    outDir: 'lib',
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
