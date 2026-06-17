export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalSessions: number;
  totalMessages: number;
  totalCarts: number;
  totalWishlists: number;
  lowStockList: { id: string; name: string; stock: number; price: number }[];
  categoryDistribution: { name: string; count: number }[];
  chartData: { label: string; chats: number; users: number; sales: number }[];
  topCartedList: { name: string; count: number }[];
  topWishlistedList: { name: string; count: number }[];
  lowStockCount: number;
}
