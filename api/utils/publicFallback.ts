import { escapeHtml } from "./helpers.js";
import { isCandidatePublicSlugPath } from "./linkPaths.js";

export const shouldReturnPublicLinkNotFound = (pathname: string) =>
  isCandidatePublicSlugPath(pathname);

export const renderPublicLinkNotFoundPage = (pathname: string) => {
  const normalizedPath = pathname?.trim() || "/";

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Link Not Found</title>
    <meta name="robots" content="noindex, nofollow" />
    <style>
      :root {
        color-scheme: dark;
        --bg: #020617;
        --panel: rgba(15, 23, 42, 0.86);
        --border: rgba(255, 255, 255, 0.12);
        --text: #f8fafc;
        --muted: rgba(226, 232, 240, 0.75);
        --accent: #f97316;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(249, 115, 22, 0.22), transparent 24%),
          radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.18), transparent 28%),
          linear-gradient(135deg, #020617 0%, #0f172a 100%);
        color: var(--text);
      }
      .card {
        width: min(32rem, 100%);
        padding: 2rem;
        border-radius: 1.5rem;
        background: var(--panel);
        border: 1px solid var(--border);
        box-shadow: 0 1.5rem 4rem rgba(0, 0, 0, 0.35);
      }
      .eyebrow {
        display: inline-flex;
        margin-bottom: 0.9rem;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        background: rgba(249, 115, 22, 0.12);
        color: #fdba74;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      h1 {
        margin: 0 0 0.7rem;
        font-size: clamp(1.5rem, 4vw, 2rem);
        line-height: 1.2;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.65;
      }
      code {
        display: inline-block;
        margin-top: 1rem;
        padding: 0.65rem 0.85rem;
        border-radius: 0.9rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 23, 42, 0.95);
        color: #e2e8f0;
        font-size: 0.88rem;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="eyebrow">404</div>
      <h1>Link không tồn tại</h1>
      <p>Slug này không khớp với link public nào trong hệ thống, nên trang preview không thể được tạo.</p>
      <code>${escapeHtml(normalizedPath)}</code>
    </main>
  </body>
</html>`;
};
