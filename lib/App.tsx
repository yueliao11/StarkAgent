import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import { AppRoutes } from './routes';
import { Login } from './components/Login';
import { useWallet } from './hooks/useWallet';

export const App: React.FC = () => {
    const { loading } = useWallet();

    if (loading) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '100vh' 
                }}>
                    Loading...
                </div>
            </ThemeProvider>
        );
    }

    return (
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AppRoutes />
            </ThemeProvider>
        </BrowserRouter>
    );
};
