import type { Metadata } from 'next';
import type React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
    title: 'Clinica Odontológica - CRM Sistema Integrado',
    description:
        'Plataforma CRM de clinicas odontológicas com WhatsApp, Pipeline e Inteligência Artificial',
    generator: 'v0.dev',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR">
            <body>
                <ToastContainer
                    position="top-right"
                    autoClose={4000}
                    hideProgressBar={false}
                    newestOnTop={true}
                    closeOnClick={true}
                    rtl={false}
                    pauseOnFocusLoss={false}
                    draggable={true}
                    pauseOnHover={true}
                    theme="colored"
                    toastStyle={{
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                        fontSize: '14px',
                        fontWeight: '500',
                    }}
                    progressStyle={{
                        background: 'rgba(255, 255, 255, 0.3)',
                    }}
                />

                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
