import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const titleMap: Record<string, string> = {
  "/": "仪表盘",
  "/purchase": "进货管理",
  "/sales": "销售管理",
  "/loss": "损耗管理",
  "/inventory": "库存管理",
  "/reports": "统计报表",
  "/suppliers": "供货商管理",
};

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const title = titleMap[location.pathname] || "鲜果管家";

  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <div className="ml-64 flex min-h-screen flex-col">
        <Header title={title} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
