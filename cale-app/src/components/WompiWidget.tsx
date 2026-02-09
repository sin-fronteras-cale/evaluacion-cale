'use client';

import { useEffect, useRef, useState } from 'react';

interface WompiWidgetProps {
    amount: number;
    reference: string;
    publicKey: string;
    redirectUrl?: string;
    onSuccess?: (result: unknown) => void;
}

export const WompiWidget = ({ amount, reference, publicKey, redirectUrl }: WompiWidgetProps) => {
    const normalizedKey = publicKey.trim();
    const normalizedReference = reference.trim();
    const isValidKey = normalizedKey && normalizedKey.startsWith('pub_');
    const amountInCents = Math.round(amount * 100);
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    const lastKeyRef = useRef<string>('');
    const [reloadNonce, setReloadNonce] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Prevent execution if parameters are missing or invalid
        if (!isValidKey || !normalizedReference || !amountInCents || amountInCents <= 0) return;
        
        const key = [amountInCents, normalizedReference, normalizedKey, redirectUrl ?? '', reloadNonce].join('|');
        if (lastKeyRef.current === key) return;
        lastKeyRef.current = key;

        if (!widgetRef.current) return;
        let isMounted = true;

        // Function to handle external triggers
        const handleTrigger = () => {
            const button = containerRef.current?.querySelector('button.wompi-button') as HTMLButtonElement;
            if (button) button.click();
        };

        window.addEventListener('trigger-wompi-payment', handleTrigger);

        const injectScript = async () => {
            try {
                setError(null);
                // Fetch signature from API
                const res = await fetch(`/api/payments/sign?reference=${encodeURIComponent(normalizedReference)}&amountInCents=${amountInCents}&currency=COP`);
                if (!res.ok) {
                    const payload = await res.json().catch(() => ({}));
                    throw new Error(payload?.error || 'No se pudo firmar la transaccion.');
                }
                const { signature } = await res.json();
                if (!signature) {
                    throw new Error('No se recibio la firma de Wompi.');
                }

                if (!isMounted || !widgetRef.current) return;
                widgetRef.current.innerHTML = '';

                const script = document.createElement('script');
                script.src = "https://checkout.wompi.co/widget.js";
                script.async = true;
                script.setAttribute('data-render', 'button');
                script.setAttribute('data-public-key', normalizedKey);
                script.setAttribute('data-currency', 'COP');
                script.setAttribute('data-amount-in-cents', amountInCents.toString());
                script.setAttribute('data-reference', normalizedReference);
                script.setAttribute('data-signature:integrity', signature);

                if (redirectUrl) {
                    script.setAttribute('data-redirect-url', redirectUrl);
                }

                widgetRef.current.appendChild(script);
            } catch (e) {
                console.error('Error fetching signature:', e);
                if (isMounted) {
                    const message = e instanceof Error ? e.message : 'Error al cargar el boton de pago.';
                    setError(message);
                }
            }
        };

        injectScript();

        return () => {
            isMounted = false;
            window.removeEventListener('trigger-wompi-payment', handleTrigger);
        };
    }, [amountInCents, normalizedReference, normalizedKey, redirectUrl, isValidKey, reloadNonce]);

    return (
        <div className="wompi-container flex flex-col items-center min-h-[50px] justify-center w-full" ref={containerRef}>
            {!isValidKey && (
                <div className="text-xs text-slate-500 text-center">
                    Configura la llave publica en `NEXT_PUBLIC_WOMPI_PUBLIC_KEY`.
                </div>
            )}
            {isValidKey && (
                <button
                    type="button"
                    onClick={() => setReloadNonce((prev) => prev + 1)}
                    className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    Recargar widget
                </button>
            )}
            {error && (
                <div className="mt-2 text-[11px] text-red-500 text-center">
                    {error}
                </div>
            )}
            <form className="w-full">
                <div ref={widgetRef} className="w-full" />
            </form>
            {/* The widget will be injected here */}
            <style jsx global>{`
                .wompi-container button.wompi-button {
                    background-color: #111111 !important;
                    color: #ffffff !important;
                    font-weight: 600 !important;
                    padding: 0.85rem 2rem !important;
                    border-radius: 9999px !important;
                    font-family: inherit !important;
                    letter-spacing: 0.01em !important;
                    transition: all 0.2s ease !important;
                    box-shadow: 0 12px 30px -18px rgba(0, 0, 0, 0.6) !important;
                    cursor: pointer !important;
                    border: 1px solid rgba(0, 0, 0, 0.7) !important;
                    width: 100% !important;
                }
                .wompi-container button.wompi-button:hover {
                    background-color: #000000 !important;
                    transform: translateY(-1px) !important;
                }
                .wompi-container button.wompi-button:active {
                    transform: translateY(0) !important;
                }
            `}</style>
        </div>
    );
};
