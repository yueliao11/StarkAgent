import React, { useState } from 'react';
import { translations } from '../lib/i18n';
import { analyzePortfolio } from '../lib/ai';
import { executeStrategy } from '../lib/strategy';

const { TITLE, SUBTITLE, PORTFOLIO, STRATEGIES, COMMON } = translations;

interface TokenData {
  token: string;
  balance: string;
  allocation: number;
  performance24h: number;
  risk: string;
}

const InvestmentStrategies: React.FC = () => {
  const [portfolio, setPortfolio] = useState<TokenData[]>([]);
  const [riskScore, setRiskScore] = useState(65);
  const [diversityScore, setDiversityScore] = useState(75);

  const analyzeAndGenerateStrategies = async () => {
    try {
      const result = await analyzePortfolio(provider, accountAddress);
      setPortfolio(result);
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
    }
  };

  return (
    <div className="investment-strategies">
      <h1>{TITLE}</h1>
      <p className="subtitle">{SUBTITLE}</p>

      <div className="portfolio-analysis">
        <h2>{PORTFOLIO.TITLE}</h2>
        <div className="scores">
          <div className="score">
            <span>{PORTFOLIO.RISK_SCORE}: {riskScore}/100</span>
          </div>
          <div className="score">
            <span>{PORTFOLIO.DIVERSITY_SCORE}: {diversityScore}/100</span>
          </div>
        </div>

        <div className="token-list">
          {portfolio.map((token) => (
            <div key={token.token} className="token-item">
              <h3>{token.token}</h3>
              <p>({token.allocation}%)</p>
              <p>{token.balance}</p>
              <p>{token.performance24h > 0 ? '+' : ''}{token.performance24h}%</p>
            </div>
          ))}
        </div>
      </div>

      <div className="strategies">
        <div className="strategy-card">
          <h3>{STRATEGIES.CONSERVATIVE.TITLE}</h3>
          <p>{COMMON.RISK}: {STRATEGIES.CONSERVATIVE.RISK}</p>
          <p>{STRATEGIES.CONSERVATIVE.DESCRIPTION}</p>
          <button className="view-details">
            {STRATEGIES.CONSERVATIVE.VIEW_DETAILS}
          </button>
          <p>{STRATEGIES.CONSERVATIVE.EXPECTED_RETURN}</p>
          <button className="execute-strategy" onClick={() => executeStrategy('conservative')}>
            {STRATEGIES.CONSERVATIVE.EXECUTE}
          </button>
        </div>

        <div className="strategy-card">
          <h3>{STRATEGIES.AGGRESSIVE.TITLE}</h3>
          <p>{COMMON.RISK}: {STRATEGIES.AGGRESSIVE.RISK}</p>
          <p>{STRATEGIES.AGGRESSIVE.DESCRIPTION}</p>
          <button className="view-details">
            {STRATEGIES.AGGRESSIVE.VIEW_DETAILS}
          </button>
          <p>{STRATEGIES.AGGRESSIVE.EXPECTED_RETURN}</p>
          <button className="execute-strategy" onClick={() => executeStrategy('aggressive')}>
            {STRATEGIES.AGGRESSIVE.EXECUTE}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestmentStrategies;
