"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  Shield, 
  Sparkles, 
  Info, 
  Loader2,
  ChevronDown,
  ChevronUp,
  BarChart2,
  AlertTriangle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useWalletStore } from "@/lib/store";
import { analyzePortfolio, generateStrategies } from "@/lib/ai";
import { executeSwap } from "@/lib/dex";
import { useToast } from "@/hooks/use-toast";

interface Strategy {
  id: string;
  title: string;
  description: string;
  risk: string;
  expectedReturn: string;
  actions: Array<{
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    minAmountOut: string;
  }>;
}

export function InvestmentStrategies() {
  const { wallet } = useWalletStore();
  const { toast } = useToast();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [portfolio, setPortfolio] = useState<Awaited<ReturnType<typeof analyzePortfolio>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);

  const analyzeAndGenerateStrategies = async () => {
    if (!wallet) return;

    try {
      setLoading(true);
      const portfolioData = await analyzePortfolio(wallet.provider, wallet.selectedAddress);
      setPortfolio(portfolioData);
      
      const strategyResponse = await generateStrategies(portfolioData, 'conservative');
      console.log('Strategy response:', strategyResponse); // Debug log
      
      try {
        // 尝试解析策略响应
        const parsedStrategies = JSON.parse(strategyResponse);
        const formattedStrategies: Strategy[] = Array.isArray(parsedStrategies) 
          ? parsedStrategies.map((s, index) => ({
              id: `strategy-${index}`,
              title: s.title || `Strategy ${index + 1}`,
              description: s.description || 'Optimize your investment portfolio based on current market conditions',
              risk: s.risk || 'Medium',
              expectedReturn: s.expectedReturn || '10-15%',
              actions: s.actions || []
            }))
          : [{
              id: 'strategy-1',
              title: 'Conservative Growth Strategy',
              description: parsedStrategies.strategy || strategyResponse,
              risk: 'Medium',
              expectedReturn: parsedStrategies.expectedReturn || '10-15%',
              actions: parsedStrategies.steps ? [] : []
            }];
            
        setStrategies(formattedStrategies);
      } catch (parseError) {
        console.error('Error parsing strategy response:', parseError);
        // 如果解析失败，创建一个基本策略
        setStrategies([{
          id: 'strategy-1',
          title: 'Basic Investment Strategy',
          description: typeof strategyResponse === 'string' ? strategyResponse : 'Unable to parse strategy response',
          risk: 'Medium',
          expectedReturn: '10-15%',
          actions: []
        }]);
      }
    } catch (error) {
      console.error('Error in analyzeAndGenerateStrategies:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to generate investment strategies, please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const executeStrategy = async (strategy: Strategy) => {
    if (!wallet) return;

    try {
      setExecuting(true);
      for (const action of strategy.actions) {
        await executeSwap(wallet.account, {
          ...action,
          amountIn: action.amountIn || "0",
          minAmountOut: action.minAmountOut || "0",
        });
      }
      toast({
        title: "Strategy Execution Successful",
        description: "Your investment portfolio has been adjusted according to the strategy",
      });
    } catch (error) {
      console.error('Error executing strategy:', error);
      toast({
        title: "Execution Failed",
        description: "An error occurred during strategy execution, please check your wallet balance and authorization status",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  function PortfolioSummary() {
    if (!portfolio) return null;

    return (
      <div className="mb-6 p-4 rounded-lg border bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Portfolio Analysis</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Risk Score: {portfolio.riskScore}
            </Badge>
            <Badge variant="outline">
              Diversity: {portfolio.diversityScore}
            </Badge>
          </div>
        </div>
        <div className="space-y-2">
          {portfolio.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function StrategyCard({ strategy }: { strategy: Strategy }) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{strategy.title || 'Conservative Growth Strategy'}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className="ml-2">
                    {strategy.risk} Risk
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Expected Return: {strategy.expectedReturn}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>{strategy.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            <AccordionItem value="actions">
              <AccordionTrigger>
                View Detailed Steps
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {strategy.actions.map((action, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>
                        {action.tokenIn} → {action.tokenOut}
                      </span>
                      <span className="text-muted-foreground">
                        {action.amountIn} {action.tokenIn}
                      </span>
                    </div>
                  ))}
                  {strategy.actions.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No specific trading steps available
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <Button
            className="w-full mt-4"
            onClick={() => executeStrategy(strategy)}
            disabled={executing}
          >
            {executing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Execute Strategy
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Investment Strategies</h2>
          <p className="text-muted-foreground">
            Generate smart investment advice based on your portfolio
          </p>
        </div>
        <Button
          onClick={analyzeAndGenerateStrategies}
          disabled={loading || !wallet}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Analyze Portfolio
            </>
          )}
        </Button>
      </div>

      <PortfolioSummary />
      <div className="space-y-4">
        {strategies.map((strategy) => (
          <StrategyCard key={strategy.id} strategy={strategy} />
        ))}
      </div>
    </div>
  );
}