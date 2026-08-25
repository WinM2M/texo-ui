/**
 * The baseline stylesheet for generated UI.
 *
 * Every rule reads a theme token with a light fallback, so a `:> theme` directive restyles
 * the shell as well as the components. Hardcoding these values is what used to make a dark
 * preset render as light text on a white surface: the components honoured the tokens and
 * the shell did not.
 *
 * Scoped entirely to `.texo-*` class names, so injecting it cannot affect the host page.
 */
export const TEXO_BASE_STYLES = `
  .texo-root {
    font-family: var(--texo-theme-font-family, system-ui, sans-serif);
    line-height: 1.6;
    color: var(--texo-theme-foreground, #1f2937);
    background: var(--texo-theme-background, transparent);
  }
  .texo-heading { margin: 1em 0 0.5em; color: inherit; }
  .texo-paragraph { margin: 0.5em 0; color: inherit; }
  .texo-code-block {
    background: var(--texo-theme-code-background, rgba(127, 127, 127, 0.12));
    color: inherit;
    padding: 1em;
    border-radius: var(--texo-theme-radius, 6px);
    overflow-x: auto;
  }
  .texo-directive {
    border: 1px solid var(--texo-theme-line, #e5e7eb);
    border-radius: var(--texo-theme-radius, 8px);
    padding: 1em;
    margin: 0.75em 0;
  }
  .texo-grid-title { margin: 0 0 8px; color: inherit; }
  .texo-directive--streaming { opacity: 0.85; animation: texo-pulse 1.4s ease-in-out infinite; }
  .texo-directive-loading {
    display: inline-block;
    font-size: 12px;
    margin-top: 8px;
    opacity: 0.65;
  }
  @keyframes texo-pulse {
    0% { opacity: 0.55; }
    50% { opacity: 1; }
    100% { opacity: 0.55; }
  }
`;

const STYLE_ELEMENT_ID = 'texo-base-styles';

/**
 * Injects {@link TEXO_BASE_STYLES} into a document head or shadow root, once per target.
 */
export function injectBaseStyles(target?: Document | ShadowRoot): void {
  const root = target ?? (typeof document === 'undefined' ? undefined : document);
  if (!root) {
    return;
  }

  const host = root instanceof Document ? root.head : root;
  if (!host || host.querySelector(`#${STYLE_ELEMENT_ID}`)) {
    return;
  }

  const style = (root instanceof Document ? root : root.ownerDocument).createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = TEXO_BASE_STYLES;
  host.appendChild(style);
}
