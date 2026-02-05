'use client';

import { useEffect, useRef } from 'react';

interface WompiWidgetProps {
    amount: number;
    reference: string;
    publicKey: string;
    redirectUrl?: string;
    onSuccess?: (result: any) => void;
}

export const WompiWidget = ({ amount, reference, publicKey, redirectUrl }: WompiWidgetProps) => {
    const amountInCents = amount * 100;
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Function to handle external triggers
        const handleTrigger = () => {
            const button = containerRef.current?.querySelector('button.wompi-button') as HTMLButtonElement;
            if (button) button.click();
        };

        window.addEventListener('trigger-wompi-payment', handleTrigger);

        const injectScript = async () => {
            try {
                // Fetch signature from API
                const res = await fetch(`/api/payments/sign?reference=${reference}&amountInCents=${amountInCents}&currency=COP`);
                const { signature } = await res.json();

                if (!containerRef.current) return;
                containerRef.current.innerHTML = '';

                const script = document.createElement('script');
                script.src = "https://checkout.wompi.co/widget.js";
                script.async = true;
                script.setAttribute('data-render', 'button');
                script.setAttribute('data-public-key', publicKey);
                script.setAttribute('data-currency', 'COP');
                script.setAttribute('data-amount-in-cents', amountInCents.toString());
                script.setAttribute('data-reference', reference);
                script.setAttribute('data-signature:integrity', signature);

                if (redirectUrl) {
                    script.setAttribute('data-redirect-url', redirectUrl);
                }

                containerRef.current.appendChild(script);
            } catch (e) {
                console.error('Error fetching signature:', e);
            }
        };

        injectScript();

        return () => {
            window.removeEventListener('trigger-wompi-payment', handleTrigger);
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [amountInCents, reference, publicKey, redirectUrl]);

    return (
        <div className="wompi-container flex flex-col items-center min-h-[50px] justify-center w-full" ref={containerRef}>
            {/* The widget will be injected here */}
            <style jsx global>{`
                .wompi-container button.wompi-button {
                    background-color: #2563eb !important;
                    color: white !important;
                    font-weight: 700 !important;
                    padding: 0.75rem 2rem !important;
                    border-radius: 0.75rem !important;
                    font-family: inherit !important;
                    transition: all 0.2s !important;
                    box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2) !important;
                    cursor: pointer !important;
                    border: none !important;
                    width: 100% !important;
                }
                .wompi-container button.wompi-button:hover {
                    background-color: #1d4ed8 !important;
                    transform: translateY(-2px) !important;
                }
            `}</style>
        </div>
    );
};
