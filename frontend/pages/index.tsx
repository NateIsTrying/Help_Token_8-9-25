import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import OpportunitiesSection from '../components/OpportunitiesSection';
import Marketplace from '../components/Marketplace';
import TransactionHistory from '../components/TransactionHistory';
import VolunteerModal from '../components/modals/VolunteerModal';
import PurchaseModal from '../components/modals/PurchaseModal';
import { useHelpToken } from '../hooks/useHelpToken';
import { useAuth } from '../hooks/useAuth';
import type { Opportunity, MarketplaceItem } from '../types';

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
  const { 
    opportunities, 
    marketplaceItems, 
    userStats,
    isLoading: helpTokenLoading,
    refreshData 
  } = useHelpToken();

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedMarketplaceItem, setSelectedMarketplaceItem] = useState<MarketplaceItem | null>(null);

  const isLoading = authLoading || helpTokenLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Head>
        <title>HelpToken - Municipal Volunteer Cryptocurrency</title>
        <meta name="description" content="Earn HELP tokens for verified community service" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
      </Head>

      <Layout>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          {/* Hero Section */}
          <div className="text-center py-12 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl text-white">
            <motion.h1 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-4xl md:text-6xl font-bold mb-4"
            >
              🤝 HelpToken
            </motion.h1>
            <motion.p 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl opacity-90 mb-6"
            >
              Municipal Volunteer Cryptocurrency
            </motion.p>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-block bg-white bg-opacity-20 px-6 py-3 rounded-full backdrop-blur-sm"
            >
              🔗 Polygon Network • ⚡ Low Gas Fees • 🌱 Eco-Friendly
            </motion.div>
          </div>

          {/* Dashboard */}
          {user && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Dashboard user={user} stats={userStats} />
            </motion.div>
          )}

          {/* Opportunities Section */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <OpportunitiesSection
              opportunities={opportunities}
              onVolunteerClick={setSelectedOpportunity}
            />
          </motion.div>

          {/* Marketplace */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Marketplace
              items={marketplaceItems}
              userBalance={user?.balance || 0}
              onPurchaseClick={setSelectedMarketplaceItem}
            />
          </motion.div>

          {/* Transaction History */}
          {user && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <TransactionHistory userId={user.id} />
            </motion.div>
          )}

          {/* Network Information */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
              🔗 Blockchain Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">Polygon</div>
                <div className="text-sm text-gray-600">Network</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">$0.01</div>
                <div className="text-sm text-gray-600">Avg Gas Fee</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">ERC-20</div>
                <div className="text-sm text-gray-600">Token Standard</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">100M</div>
                <div className="text-sm text-gray-600">Total Supply</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">🌱 Eco-Friendly Choice</h3>
              <p className="text-sm text-gray-600">
                HelpToken uses Polygon's Proof-of-Stake network, which consumes 99.9% less energy than Bitcoin. 
                Your volunteer work creates positive environmental AND social impact.
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* Modals */}
        {selectedOpportunity && (
          <VolunteerModal
            opportunity={selectedOpportunity}
            onClose={() => setSelectedOpportunity(null)}
            onSuccess={() => {
              setSelectedOpportunity(null);
              refreshData();
            }}
          />
        )}

        {selectedMarketplaceItem && (
          <PurchaseModal
            item={selectedMarketplaceItem}
            userBalance={user?.balance || 0}
            onClose={() => setSelectedMarketplaceItem(null)}
            onSuccess={() => {
              setSelectedMarketplaceItem(null);
              refreshData();
            }}
          />
        )}
      </Layout>
    </>
  );
}
