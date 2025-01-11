"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const ASSET_DATA = [
  { date: "2024-01", value: 15000 },
  { date: "2024-02", value: 17500 },
  { date: "2024-03", value: 16800 },
  { date: "2024-04", value: 19200 },
];

const DISTRIBUTION_DATA = [
  { name: "DeFi", value: 45, color: "hsl(var(--chart-1))" },
  { name: "NFTs", value: 20, color: "hsl(var(--chart-2))" },
  { name: "Staking", value: 25, color: "hsl(var(--chart-3))" },
  { name: "Other", value: 10, color: "hsl(var(--chart-4))" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-background border rounded-lg p-2 shadow-sm">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm font-semibold text-primary">
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ name, value }: { name: string; value: number }) => {
  return `${name} (${value}%)`;
};

function LineChartComponent() {
  const axisStyle = {
    fontSize: 12,
    fill: 'hsl(var(--muted-foreground))',
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart 
        data={ASSET_DATA} 
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={axisStyle}
          dy={10}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={axisStyle}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          width={60}
          padding={{ top: 10, bottom: 10 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          fill="url(#colorValue)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieChartComponent() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
        <Pie
          data={DISTRIBUTION_DATA}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={CustomLabel}
          labelLine={false}
        >
          {DISTRIBUTION_DATA.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AssetOverview() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Asset Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trend">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trend">Trend</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
          </TabsList>
          <TabsContent value="trend" className="h-[300px]">
            <LineChartComponent />
          </TabsContent>
          <TabsContent value="distribution" className="h-[300px]">
            <PieChartComponent />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}