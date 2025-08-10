import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/react';
import { motion } from 'framer-motion';

export default function WalletConnection() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      await open();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-gray-100 rounded-lg px-4 py-2">
        <span className="text-sm text-gray-600">Connecting...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleConnect}
        className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-6 py-2 font-medium transition-colors"
      >
        Connect Wallet
      </motion.button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
        <div className="text-sm font-medium text-green-800">
          {truncateAddress(address!)}
        </div>
        <div className="text-xs text-green-600">Connected</div>
      </div>
      <button
        onClick={() => disconnect()}
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        Disconnect
      </button>
    </div>
  );
}