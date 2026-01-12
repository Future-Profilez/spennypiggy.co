import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";

const Turnstile = forwardRef(function Turnstile(
    {
        onVerify,
        theme = "light",
        size = "compact",
        action,
        cData,
        className,
    },
    ref
) {
    const { turnstileSiteKey } = usePage().props;
    const containerRef = useRef(null);
    const [containerEl, setContainerEl] = useState(null);
    const widgetIdRef = useRef(null);

    const bindContainerRef = useCallback((el) => {
        containerRef.current = el;
        setContainerEl(el);
    }, []);

    const handleVerify = useCallback(
        (token) => {
            if (onVerify) {
                onVerify(token || "");
            }
        },
        [onVerify]
    );

    useImperativeHandle(
        ref,
        () => ({
            execute: () => {
                if (window.turnstile && widgetIdRef.current !== null) {
                    window.turnstile.execute(widgetIdRef.current);
                }
            },
            reset: () => {
                if (window.turnstile && widgetIdRef.current !== null) {
                    window.turnstile.reset(widgetIdRef.current);
                }
            },
        }),
        []
    );

    useEffect(() => {
        if (!turnstileSiteKey || !containerEl) {
            return;
        }

        const renderWidget = () => {
            if (!window.turnstile || !containerEl) {
                return;
            }

            if (widgetIdRef.current !== null) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }

            containerEl.innerHTML = "";

            const options = {
                sitekey: turnstileSiteKey,
                theme,
                size,
                callback: (token) => handleVerify(token),
                "expired-callback": () => handleVerify(""),
                "error-callback": () => handleVerify(""),
            };

            if (action) {
                options.action = action;
            }
            if (cData) {
                options.cData = cData;
            }

            widgetIdRef.current = window.turnstile.render(containerEl, options);
        };

        if (window.turnstile) {
            renderWidget();
            return;
        }

        const existingScript = document.querySelector('script[data-turnstile-script="true"]');
        if (existingScript) {
            existingScript.addEventListener("load", renderWidget);
            setTimeout(renderWidget, 0);
            return () => {
                existingScript.removeEventListener("load", renderWidget);
            };
        }

        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = "true";
        script.onload = renderWidget;
        document.head.appendChild(script);

        return () => {
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [turnstileSiteKey, containerEl, theme, size, action, cData, handleVerify]);

    if (!turnstileSiteKey) {
        return null;
    }

    return (
        <div className={className}>
            <div ref={bindContainerRef} />
        </div>
    );
});

export default Turnstile;

