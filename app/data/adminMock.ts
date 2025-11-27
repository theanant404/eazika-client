// Centralized mock data for the Admin Dashboard

export const adminStats = {
  totalSales: "₹45,23,100",
  totalOrders: 12543,
  totalUsers: 4521,
  totalShops: 124,
  totalRiders: 89,
  activeOrders: 45,
  pendingShopApprovals: 3,
  pendingRiderApprovals: 5,
  revenueTrend: [
    { name: 'Mon', value: 4000 },
    { name: 'Tue', value: 3000 },
    { name: 'Wed', value: 2000 },
    { name: 'Thu', value: 2780 },
    { name: 'Fri', value: 1890 },
    { name: 'Sat', value: 2390 },
    { name: 'Sun', value: 3490 },
  ],
  categoryDistribution: [
    { name: 'Grocery', value: 400 },
    { name: 'Food', value: 300 },
    { name: 'Pharma', value: 300 },
    { name: 'Electronics', value: 200 },
  ]
};

export const mockUsers = [
  { id: 1, name: "Rahul Kumar", email: "rahul@example.com", phone: "9876543210", role: "customer", status: "active", joinDate: "2024-01-15" },
  { id: 2, name: "Priya Singh", email: "priya@example.com", phone: "9123456789", role: "customer", status: "inactive", joinDate: "2024-02-10" },
  { id: 3, name: "Amit Patel", email: "amit@example.com", phone: "9988776655", role: "shopkeeper", status: "active", joinDate: "2024-03-05" },
];

export const mockShops = [
  { 
      id: 101, 
      name: "Fresh Mart", 
      owner: "Suresh Gupta", 
      category: "Grocery", 
      status: "active", 
      rating: 4.5, 
      orders: 120, 
      revenue: "₹4,50,000",
      coordinates: { x: 30, y: 40 } // Mock percentage coordinates for CSS map
  },
  { 
      id: 102, 
      name: "City Pharmacy", 
      owner: "Dr. Anil", 
      category: "Pharmacy", 
      status: "pending", 
      rating: 0, 
      orders: 0, 
      revenue: "₹0",
      coordinates: { x: 60, y: 20 }
  },
  { 
      id: 103, 
      name: "Burger King", 
      owner: "Global Foods", 
      category: "Restaurant", 
      status: "active", 
      rating: 4.2, 
      orders: 850, 
      revenue: "₹12,00,000",
      coordinates: { x: 75, y: 65 }
  },
  // Offline / Inactive Shop Example
  { 
      id: 104, 
      name: "Closed Cafe", 
      owner: "Inactive User", 
      category: "Restaurant", 
      status: "inactive", 
      rating: 3.8, 
      orders: 50, 
      revenue: "₹1,20,000",
      coordinates: { x: 20, y: 80 }
  },
];

export const mockRiders = [
  { 
      id: 201, 
      name: "Vikram Singh", 
      phone: "8877665544", 
      status: "available", 
      rating: 4.8, 
      totalDeliveries: 450, 
      currentOrder: null,
      coordinates: { x: 35, y: 45 } 
  },
  { 
      id: 202, 
      name: "Ravi Kumar", 
      phone: "7766554433", 
      status: "busy", 
      rating: 4.6, 
      totalDeliveries: 320, 
      currentOrder: "#ORD-9988",
      coordinates: { x: 70, y: 60 } 
  },
  { 
      id: 203, 
      name: "Sumit Roy", 
      phone: "6655443322", 
      status: "offline", 
      rating: 4.9, 
      totalDeliveries: 120, 
      currentOrder: null,
      coordinates: { x: 50, y: 50 } 
  },
];

export const mockOrders = [
  { id: "ORD-001", customer: "Rahul Kumar", shop: "Fresh Mart", rider: "Vikram Singh", amount: "₹450", status: "delivered", date: "2024-11-20" },
  { id: "ORD-002", customer: "Priya Singh", shop: "Burger King", rider: "Ravi Kumar", amount: "₹320", status: "shipped", date: "2024-11-21" },
  { id: "ORD-003", customer: "Amit Patel", shop: "City Pharmacy", rider: null, amount: "₹120", status: "pending", date: "2024-11-21" },
];

// --- CHARTS DATA ---
export const userGrowthData = [
    { label: 'Mon', value: 12 }, { label: 'Tue', value: 19 }, { label: 'Wed', value: 15 },
    { label: 'Thu', value: 25 }, { label: 'Fri', value: 32 }, { label: 'Sat', value: 45 }, { label: 'Sun', value: 40 },
];

export const userGrowthData30Days = [
    { label: 'Week 1', value: 120 }, { label: 'Week 2', value: 145 },
    { label: 'Week 3', value: 180 }, { label: 'Week 4', value: 210 },
];

export const shopPerformanceData = [
    { label: 'Mon', value: 180 }, { label: 'Tue', value: 150 }, { label: 'Wed', value: 220 },
    { label: 'Thu', value: 190 }, { label: 'Fri', value: 260 }, { label: 'Sat', value: 310 }, { label: 'Sun', value: 280 },
];

export const riderActivityData = [
    { label: 'Mon', value: 45 }, { label: 'Tue', value: 50 }, { label: 'Wed', value: 48 },
    { label: 'Thu', value: 52 }, { label: 'Fri', value: 60 }, { label: 'Sat', value: 85 }, { label: 'Sun', value: 80 },
];

export const orderVolumeData = [
    { label: '9 AM', value: 10 }, { label: '12 PM', value: 45 }, { label: '3 PM', value: 30 },
    { label: '6 PM', value: 70 }, { label: '9 PM', value: 55 },
];