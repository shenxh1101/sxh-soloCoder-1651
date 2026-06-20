import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  DollarSign,
  Trash2,
  Package,
  BarChart3,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/purchase", label: "进货管理", icon: ShoppingCart },
  { path: "/sales", label: "销售管理", icon: DollarSign },
  { path: "/loss", label: "损耗管理", icon: Trash2 },
  { path: "/inventory", label: "库存管理", icon: Package },
  { path: "/reports", label: "统计报表", icon: BarChart3 },
  { path: "/suppliers", label: "供货商管理", icon: Users },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <span className="text-3xl">🍎</span>
        <h1 className="text-xl font-bold text-gray-800">鲜果管家</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/30"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
