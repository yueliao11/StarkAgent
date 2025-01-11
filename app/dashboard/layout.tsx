import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - StarkIntent",
  description: "View your assets and trading activities",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
