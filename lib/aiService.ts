import axios from 'axios';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: Message;
    finish_reason: string;
  }[];
}

export class AIService {
  private static instance: AIService;
  private readonly baseUrl: string = 'https://api.deepseek.com';
  private readonly apiKey: string;

  private constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Warning: DEEPSEEK_API_KEY is not set in .env.local');
    }
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async chatCompletion(messages: Message[]): Promise<string> {
    if (!this.apiKey) {
      console.log('Using mock response - API key not configured');
      return this.getMockResponse(messages);
    }

    try {
      console.log('Sending request to DeepSeek API:', {
        url: `${this.baseUrl}/chat/completions`,
        messages
      });

      const response = await axios.post<ChatCompletionResponse>(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'deepseek-chat',
          messages,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 10000, // 10 seconds timeout
        }
      );

      if (!response.data) {
        throw new Error('No data in response');
      }

      if (!response.data.choices || !response.data.choices[0]) {
        throw new Error('Invalid response format');
      }

      const result = response.data.choices[0].message.content;
      console.log('DeepSeek API response:', result);
      return result;

    } catch (error) {
      console.error('Error calling DeepSeek API:', error);
      if (error.response) {
        console.error('API response error:', {
          status: error.response.status,
          data: error.response.data
        });
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock response due to API error');
        return this.getMockResponse(messages);
      }
      throw error;
    }
  }

  private getMockResponse(messages: Message[]): string {
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    let mockResponse;
    
    if (userMessage.includes('portfolio')) {
      mockResponse = {
        analysis: "Portfolio is well-balanced",
        riskScore: 65,
        recommendations: [
          "Consider increasing ETH allocation",
          "Maintain stable coin reserves",
          "Look for arbitrage opportunities"
        ]
      };
    } else if (userMessage.includes('strategy')) {
      mockResponse = {
        strategy: "Conservative growth",
        steps: [
          "Rebalance portfolio monthly",
          "Keep 30% in stable coins",
          "Use DCA for major purchases"
        ],
        expectedReturn: "12-18% APY"
      };
    } else if (userMessage.includes('trading opportunity')) {
      mockResponse = {
        opportunity: "Moderate",
        priceGap: "0.5%",
        recommendation: "Monitor for better entry points",
        risks: ["Limited liquidity", "High volatility"]
      };
    } else {
      mockResponse = {
        message: "Mock response for development"
      };
    }
    
    return JSON.stringify(mockResponse);
  }

  public async analyzePortfolio(portfolioData: any): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an AI investment advisor specialized in cryptocurrency portfolio analysis and strategy recommendation.'
      },
      {
        role: 'user',
        content: `Please analyze this portfolio and provide investment advice: ${JSON.stringify(portfolioData)}`
      }
    ];

    return this.chatCompletion(messages);
  }

  public async generateStrategy(
    portfolioData: any,
    riskPreference: 'conservative' | 'aggressive'
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an AI investment advisor specialized in cryptocurrency trading strategies.'
      },
      {
        role: 'user',
        content: `Generate a ${riskPreference} trading strategy for this portfolio: ${JSON.stringify(portfolioData)}`
      }
    ];

    return this.chatCompletion(messages);
  }

  public async analyzeTradingOpportunity(
    tokenA: string,
    tokenB: string,
    marketData: any
  ): Promise<string> {
    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an AI trading advisor specialized in cryptocurrency arbitrage opportunities.'
      },
      {
        role: 'user',
        content: `Analyze trading opportunity between ${tokenA} and ${tokenB} with this market data: ${JSON.stringify(marketData)}`
      }
    ];

    return this.chatCompletion(messages);
  }
}
