import { Provider } from "starknet";
import { CONTRACTS } from "./constants";
import { getTokenBalance } from "./dex";
import { AIService } from "./aiService";

const aiService = AIService.getInstance();

export interface PortfolioAnalysis {
  tokens: Array<{
    token: string;
    balance: string;
    value: string;
    allocation: number;
    performance24h: number;
    risk: "低" | "中等" | "高";
  }>;
  riskScore: number;
  diversityScore: number;
  recommendations: string[];
}

export async function analyzePortfolio(
  provider: Provider,
  accountAddress: string
): Promise<PortfolioAnalysis> {
  try {
    const balances = await Promise.all(
      Object.entries(CONTRACTS.TOKENS).map(async ([symbol, address]) => {
        try {
          const balanceBigInt = await getTokenBalance(provider, address, accountAddress);
          const decimals = 18;
          const balanceString = formatBalance(balanceBigInt, decimals);
          
          const value = "1000"; // Mock value, should be fetched from price oracle
          const performance24h = Math.random() * 10 - 5; // Mock performance
          
          return { 
            token: symbol, 
            balance: balanceString,
            value,
            allocation: 25,
            performance24h,
            risk: "中等" as const
          };
        } catch (error) {
          console.error(`Error processing ${symbol} balance:`, error);
          return {
            token: symbol,
            balance: "0",
            value: "0",
            allocation: 0,
            performance24h: 0,
            risk: "低" as const
          };
        }
      })
    );

    console.log('Portfolio balances:', balances); // Debug log

    const analysis = await aiService.analyzePortfolio(balances);
    console.log('AI analysis response:', analysis); // Debug log

    let recommendations: string[] = [];
    try {
      const parsedAnalysis = JSON.parse(analysis);
      recommendations = parsedAnalysis.recommendations || [];
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      console.log('Raw AI response:', analysis);
      // 如果解析失败，使用原始响应作为单个推荐
      recommendations = [typeof analysis === 'string' ? analysis : 'Unable to generate recommendations'];
    }
  
    return {
      tokens: balances,
      riskScore: 65,
      diversityScore: 75,
      recommendations
    };
  } catch (error) {
    console.error('Error in analyzePortfolio:', error);
    return {
      tokens: [],
      riskScore: 0,
      diversityScore: 0,
      recommendations: ['Error analyzing portfolio']
    };
  }
}

export async function generateStrategies(
  portfolio: PortfolioAnalysis,
  riskPreference: 'conservative' | 'aggressive'
): Promise<string> {
  try {
    const strategy = await aiService.generateStrategy(portfolio, riskPreference);
    console.log('Generated strategy:', strategy); // Debug log
    return strategy;
  } catch (error) {
    console.error('Error generating strategies:', error);
    return 'Error generating investment strategies';
  }
}

export async function analyzeTradingOpportunities(
  tokenA: string,
  tokenB: string,
  marketData: any
): Promise<string> {
  try {
    const analysis = await aiService.analyzeTradingOpportunity(tokenA, tokenB, marketData);
    console.log('Trading opportunity analysis:', analysis); // Debug log
    return analysis;
  } catch (error) {
    console.error('Error analyzing trading opportunities:', error);
    return 'Error analyzing trading opportunities';
  }
}

// Helper function to format balance
function formatBalance(balance: bigint, decimals: number): string {
  const divisor = BigInt(10) ** BigInt(decimals);
  const integerPart = balance / divisor;
  const fractionalPart = balance % divisor;
  
  let formattedFractional = fractionalPart.toString().padStart(decimals, '0');
  // 移除尾随的零
  formattedFractional = formattedFractional.replace(/0+$/, '');
  
  if (formattedFractional) {
    return `${integerPart}.${formattedFractional}`;
  }
  return integerPart.toString();
}