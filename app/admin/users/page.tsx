"use client";

import React, { useState } from 'react';
import { mockUsers, userGrowthData, userGrowthData30Days } from '@/app/data/adminMock';
import { AdminChart } from '@/app/components/admin/AdminChart';
import { 
    Search, 
    User, 
    Ban, 
    CheckCircle, 
    Trash2, 
    Download, 
    Edit, 
    Filter,
    X,
    Mail,
    Phone,
    Calendar,
    ShoppingBag,
    MapPin,
    History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock activity for the user details modal
const mockUserActivity = [
    { id: '#ORD-1023', action: 'Placed an order', date: '2 hours ago', amount: '₹450', status: 'Processing' },
    { id: '#ORD-1018', action: 'Order delivered', date: '2 days ago', amount: '₹1,200', status: 'Completed' },
    { id: '#ORD-0992', action: 'Order cancelled', date: '1 week ago', amount: '₹320', status: 'Cancelled' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(mockUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // State for Chart Range
  const [chartRange, setChartRange] = useState('7');

  // State for User Details Modal
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null);

  const toggleStatus = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' } : u));
    // Update selected user if open
    if (selectedUser && selectedUser.id === id) {
        setSelectedUser(prev => prev ? { ...prev, status: prev.status === 'active' ? 'inactive' : 'active' } : null);
    }
  };

  const deleteUser = (id: number) => {
    if(confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        setUsers(prev => prev.filter(u => u.id !== id));
        if (selectedUser?.id === id) setSelectedUser(null);
    }
  };

  const handleEdit = (id: number) => {
    alert(`Edit user ${id}`);
  };

  const handleExport = () => {
    alert("Exporting users list...");
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Determine which data to show based on state
  const currentChartData = chartRange === '7' ? userGrowthData : userGrowthData30Days;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
        <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200"
        >
            <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Analysis Graph with Interactivity */}
      <AdminChart 
        title={chartRange === '7' ? "New Signups (Last 7 Days)" : "New Signups (Last 30 Days)"}
        data={currentChartData} 
        color="indigo" 
        onRangeChange={setChartRange} 
      />

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
                type="text" 
                placeholder="Search name or phone..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm w-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <select 
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer dark:text-white appearance-none min-w-[140px]"
                >
                    <option value="all">All Roles</option>
                    <option value="customer">Customer</option>
                    <option value="shopkeeper">Shopkeeper</option>
                    <option value="rider">Rider</option>
                </select>
            </div>
            <div className="relative">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusFilter === 'active' ? 'bg-green-500' : statusFilter === 'inactive' ? 'bg-red-500' : 'bg-gray-400'}`} />
                <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer dark:text-white appearance-none min-w-[140px]"
                >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                    <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div 
                                            onClick={() => setSelectedUser(user)}
                                            className="cursor-pointer group"
                                        >
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500 group-hover:underline">{user.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize border ${
                                        user.role === 'shopkeeper' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-900/30' :
                                        user.role === 'rider' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' :
                                        'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{user.joinDate}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                        user.status === 'active' 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => handleEdit(user.id)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors" 
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button 
                                            onClick={() => toggleStatus(user.id)}
                                            className={`p-2 rounded-lg transition-colors ${
                                                user.status === 'active' 
                                                ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                                                : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                            }`}
                                            title={user.status === 'active' ? "Ban User" : "Activate User"}
                                        >
                                            {user.status === 'active' ? <Ban size={16} /> : <CheckCircle size={16} />}
                                        </button>
                                        <button 
                                            onClick={() => deleteUser(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                No users found matching your filters.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination (Visual Only) */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm bg-gray-50 dark:bg-gray-800/50">
            <span className="text-gray-500 dark:text-gray-400">Showing <span className="font-medium text-gray-900 dark:text-white">1</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(10, filteredUsers.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{filteredUsers.length}</span> results</span>
            <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300" disabled>Previous</button>
                <button className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 text-gray-600 dark:text-gray-300" disabled>Next</button>
            </div>
        </div>
      </div>

      {/* --- User Details Modal --- */}
      <AnimatePresence>
        {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                    {/* Modal Header */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 font-bold text-2xl">
                                {selectedUser.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedUser.name}</h2>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="px-2.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium border border-gray-200 dark:border-gray-600">
                                        ID: #{selectedUser.id}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                        selectedUser.role === 'shopkeeper' ? 'bg-orange-100 text-orange-700' : 
                                        selectedUser.role === 'rider' ? 'bg-blue-100 text-blue-700' : 
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {selectedUser.role}
                                    </span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                        selectedUser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                        {selectedUser.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setSelectedUser(null)}
                            className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Email Address</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                                    <Mail size={14} className="text-gray-400" /> {selectedUser.email}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Phone Number</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                                    <Phone size={14} className="text-gray-400" /> {selectedUser.phone}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Joined Date</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                                    <Calendar size={14} className="text-gray-400" /> {selectedUser.joinDate}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-bold">Saved Addresses</p>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                                    <MapPin size={14} className="text-gray-400" /> 3 Saved
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <History size={18} /> Recent Activity
                            </h3>
                            <div className="border rounded-xl border-gray-100 dark:border-gray-700 overflow-hidden">
                                {mockUserActivity.map((activity, i) => (
                                    <div key={i} className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                                <ShoppingBag size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                                                <p className="text-xs text-gray-500">{activity.id} • {activity.date}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white">{activity.amount}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                activity.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                                                activity.status === 'Cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {activity.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex gap-3">
                        {selectedUser.status === 'active' ? (
                            <button 
                                onClick={() => toggleStatus(selectedUser.id)}
                                className="flex-1 py-2.5 rounded-xl bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <Ban size={16} /> Ban User
                            </button>
                        ) : (
                            <button 
                                onClick={() => toggleStatus(selectedUser.id)}
                                className="flex-1 py-2.5 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                            >
                                <CheckCircle size={16} /> Activate
                            </button>
                        )}
                        <button 
                            onClick={() => deleteUser(selectedUser.id)}
                            className="px-4 py-2.5 rounded-xl bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}