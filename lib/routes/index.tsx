import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { Login } from '../components/Login';
import { useWallet } from '../hooks/useWallet';
import { TradingDashboard } from '../components/TradingDashboard';

export const AppRoutes: React.FC = () => {
    const { account, provider } = useWallet();

    // 如果没有连接钱包，重定向到登录页面
    if (!account) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Dashboard />} />
            {/* 其他路由 */}
        </Routes>
    );
};
