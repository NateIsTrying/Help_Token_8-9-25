import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { HelpTokenService } from '../lib/blockchain';
import { ApiService } from '../lib/api';
import type { Opportunity, MarketplaceItem, UserStats } from '../types';

export const useHelpToken = () => {
  const { address, isConnected } = useAccount();
  const [helpTokenService] = useState(() => new HelpTokenService());
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockchainData = async () => {
    if (!helpTokenService) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch from blockchain
      const [blockchainOpportunities, blockchainItems] = await Promise.all([
        helpTokenService.getActiveOpportunities(),
        helpTokenService.getActiveMarketplaceItems()
      ]);

      setOpportunities(blockchainOpportunities);
      setMarketplaceItems(blockchainItems);

      // Fetch user stats if connected
      if (address && isConnected) {
        const stats = await helpTokenService.getVolunteerStats(address);
        setUserStats(stats);
      }

    } catch (err) {
      console.error('Error fetching blockchain data:', err);
      setError('Failed to load blockchain data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchApiData = async () => {
    try {
      // Fetch additional data from API
      const [apiOpportunities, apiMarketplace] = await Promise.all([
        ApiService.getOpportunities(),
        ApiService.getMarketplaceItems()
      ]);

      // Merge blockchain and API data
      setOpportunities(prev => {
        const merged = [...prev];
        apiOpportunities.forEach(apiOpp => {
          const existingIndex = merged.findIndex(opp => opp.id === apiOpp.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = { ...merged[existingIndex], ...apiOpp };
          } else {
            merged.push(apiOpp);
          }
        });
        return merged;
      });

      setMarketplaceItems(prev => {
        const merged = [...prev];
        apiMarketplace.forEach(apiItem => {
          const existingIndex = merged.findIndex(item => item.id === apiItem.id);
          if (existingIndex >= 0) {
            merged[existingIndex] = { ...merged[existingIndex], ...apiItem };
          } else {
            merged.push(apiItem);
          }
        });
        return merged;
      });

    } catch (err) {
      console.error('Error fetching API data:', err);
    }
  };

  const refreshData = async () => {
    await Promise.all([
      fetchBlockchainData(),
      fetchApiData()
    ]);
  };

  useEffect(() => {
    refreshData();
  }, [address, isConnected, helpTokenService]);

  const recordVolunteerWork = async (opportunityId: number, hours: number) => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const minutes = Math.floor(hours * 60);
      const success = await helpTokenService.recordVolunteerSession(
        opportunityId,
        address,
        minutes
      );

      if (success) {
        await refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to record volunteer work:', error);
      throw error;
    }
  };

  const redeemItem = async (itemId: number) => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const success = await helpTokenService.redeemMarketplaceItem(itemId);
      
      if (success) {
        await refreshData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to redeem item:', error);
      throw error;
    }
  };

  return {
    helpTokenService,
    opportunities,
    marketplaceItems,
    userStats,
    isLoading,
    error,
    refreshData,
    recordVolunteerWork,
    redeemItem
  };
};