// backend/src/services/blockchain.ts
import { ethers } from 'ethers';
import logger from '../utils/logger';

export class BlockchainService {
  private provider: ethers.providers.JsonRpcProvider;
  private contract: ethers.Contract;
  private wallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.providers.JsonRpcProvider(
      process.env.POLYGON_RPC_URL || process.env.MUMBAI_RPC_URL
    );
    
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
    
    // Contract ABI (simplified - in production, import from artifacts)
    const abi = [
      "function recordVolunteerSession(uint256 opportunityId, address volunteer, uint256 minutes) external",
      "function getVolunteerStats(address volunteer) external view returns (uint256, uint256, uint256)",
      "function getActiveOpportunities() external view returns (tuple(uint256 id, string title, string description, uint256 rewardRate, address municipality, string category, bool active, uint256 createdAt)[])",
      "function balanceOf(address account) external view returns (uint256)"
    ];

    this.contract = new ethers.Contract(
      process.env.HELPTOKEN_CONTRACT_ADDRESS!,
      abi,
      this.wallet
    );
  }

  async recordVolunteerSession(
    opportunityId: number,
    volunteerAddress: string,
    minutes: number
  ): Promise<string> {
    try {
      const tx = await this.contract.recordVolunteerSession(
        opportunityId,
        volunteerAddress,
        minutes
      );
      
      const receipt = await tx.wait();
      logger.info(`Volunteer session recorded on blockchain: ${receipt.transactionHash}`);
      
      return receipt.transactionHash;
    } catch (error) {
      logger.error('Blockchain recording error:', error);
      throw error;
    }
  }

  async getVolunteerStats(volunteerAddress: string) {
    try {
      const stats = await this.contract.getVolunteerStats(volunteerAddress);
      return {
        totalHours: stats[0].toNumber() / 60, // Convert minutes to hours
        totalProjects: stats[1].toNumber(),
        totalEarned: ethers.utils.formatEther(stats[2])
      };
    } catch (error) {
      logger.error('Error fetching volunteer stats:', error);
      throw error;
    }
  }

  async getTokenBalance(address: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      logger.error('Error fetching token balance:', error);
      throw error;
    }
  }

  async getActiveOpportunities() {
    try {
      const opportunities = await this.contract.getActiveOpportunities();
      return opportunities.map((opp: any) => ({
        id: opp.id.toNumber(),
        title: opp.title,
        description: opp.description,
        rewardRate: parseFloat(ethers.utils.formatEther(opp.rewardRate)),
        municipality: opp.municipality,
        category: opp.category,
        active: opp.active,
        createdAt: new Date(opp.createdAt.toNumber() * 1000)
      }));
    } catch (error) {
      logger.error('Error fetching opportunities from blockchain:', error);
      throw error;
    }
  }
}

