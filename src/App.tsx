import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Purchase from "@/pages/Purchase";
import Sales from "@/pages/Sales";
import Loss from "@/pages/Loss";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Suppliers from "@/pages/Suppliers";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/loss" element={<Loss />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/suppliers" element={<Suppliers />} />
        </Routes>
      </Layout>
    </Router>
  );
}
