import React, { useState } from 'react';
import {
    Box,
    Container,
    Grid,
    Card,
    CardHeader,
    CardContent,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Alert,
    LinearProgress,
    Tab,
    Tabs,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import { TradingDashboard } from '../TradingDashboard';
import { PieChart } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { useWallet } from '../../hooks/useWallet';
import { Analytics as AnalyticsIcon, SwapHoriz as TradeIcon } from '@mui/icons-material';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel = (props: TabPanelProps) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [viewMode, setViewMode] = useState<'trend' | 'distribution'>('trend');
    const { account, provider } = useWallet();

    // 趋势数据
    const trendData = [
        { date: '2024-01', value: 15000 },
        { date: '2024-02', value: 16500 },
        { date: '2024-03', value: 16200 },
        { date: '2024-04', value: 17800 },
    ];

    const xLabels = trendData.map(item => item.date);
    const yValues = trendData.map(item => item.value);

    const assetData = [
        { id: 0, value: 45, label: 'DeFi', color: '#FF6B6B' },
        { id: 1, value: 25, label: 'Staking', color: '#4ECDC4' },
        { id: 2, value: 20, label: 'NFTs', color: '#45B7D1' },
        { id: 3, value: 10, label: 'Other', color: '#96CEB4' }
    ];

    const recentTransactions = [
        { type: 'Deposit', amount: '+1.5 ETH', date: '2024-03-20 14:30', status: 'completed' },
        { type: 'Strategy Execution', amount: '-0.8 ETH', date: '2024-03-19 09:15', status: 'completed' },
        { type: 'Withdrawal', amount: '-0.3 ETH', date: '2024-03-18 16:45', status: 'pending' }
    ];

    const riskMetrics = [
        { name: 'Market Risk', value: 65 },
        { name: 'Liquidity Risk', value: 42 },
        { name: 'Protocol Risk', value: 38 },
        { name: 'Volatility', value: 72 }
    ];

    const aiInsights = [
        {
            title: 'DeFi Yield Opportunity',
            description: 'High-yield farming pool detected with 15% APY',
            type: 'opportunity'
        },
        {
            title: 'Market Trend Alert',
            description: 'Positive momentum in Layer 2 tokens',
            type: 'trend'
        },
        {
            title: 'Risk Warning',
            description: 'Increased volatility in your portfolio assets',
            type: 'warning'
        }
    ];

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // 如果钱包未连接，显示提示信息
    if (!account || !provider) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Alert severity="warning">
                    Please connect your wallet to access the dashboard.
                </Alert>
            </Container>
        );
    }

    return (
        
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label="Overview" />
                    <Tab label="Trading" />
                </Tabs>
            </Box>
            <title>StarkIntent 9999999999</title>
            {tabValue === 0 ? (
                <Grid container spacing={3}>
                    {/* Asset Overview */}
                    <Grid item xs={12} md={8}>
                        <Card>
                            <CardHeader 
                                title="Asset Overview"
                                action={
                                    <ToggleButtonGroup
                                        value={viewMode}
                                        exclusive
                                        onChange={(e, newMode) => newMode && setViewMode(newMode)}
                                        size="small"
                                    >
                                        <ToggleButton value="trend">Trend</ToggleButton>
                                        <ToggleButton value="distribution">Distribution</ToggleButton>
                                    </ToggleButtonGroup>
                                }
                            />
                            <CardContent>
                                <Box sx={{ height: 300, width: '100%' }}>
                                    {viewMode === 'trend' ? (
                                        <LineChart
                                            series={[
                                                {
                                                    data: yValues,
                                                    area: true,
                                                    color: '#1976d2',
                                                },
                                            ]}
                                            xAxis={[{ 
                                                scaleType: 'point',
                                                data: xLabels,
                                            }]}
                                            height={300}
                                        />
                                    ) : (
                                        <PieChart
                                            series={[
                                                {
                                                    data: assetData,
                                                    highlightScope: { faded: 'global', highlighted: 'item' },
                                                    faded: { innerRadius: 30, additionalRadius: -30 },
                                                }
                                            ]}
                                            height={300}
                                        />
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Risk Assessment */}
                    <Grid item xs={12} md={4}>
                        <Card>
                            <CardHeader title="Risk Assessment" />
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Overall Risk Score: 54/100
                                </Typography>
                                {riskMetrics.map((metric) => (
                                    <Box key={metric.name} sx={{ mb: 2 }}>
                                        <Typography variant="body2" gutterBottom>
                                            {metric.name} ({metric.value}%)
                                        </Typography>
                                        <LinearProgress
                                            variant="determinate"
                                            value={metric.value}
                                            sx={{ height: 8, borderRadius: 4 }}
                                        />
                                    </Box>
                                ))}
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                    High market volatility detected. Consider rebalancing your portfolio.
                                </Alert>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Investment Strategies */}
                    <Grid item xs={12}>
                        <Card>
                            <CardHeader 
                                title="Investment Strategies"
                                subheader="Generate smart investment advice based on your portfolio"
                                action={
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            startIcon={<AnalyticsIcon />}
                                            onClick={() => {/* Analyze Portfolio logic */}}
                                        >
                                            Analyze Portfolio
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            startIcon={<TradeIcon />}
                                            onClick={() => setTabValue(1)}
                                        >
                                            Trade
                                        </Button>
                                    </Box>
                                }
                            />
                            <CardContent>
                                <Grid container spacing={2} alignItems="center">
                                </Grid>
                                
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Recent Transactions */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader title="Recent Transactions" />
                            <CardContent>
                                <List>
                                    {recentTransactions.map((tx, index) => (
                                        <ListItem
                                            key={index}
                                            secondaryAction={
                                                <Typography
                                                    color={tx.amount.startsWith('+') ? 'success.main' : 'error.main'}
                                                >
                                                    {tx.amount}
                                                </Typography>
                                            }
                                        >
                                            <ListItemText
                                                primary={tx.type}
                                                secondary={tx.date}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                                
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* AI Insights */}
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardHeader title="AI Insights" />
                            <CardContent>
                                {aiInsights.map((insight, index) => (
                                    <Alert
                                        key={index}
                                        severity={
                                            insight.type === 'opportunity' ? 'success' :
                                            insight.type === 'trend' ? 'info' : 'warning'
                                        }
                                        sx={{ mb: 2 }}
                                    >
                                        <Typography variant="subtitle2">{insight.title}</Typography>
                                        <Typography variant="body2">{insight.description}</Typography>
                                    </Alert>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
                
            ) : (
                <TradingDashboard 
                    account={account}
                    provider={provider}
                />
            )}
        </Container>
    );
};

export default Dashboard;
