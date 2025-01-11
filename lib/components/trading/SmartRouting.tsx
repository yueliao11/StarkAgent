import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    Chip,
    Grid,
    Paper,
    Tooltip
} from '@mui/material';
import { TradingService } from '../../services/tradingService';
import { TOKENS } from '../../config/tokens';

interface Route {
    path: string[];
    expectedOutput: string;
    priceImpact: number;
    gasCost: string;
    score: number;
}

interface SmartRoutingProps {
    tokenIn: string;
    tokenOut: string;
    amount: string;
    provider: any;
}

export const SmartRouting: React.FC<SmartRoutingProps> = ({
    tokenIn,
    tokenOut,
    amount,
    provider
}) => {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

    const tradingService = TradingService.getInstance(provider);

    useEffect(() => {
        if (tokenIn && tokenOut && amount) {
            findRoutes();
        }
    }, [tokenIn, tokenOut, amount]);

    const findRoutes = async () => {
        try {
            setLoading(true);
            setError(null);

            // 获取所有可能的路由
            const paths = await tradingService.findAllRoutes({
                tokenIn,
                tokenOut,
                amount
            });

            // 分析每条路由
            const routesWithAnalysis = await Promise.all(
                paths.map(async (path) => {
                    const analysis = await tradingService.analyzeRoute(path);
                    return {
                        path: path.tokens,
                        expectedOutput: analysis.expectedOutput,
                        priceImpact: analysis.priceImpact,
                        gasCost: analysis.gasCost,
                        score: analysis.score
                    };
                })
            );

            // 按分数排序
            const sortedRoutes = routesWithAnalysis.sort((a, b) => b.score - a.score);
            setRoutes(sortedRoutes);
            setSelectedRoute(sortedRoutes[0]); // 选择最优路由

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

    const renderPath = (path: string[]) => {
        return path.map((token, index) => (
            <React.Fragment key={token}>
                <Chip
                    label={getTokenSymbol(token)}
                    color={token === selectedRoute?.path[0] ? "primary" : "default"}
                />
                {index < path.length - 1 && " → "}
            </React.Fragment>
        ));
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
            <Box p={2}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }

    return (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Smart Routing
                </Typography>

                {selectedRoute && (
                    <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: 'primary.light' }}>
                        <Typography variant="subtitle1" gutterBottom>
                            Best Route
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                            {renderPath(selectedRoute.path)}
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="body2">
                                    Expected Output: {selectedRoute.expectedOutput}
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2">
                                    Price Impact: {selectedRoute.priceImpact}%
                                </Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="body2">
                                    Gas Cost: {selectedRoute.gasCost}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                <List>
                    {routes.slice(1).map((route, index) => (
                        <ListItem
                            key={index}
                            sx={{
                                border: 1,
                                borderColor: 'divider',
                                borderRadius: 1,
                                mb: 1
                            }}
                        >
                            <ListItemText
                                primary={
                                    <Box sx={{ mb: 1 }}>
                                        {renderPath(route.path)}
                                    </Box>
                                }
                                secondary={
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <Typography variant="body2">
                                                Output: {route.expectedOutput}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="body2">
                                                Impact: {route.priceImpact}%
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Typography variant="body2">
                                                Gas: {route.gasCost}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </CardContent>
        </Card>
    );
};
