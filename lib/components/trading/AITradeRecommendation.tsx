import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    Grid,
    Paper,
    LinearProgress,
    Alert,
    Chip,
    Divider
} from '@mui/material';
import { TradingService } from '../../services/tradingService';
import { TOKENS } from '../../config/tokens';

interface MarketAnalysis {
    trend: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    priceChange24h: number;
    volume24h: string;
    liquidity: string;
    volatility: number;
}

interface TradeRecommendation {
    action: 'buy' | 'sell' | 'hold';
    token: string;
    amount: string;
    targetPrice: string;
    stopLoss: string;
    reason: string;
    riskLevel: 'low' | 'medium' | 'high';
    confidence: number;
}

interface AITradeRecommendationProps {
    tokenAddress: string;
    provider: any;
}

export const AITradeRecommendation: React.FC<AITradeRecommendationProps> = ({
    tokenAddress,
    provider
}) => {
    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
    const [recommendation, setRecommendation] = useState<TradeRecommendation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const tradingService = TradingService.getInstance(provider);

    useEffect(() => {
        if (tokenAddress) {
            analyzeMarket();
        }
    }, [tokenAddress]);

    const analyzeMarket = async () => {
        try {
            setLoading(true);
            setError(null);

            // 获取市场分析
            const analysis = await tradingService.analyzeMarket(tokenAddress);
            setMarketAnalysis(analysis);

            // 获取交易建议
            const recommendation = await tradingService.getTradeRecommendation(tokenAddress);
            setRecommendation(recommendation);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getTokenSymbol = (address: string) => {
        const token = Object.entries(TOKENS).find(([_, t]) => t.address === address);
        return token ? token[0] : 'Unknown';
    };

    const renderConfidenceBar = (confidence: number) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
                variant="determinate"
                value={confidence * 100}
                sx={{ flexGrow: 1 }}
                color={confidence > 0.7 ? "success" : confidence > 0.4 ? "warning" : "error"}
            />
            <Typography variant="body2">
                {Math.round(confidence * 100)}%
            </Typography>
        </Box>
    );

    const renderTrendChip = (trend: string) => {
        const color = trend === 'bullish' ? 'success' : trend === 'bearish' ? 'error' : 'default';
        return <Chip label={trend.toUpperCase()} color={color} />;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error">{error}</Alert>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    AI Trading Analysis: {getTokenSymbol(tokenAddress)}
                </Typography>

                {marketAnalysis && (
                    <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Market Analysis
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Box sx={{ mb: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Typography variant="body2">Market Trend:</Typography>
                                    {renderTrendChip(marketAnalysis.trend)}
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" gutterBottom>
                                    24h Change: {marketAnalysis.priceChange24h}%
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" gutterBottom>
                                    24h Volume: {marketAnalysis.volume24h}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" gutterBottom>
                                    Liquidity: {marketAnalysis.liquidity}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" gutterBottom>
                                    Volatility: {marketAnalysis.volatility}%
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" gutterBottom>
                                    Analysis Confidence:
                                </Typography>
                                {renderConfidenceBar(marketAnalysis.confidence)}
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {recommendation && (
                    <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Trade Recommendation
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            <Chip
                                label={recommendation.action.toUpperCase()}
                                color={
                                    recommendation.action === 'buy' ? 'success' :
                                    recommendation.action === 'sell' ? 'error' : 'default'
                                }
                                sx={{ mr: 1 }}
                            />
                            <Chip
                                label={`Risk: ${recommendation.riskLevel.toUpperCase()}`}
                                color={
                                    recommendation.riskLevel === 'low' ? 'success' :
                                    recommendation.riskLevel === 'medium' ? 'warning' : 'error'
                                }
                            />
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" gutterBottom>
                                    Recommended Amount: {recommendation.amount}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" gutterBottom>
                                    Target Price: {recommendation.targetPrice}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" gutterBottom>
                                    Stop Loss: {recommendation.stopLoss}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="body2" gutterBottom>
                                    Reasoning: {recommendation.reason}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="body2" gutterBottom>
                                    Recommendation Confidence:
                                </Typography>
                                {renderConfidenceBar(recommendation.confidence)}
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </CardContent>
        </Card>
    );
};
