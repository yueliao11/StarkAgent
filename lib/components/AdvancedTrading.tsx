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
    Slider,
    Switch,
    FormControlLabel,
    Alert,
    CircularProgress,
    Tabs,
    Tab
} from '@mui/material';
import { TradingService } from '../services/tradingService';
import { TOKENS } from '../config/tokens';
import {
    SwapParams,
    TradingStrategy,
    PriceAlert
} from '../types/dex';

interface AdvancedTradingProps {
    account: any;
    provider: any;
}

export const AdvancedTrading: React.FC<AdvancedTradingProps> = ({
    account,
    provider
}) => {
    const tradingService = TradingService.getInstance(provider);

    // 状态管理
    const [activeTab, setActiveTab] = useState(0);
    const [selectedTokenIn, setSelectedTokenIn] = useState(TOKENS.ETH.address);
    const [selectedTokenOut, setSelectedTokenOut] = useState(TOKENS.USDC.address);
    const [amount, setAmount] = useState('');
    const [slippage, setSlippage] = useState(0.5);
    const [deadline, setDeadline] = useState(5);
    const [autoTrade, setAutoTrade] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 高级设置
    const [strategy, setStrategy] = useState<TradingStrategy>({
        type: 'basic',
        parameters: {
            maxPriceImpact: 1,
            minProfit: 0.1,
            gasLimit: '500000'
        }
    });

    // 处理标签页切换
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    // 执行智能交易
    const handleSmartSwap = async () => {
        try {
            setLoading(true);
            setError(null);

            const params: SwapParams = {
                tokenIn: selectedTokenIn,
                tokenOut: selectedTokenOut,
                amountIn: amount,
                slippageTolerance: slippage / 100,
                deadline: deadline * 60
            };

            const txHash = await tradingService.smartSwap(
                account,
                params,
                strategy
            );

            console.log('Smart swap submitted:', txHash);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 设置价格警报
    const handleSetAlert = async () => {
        try {
            setLoading(true);
            setError(null);

            const alertId = await tradingService.setSmartPriceAlert(
                selectedTokenIn,
                strategy
            );

            console.log('Alert set:', alertId);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Smart Swap" />
                <Tab label="Price Alerts" />
                <Tab label="Strategy" />
            </Tabs>

            <Box sx={{ mt: 3 }}>
                {/* 智能交易面板 */}
                {activeTab === 0 && (
                    <Card>
                        <CardHeader title="Smart Swap" />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
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
                                </Grid>

                                <Grid item xs={12} md={6}>
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
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        type="number"
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography gutterBottom>
                                        Slippage Tolerance: {slippage}%
                                    </Typography>
                                    <Slider
                                        value={slippage}
                                        onChange={(e, value) => setSlippage(value as number)}
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography gutterBottom>
                                        Transaction Deadline: {deadline} minutes
                                    </Typography>
                                    <Slider
                                        value={deadline}
                                        onChange={(e, value) => setDeadline(value as number)}
                                        min={1}
                                        max={60}
                                        step={1}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={autoTrade}
                                                onChange={(e) => setAutoTrade(e.target.checked)}
                                            />
                                        }
                                        label="Enable Auto-Trading"
                                    />
                                </Grid>

                                {error && (
                                    <Grid item xs={12}>
                                        <Alert severity="error">{error}</Alert>
                                    </Grid>
                                )}

                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleSmartSwap}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Smart Swap'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* 价格警报面板 */}
                {activeTab === 1 && (
                    <Card>
                        <CardHeader title="Price Alerts" />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
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
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        onClick={handleSetAlert}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Set Smart Alert'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {/* 策略设置面板 */}
                {activeTab === 2 && (
                    <Card>
                        <CardHeader title="Trading Strategy" />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography gutterBottom>
                                        Max Price Impact: {strategy.parameters.maxPriceImpact}%
                                    </Typography>
                                    <Slider
                                        value={strategy.parameters.maxPriceImpact}
                                        onChange={(e, value) => setStrategy({
                                            ...strategy,
                                            parameters: {
                                                ...strategy.parameters,
                                                maxPriceImpact: value as number
                                            }
                                        })}
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography gutterBottom>
                                        Min Profit: {strategy.parameters.minProfit}%
                                    </Typography>
                                    <Slider
                                        value={strategy.parameters.minProfit}
                                        onChange={(e, value) => setStrategy({
                                            ...strategy,
                                            parameters: {
                                                ...strategy.parameters,
                                                minProfit: value as number
                                            }
                                        })}
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Gas Limit"
                                        value={strategy.parameters.gasLimit}
                                        onChange={(e) => setStrategy({
                                            ...strategy,
                                            parameters: {
                                                ...strategy.parameters,
                                                gasLimit: e.target.value
                                            }
                                        })}
                                        type="number"
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}
            </Box>
        </Box>
    );
};
