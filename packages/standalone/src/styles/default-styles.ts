export const DEFAULT_STYLES = `
  .texo-root { font-family: system-ui, sans-serif; line-height: 1.6; color: #1f2937; }
  .texo-heading { margin: 1em 0 0.5em; }
  .texo-paragraph { margin: 0.5em 0; }
  .texo-code-block { background: #f5f5f5; padding: 1em; border-radius: 6px; overflow-x: auto; }
  .texo-directive { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1em; margin: 0.75em 0; }
  .texo-directive--streaming { opacity: 0.85; animation: texo-pulse 1.4s ease-in-out infinite; }
  .texo-directive-loading { display: inline-block; font-size: 12px; margin-top: 8px; color: #6b7280; }
  @keyframes texo-pulse {
    0% { opacity: 0.55; }
    50% { opacity: 1; }
    100% { opacity: 0.55; }
  }
`;
