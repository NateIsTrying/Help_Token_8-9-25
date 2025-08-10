import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { polygon, polygonMumbai } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { Web3Modal } from '@web3modal/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { HelpTokenProvider } from '../contexts/HelpTokenContext';
import '../styles/globals.css';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!;

const { chains, publicClient } = configureChains(
  [polygon, polygonMumbai],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY! }),
    publicProvider()
  ]
);

const wagmiConfig = createConfig({
  autoConnect: true,
  publicClient,
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <HelpTokenProvider>
              <Component {...pageProps} />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </HelpTokenProvider>
          </AuthProvider>
        </QueryClientProvider>
      </WagmiConfig>
      <Web3Modal projectId={projectId} ethereumClient={wagmiConfig} />
    </>
  );
}
