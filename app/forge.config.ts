import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { PublisherGithub } from '@electron-forge/publisher-github';
import 'dotenv/config';

const config: ForgeConfig = {
  packagerConfig: {
    name: 'AutoLabel',
    executableName: 'autolabel',
    icon: './icons/icon_256x256', // Electron Forge will add .ico/.icns automatically
    appCopyright: 'Copyright © 2025 JuliusSunder',
    appBundleId: 'com.autolabel.app',
    // Include external tools (SumatraPDF, ImageMagick, Ghostscript) as extra resources
    extraResource: [
      './bin/SumatraPDF',
      './bin/ImageMagick',
      './bin/Ghostscript',
    ],
    asar: {
      unpack: '**/*.{node,dll,dylib,so,exe}', // Don't pack native modules and executables in ASAR
      // Note: extraResource files are automatically placed outside ASAR in resources/ folder
    },
    // Ensure native modules are included
    ignore: [
      /^\/\.vscode\//,
      /^\/\.git\//,
    ],
    // Windows Metadata (shown in file properties)
    win32metadata: {
      CompanyName: 'AutoLabel',
      FileDescription: 'AutoLabel - Shipping Label Management',
      ProductName: 'AutoLabel',
      InternalName: 'autolabel',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'AutoLabel',
      authors: 'JuliusSunder',
      description: 'Automated shipping label management for resellers',
      iconUrl: 'https://autolabel.app/logo/logo.png',
      setupIcon: './icons/icon.ico',
      // Explicitly set the app ID to prevent conflicts
      setupExe: 'AutoLabel-Setup.exe',
      // Code Signing Configuration (Self-Signed Certificate)
      // ⚠️ WICHTIG: Nur für Testing/Development!
      // Für Production: Professionelles Certificate von vertrauenswürdiger CA verwenden
      certificateFile: process.env.WINDOWS_CERT_PATH || undefined,
      certificatePassword: process.env.WINDOWS_CERT_PASSWORD || undefined,
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        name: 'autolabel',
        productName: 'AutoLabel',
        genericName: 'Label Manager',
        description: 'Automated shipping label management for resellers',
        categories: ['Office', 'Utility'],
        icon: './icons/icon_256x256.png',
      },
    }),
    new MakerDeb({
      options: {
        name: 'autolabel',
        productName: 'AutoLabel',
        genericName: 'Label Manager',
        description: 'Automated shipping label management for resellers',
        categories: ['Office', 'Utility'],
        icon: './icons/icon_256x256.png',
      },
    }),
  ],
  plugins: [
    // Auto-unpack native modules (sharp, better-sqlite3, etc.)
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'JuliusSunder', // TODO: Replace with your GitHub username
        name: 'AutoLabel_1',      // TODO: Replace with your repository name
      },
      // GitHub Personal Access Token wird aus Environment Variable gelesen
      // Setze GITHUB_TOKEN vor dem Publishing:
      // Windows: $env:GITHUB_TOKEN="your-token"; npm run publish
      // Linux/Mac: GITHUB_TOKEN=your-token npm run publish
      prerelease: false,
      draft: true, // Creates draft release, you can review before publishing
    }),
  ],
};

export default config;
