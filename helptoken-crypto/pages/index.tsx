// pages/index.tsx
import React, { useState, useEffect } from "react";
import Head from "next/head";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Dashboard from "../components/Dashboard";
import OpportunitiesSection from "../components/OpportunitiesSection";
import Marketplace from "../components/Marketplace";
import TransactionLog from "../components/TransactionLog";
import VolunteerModal from "../components/VolunteerModal";
import PurchaseModal from "../components/PurchaseModal";
import type { User, Opportunity, MarketplaceItem, Transaction } from "../types";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(
    [],
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<Opportunity | null>(null);
  const [selectedMarketplaceItem, setSelectedMarketplaceItem] =
    useState<MarketplaceItem | null>(null);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", 1) // Demo user
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Fetch opportunities
      const { data: opportunitiesData, error: opportunitiesError } =
        await supabase
          .from("opportunities")
          .select("*")
          .eq("active", true)
          .order("priority", { ascending: false });

      if (opportunitiesError) throw opportunitiesError;
      setOpportunities(opportunitiesData || []);

      // Fetch marketplace items
      const { data: marketplaceData, error: marketplaceError } = await supabase
        .from("marketplace_items")
        .select("*")
        .eq("active", true)
        .order("cost", { ascending: true });

      if (marketplaceError) throw marketplaceError;
      setMarketplaceItems(marketplaceData || []);

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", 1) // Demo user
          .order("created_at", { ascending: false })
          .limit(10);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVolunteerClick = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsVolunteerModalOpen(true);
  };

  const handlePurchaseClick = (item: MarketplaceItem) => {
    setSelectedMarketplaceItem(item);
    setIsPurchaseModalOpen(true);
  };

  const handleVolunteerSubmit = async (hours: number) => {
    if (!selectedOpportunity || !user) return;

    try {
      const earned = hours * selectedOpportunity.reward_rate;

      // Update user balance
      const { error: userError } = await supabase
        .from("users")
        .update({ balance: user.balance + earned })
        .eq("id", user.id);

      if (userError) throw userError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "earn",
          amount: earned,
          description: `${selectedOpportunity.title} (${hours} hours)`,
          opportunity_id: selectedOpportunity.id,
          hours: hours,
        });

      if (transactionError) throw transactionError;

      // Refresh data
      await fetchInitialData();

      setIsVolunteerModalOpen(false);
      setSelectedOpportunity(null);

      alert(
        `Great work! You earned ${earned.toFixed(1)} HELP for ${hours} hours of volunteering. Your impact has been verified and recorded!`,
      );
    } catch (error) {
      console.error("Error submitting volunteer work:", error);
      alert("Error recording volunteer work. Please try again.");
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!selectedMarketplaceItem || !user) return;

    if (user.balance < selectedMarketplaceItem.cost) {
      alert("Insufficient balance");
      return;
    }

    try {
      // Update user balance
      const { error: userError } = await supabase
        .from("users")
        .update({ balance: user.balance - selectedMarketplaceItem.cost })
        .eq("id", user.id);

      if (userError) throw userError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "spend",
          amount: selectedMarketplaceItem.cost,
          description: selectedMarketplaceItem.name,
          marketplace_item_id: selectedMarketplaceItem.id,
        });

      if (transactionError) throw transactionError;

      // Refresh data
      await fetchInitialData();

      setIsPurchaseModalOpen(false);
      setSelectedMarketplaceItem(null);

      alert(
        `Purchase successful! You've redeemed ${selectedMarketplaceItem.name} for ${selectedMarketplaceItem.cost} HELP. Enjoy your reward!`,
      );
    } catch (error) {
      console.error("Error processing purchase:", error);
      alert("Error processing purchase. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500">
        <div className="text-white text-xl">Loading HelpToken...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500">
        <div className="text-white text-xl">User not found</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>HelpToken - Municipal Volunteer Cryptocurrency</title>
        <meta
          name="description"
          content="Rewarding Community Impact through Municipal Volunteering"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-orange-500">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <Header />

          <Dashboard user={user} />

          <OpportunitiesSection
            opportunities={opportunities}
            onVolunteerClick={handleVolunteerClick}
          />

          <Marketplace
            items={marketplaceItems}
            userBalance={user.balance}
            onPurchaseClick={handlePurchaseClick}
          />

          <TransactionLog transactions={transactions} />
        </div>

        {isVolunteerModalOpen && selectedOpportunity && (
          <VolunteerModal
            opportunity={selectedOpportunity}
            onClose={() => {
              setIsVolunteerModalOpen(false);
              setSelectedOpportunity(null);
            }}
            onSubmit={handleVolunteerSubmit}
          />
        )}

        {isPurchaseModalOpen && selectedMarketplaceItem && (
          <PurchaseModal
            item={selectedMarketplaceItem}
            userBalance={user.balance}
            onClose={() => {
              setIsPurchaseModalOpen(false);
              setSelectedMarketplaceItem(null);
            }}
            onSubmit={handlePurchaseSubmit}
          />
        )}
      </div>
    </>
  );
}
