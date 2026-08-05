import { defineConfig, type Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const sourceRoot = resolve(packageRoot, 'src');
const typesRoot = resolve(packageRoot, 'types');

const entries = {
  index: 'src/index.ts',
  icons: 'src/icons/index.ts',
  'icons.css': 'src/theme/fonts/icons/style.css',
  'inter.css': 'src/theme/fonts/inter/style.css',
  'geologica.css': 'src/theme/fonts/geologica/style.css',
  'theme.css': 'src/theme/theme.css',
  'theme.mobile.css': 'src/theme/theme.mobile.css',
  'theme.4k.desktop.css': 'src/theme/theme.4k.desktop.css',
  'theme.full-hd.desktop.css': 'src/theme/theme.full-hd.desktop.css',
};

const external = [
  'react',
  'react-dom',
  'classnames',
  'react/jsx-runtime',
  '@floating-ui/dom',
  '@floating-ui/react',
  '@react-input/mask',
  '@react-input/number-format',
  'date-fns',
  'moment',
  'moment-timezone',
  'react-slider',
];

const cssModuleOutputExtension = '.module.css';

interface IStaticCssAsset {
  readonly outputFileName: string;
  readonly sourceFilePath: string;
  readonly assetSourceDirectoryPath: string;
  readonly assetOutputDirectoryPath?: string;
}

const staticFontCssAssets: readonly IStaticCssAsset[] = [
  {
    outputFileName: 'icons.css',
    sourceFilePath: resolve(packageRoot, 'src/theme/fonts/icons/style.css'),
    assetSourceDirectoryPath: resolve(packageRoot, 'src/theme/fonts/icons/fonts'),
    assetOutputDirectoryPath: 'fonts',
  },
  {
    outputFileName: 'inter.css',
    sourceFilePath: resolve(packageRoot, 'src/theme/fonts/inter/style.css'),
    assetSourceDirectoryPath: resolve(packageRoot, 'src/theme/fonts/inter'),
  },
  {
    outputFileName: 'geologica.css',
    sourceFilePath: resolve(packageRoot, 'src/theme/fonts/geologica/style.css'),
    assetSourceDirectoryPath: resolve(packageRoot, 'src/theme/fonts/geologica'),
  },
];

const createRelativeBundlePath = (fromFileName: string, toFileName: string) => {
  const relativePath = posix.relative(posix.dirname(fromFileName), toFileName);

  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
};

const normalizeCssModuleOutput = (): Plugin => ({
  name: 'sellgar-kit:normalize-css-module-output',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    const renamedCssAssets = new Map<string, string>();

    for (const bundleItem of Object.values(bundle)) {
      if (bundleItem.type !== 'asset' || !bundleItem.fileName.endsWith(cssModuleOutputExtension)) {
        continue;
      }

      const nextFileName = `${bundleItem.fileName.slice(0, -cssModuleOutputExtension.length)}.css`;

      if (bundle[nextFileName]) {
        this.error(`Duplicate CSS asset output: ${nextFileName}`);
      }

      renamedCssAssets.set(bundleItem.fileName, nextFileName);
      bundleItem.fileName = nextFileName;
    }

    if (renamedCssAssets.size === 0) {
      return;
    }

    for (const bundleItem of Object.values(bundle)) {
      if (bundleItem.type !== 'chunk') {
        continue;
      }

      let code = bundleItem.code;

      for (const [previousFileName, nextFileName] of renamedCssAssets) {
        const previousImportPath = createRelativeBundlePath(bundleItem.fileName, previousFileName);
        const nextImportPath = createRelativeBundlePath(bundleItem.fileName, nextFileName);

        code = code.replaceAll(`'${previousImportPath}'`, `'${nextImportPath}'`).replaceAll(`"${previousImportPath}"`, `"${nextImportPath}"`);
      }

      bundleItem.code = code;
    }
  },
});

const preserveStaticFontCssAssets = (): Plugin => ({
  name: 'sellgar-kit:preserve-static-font-css-assets',
  apply: 'build',
  enforce: 'post',
  generateBundle(_, bundle) {
    for (const entry of staticFontCssAssets) {
      const bundleItem = bundle[entry.outputFileName];
      const cssSource = readFileSync(entry.sourceFilePath, 'utf8');

      if (!bundleItem) {
        this.emitFile({
          type: 'asset',
          fileName: entry.outputFileName,
          source: cssSource,
        });
      } else if (bundleItem.type !== 'asset') {
        this.error(`Expected CSS asset output: ${entry.outputFileName}`);
      } else {
        bundleItem.source = cssSource;
      }

      for (const assetFileName of readdirSync(entry.assetSourceDirectoryPath)) {
        if (assetFileName.endsWith('.css')) {
          continue;
        }

        const sourceFilePath = resolve(entry.assetSourceDirectoryPath, assetFileName);
        const outputFileName = entry.assetOutputDirectoryPath ? posix.join(entry.assetOutputDirectoryPath, assetFileName) : assetFileName;

        this.emitFile({
          type: 'asset',
          fileName: outputFileName,
          source: readFileSync(sourceFilePath),
        });
      }
    }
  },
});

export default defineConfig({
  root: packageRoot,
  css: {
    preprocessorOptions: {},
  },
  build: {
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    assetsInlineLimit: 5,
    lib: {
      entry: entries,
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
        globals: {
          react: 'React',
          classnames: 'classnames',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
      },
      external,
    },
  },
  plugins: [
    libInjectCss(),
    normalizeCssModuleOutput(),
    preserveStaticFontCssAssets(),
    dts({
      outDirs: typesRoot,
      entryRoot: sourceRoot,
      exclude: ['**/*.stories.tsx'],
      beforeWriteFile(filePath, content) {
        const normalizedFilePath = filePath.replaceAll('\\', '/');
        const normalizedTypesRoot = typesRoot.replaceAll('\\', '/');
        const sourceTypesRoot = `${normalizedTypesRoot}/src/`;

        if (!normalizedFilePath.startsWith(sourceTypesRoot)) {
          return {
            content,
            filePath,
          };
        }

        return {
          content,
          filePath: resolve(typesRoot, normalizedFilePath.slice(sourceTypesRoot.length)),
        };
      },
    }),
  ],
});
