import React from 'react';
import {
    Box,
    Button,
    Typography,
    Container,
    Paper,
    CircularProgress,
    Alert
} from '@mui/material';
import { useWallet } from '../hooks/useWallet';

export const Login: React.FC = () => {
    const { loading, error, connectWallet } = useWallet();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    <Typography component="h1" variant="h5" gutterBottom>
                        Welcome to StarkAgent
                    </Typography>

                    <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
                        Connect your wallet to start trading with AI-powered insights
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={connectWallet}
                        disabled={loading}
                        sx={{ mt: 2 }}
                    >
                        {loading ? (
                            <CircularProgress size={24} />
                        ) : (
                            'Connect Wallet'
                        )}
                    </Button>

                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="text.secondary" align="center">
                            By connecting your wallet, you agree to our Terms of Service and Privacy Policy
                        </Typography>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};
