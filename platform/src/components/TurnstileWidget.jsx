import { useEffect, useRef } from 'react';

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function ensureScript() {
  const existing = document.querySelector(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
  if (existing) return existing;

  const script = document.createElement('script');
  script.src = TURNSTILE_SCRIPT_SRC;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  return script;
}

export default function TurnstileWidget({ siteKey, onToken, onExpire }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return undefined;

    let mounted = true;
    let widgetId = null;
    const script = ensureScript();

    const render = () => {
      if (!mounted || !window.turnstile || !containerRef.current) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onToken?.(token),
        'expired-callback': () => {
          onToken?.('');
          onExpire?.();
        },
        'error-callback': () => {
          onToken?.('');
        }
      });
    };

    if (window.turnstile) {
      render();
    } else {
      script.addEventListener('load', render, { once: true });
    }

    return () => {
      mounted = false;
      if (window.turnstile && widgetId !== null) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [siteKey, onExpire, onToken]);

  if (!siteKey) {
    return null;
  }

  return <div className="cf-turnstile" ref={containerRef} />;
}
