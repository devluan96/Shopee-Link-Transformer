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
VITE_DESKTOP_APP_URL=https://github.com/devluan96/Shopee-Link-Transformer/releases/download/v0.0.1/hotsnew-click-setup-0.0.1-x64.exe
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

4. Point `VITE_DESKTOP_APP_URL` directly at the GitHub Release installer:

```env
VITE_DESKTOP_APP_URL=https://github.com/devluan96/Shopee-Link-Transformer/releases/download/v0.0.1/hotsnew-click-setup-0.0.1-x64.exe
```

5. Build the desktop artifacts:

```bash
npm run desktop:build
```

6. After the build:

- `release/hotsnew-click-setup-<version>-x64.exe` is the offline Windows installer to upload to GitHub Releases
- `release/hotsnew-click-portable-<version>-x64.exe` is the portable build
- `release/hotsnew-click-<version>-win-unpacked.zip` is the unpacked fallback archive

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
- For the simplest production flow, host the installer directly on GitHub Releases and point `VITE_DESKTOP_APP_URL` at that asset.

## Release checklist

For desktop release `v0.0.1`:

1. Build:

```bash
npm run desktop:build
```

2. Create GitHub Release tag:

```text
v0.0.1
```

3. Upload this required asset to the GitHub Release:

- `release/hotsnew-click-setup-0.0.1-x64.exe`

4. Redeploy the web app so the install button uses the new `VITE_DESKTOP_APP_URL`.

5. Confirm the production installer URL works:

```text
https://github.com/devluan96/Shopee-Link-Transformer/releases/download/v0.0.1/hotsnew-click-setup-0.0.1-x64.exe
```

Detailed release notes are in:

- `docs/releases/v0.0.1.md`
