# Desktop App Distribution

This project no longer ships Android or iOS native wrappers.
The install flow is now focused on the desktop app and browser install only.

## Install screen download link

Configure this variable in your environment to drive the PC download button:

```env
VITE_DESKTOP_APP_URL=
```

Recommended production example with a Cloudflare R2 custom domain:

```env
VITE_DESKTOP_APP_URL=https://downloads.hotsnew.click/hotsnew-click-setup-0.0.0-x64.exe
```

## Desktop app flow

The desktop app is an Electron shell that opens your production web app URL.
This keeps private server-side secrets out of the downloadable client.

1. Set the production app URL:

```env
APP_BASE_URL=https://hotsnew.click
```

2. Build the Windows desktop package:

```bash
npm run desktop:build
```

3. The build creates:

- `release/hotsnew-click-setup-<version>-x64.exe` for the installer
- `release/hotsnew-click-portable-<version>-x64.exe` for the portable app
- `release/hotsnew-click-<version>-win-unpacked.zip` as a fallback archive

4. If you want to keep the small web installer on your web host but store the large package file elsewhere, set:

```env
DESKTOP_APP_PACKAGE_URL=https://files.your-host.com/hotsnew-click-desktop-0.0.0-x64.nsis.7z
```

The `nsis-web` installer will download that package during installation.

5. Point `VITE_DESKTOP_APP_URL` at the small installer:

```env
VITE_DESKTOP_APP_URL=https://hotsnew.click/downloads/hotsnew-click-setup-0.0.0-x64.exe
```

6. Build the desktop artifacts:

```bash
npm run desktop:build
```

7. After the build:

- `public/downloads/hotsnew-click-setup-<version>-x64.exe` is the small installer you can keep in the repo/web app host
- `release/nsis-web/hotsnew-click-desktop-<version>-x64.nsis.7z` is the large package you can upload to a separate file host
- `public/downloads/latest.yml` remains small metadata

## Desktop development

Run the web app in one terminal:

```bash
npm run dev
```

Open the Electron shell in another:

```bash
npm run desktop:dev
```

## Notes

- Supported browser install remains available through the in-app install flow when the desktop build URL is not configured.
- Windows artifacts are written into `release/`.
- `nsis-web` supports `appPackageUrl`, so the `.exe` and the large `.nsis.7z` package can live on different hosts.
