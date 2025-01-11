import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardHeader,
    CardContent,
    Button,
    TextField,
    Select,
    MenuItem,
    Typography,
    Alert,
    CircularProgress,
    Tabs,
    Tab,
    Divider
} from '@mui/material';
import { TradingService } from '@/lib/services/tradingService';
import { useServices } from '@/lib/hooks/useServices';
import { TOKENS } from '@/lib/config/tokens';
import { SmartRouting } from './trading/SmartRouting';
import { AITradeRecommendation } from './trading/AITradeRecommendation';
import {
    SwapParams,
    TradingMetrics,
    TradeAnalytics
} from '@/lib/types/dex';

interface TradingDashboardProps {
    account: any;
    provider: any;
}

export const TradingDashboard: React.FC<TradingDashboardProps> = ({
    account,
    provider
}) => {
    // 服务初始化
    const container = useServices(provider);
    const tradingService = container.getService(TradingService);

    // 状态管理
    const [activeTab, setActiveTab] = useState(0);
    const [selectedTokenIn, setSelectedTokenIn] = useState(TOKENS.ETH.address);
    const [selectedTokenOut, setSelectedTokenOut] = useState(TOKENS.USDC.address);
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tradeAnalytics, setTradeAnalytics] = useState<TradeAnalytics | null>(null);
    const [metrics, setMetrics] = useState<TradingMetrics | null>(null);

    // 监听交易更新
    useEffect(() => {
        tradingService.on('tradingUpdate', handleTradingUpdate);
        return () => {
            tradingService.off('tradingUpdate', handleTradingUpdate);
        };
    }, []);

    // 处理标签页切换
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    // 处理交易更新
    const handleTradingUpdate = (update: any) => {
        if (update.type === 'swapCompleted') {
            setTradeAnalytics(update.data.analytics);
        } else if (update.type === 'metricsUpdate') {
            setMetrics(update.data);
        }
    };

    // 执行快捷交易
    const handleQuickSwap = async () => {
        try {
            setLoading(true);
            setError(null);

            const txHash = await tradingService.quickSwap(
                account,
                selectedTokenIn,
                selectedTokenOut,
                amount
            );

            console.log('Transaction submitted:', txHash);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Quick Swap" />
                <Tab label="Smart Routing" />
                <Tab label="AI Analysis" />
                <Tab label="Analytics" />
            </Tabs>

            <Grid container spacing={3}>
                {/* 快捷交易面板 */}
                {activeTab === 0 && (
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader title="Quick Swap" />
                            <CardContent>
                                <Box sx={{ mb: 2 }}>
                                    <Select
                                        fullWidth
                                        value={selectedTokenIn}
                                        onChange={(e) => setSelectedTokenIn(e.target.value)}
                                    >
                                        {Object.entries(TOKENS).map(([symbol, token]) => (
                                            <MenuItem key={token.address} value={token.address}>
                                                {symbol}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <Select
                                        fullWidth
                                        value={selectedTokenOut}
                                        onChange={(e) => setSelectedTokenOut(e.target.value)}
                                    >
                                        {Object.entries(TOKENS).map(([symbol, token]) => (
                                            <MenuItem key={token.address} value={token.address}>
                                                {symbol}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </Box>

                                <Box sx={{ mb: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        type="number"
                                    />
                                </Box>

                                {error && (
                                    <Box sx={{ mb: 2 }}>
                                        <Alert severity="error">{error}</Alert>
                                    </Box>
                                )}

                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={handleQuickSwap}
                                    disabled={loading}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'Swap'}
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* 智能路由面板 */}
                {activeTab === 1 && (
                    <Grid item xs={12}>
                        <SmartRouting
                            tokenIn={selectedTokenIn}
                            tokenOut={selectedTokenOut}
                            amount={amount}
                            provider={provider}
                        />
                    </Grid>
                )}

                {/* AI 分析面板 */}
                {activeTab === 2 && (
                    <Grid item xs={12}>
                        <AITradeRecommendation
                            tokenAddress={selectedTokenIn}
                            provider={provider}
                        />
                    </Grid>
                )}

                {/* 分析面板 */}
                {activeTab === 3 && (
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader title="Trading Analytics" />
                            <CardContent>
                                <Grid container spacing={3}>
                                    {/* 交易分析 */}
                                    {tradeAnalytics && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="h6" gutterBottom>
                                                Recent Trade
                                            </Typography>
                                            <Box>
                                                <Typography variant="body1">
                                                    Execution Time: {tradeAnalytics.executionTime}ms
                                                </Typography>
                                                <Typography variant="body1">
                                                    Gas Cost: {tradeAnalytics.gasCost}
                                                </Typography>
                                                <Typography variant="body1">
                                                    Price Impact: {tradeAnalytics.priceImpact}%
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* 系统指标 */}
                                    {metrics && (
                                        <Grid item xs={12} md={6}>
                                            <Typography variant="h6" gutterBottom>
                                                System Metrics
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1">
                                                        Cache Hit Rate: {metrics.cacheHitRate}%
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1">
                                                        API Latency: {metrics.apiLatency}ms
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1">
                                                        Error Rate: {metrics.errorRate}%
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body1">
                                                        Active Transactions: {metrics.activeTransactions}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                    )}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
};
