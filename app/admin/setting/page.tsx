"use client";

import React, { useState } from 'react';
import { 
    Save, 
    Globe, 
    Shield, 
    CreditCard, 
    Bell, 
    Smartphone,
    AlertTriangle,
    Database,
    Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => {
          setIsLoading(false);
          alert("Settings saved successfully!");
      }, 1000);
  };

  const tabs = [
      { id: 'general', label: 'General', icon: Globe },
      { id: 'business', label: 'Business', icon: CreditCard },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'system', label: 'System', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage global configuration for Eazika.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-70"
          >
            <Save size={18} /> {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 space-y-2">
              {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-gray-700' 
                            : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                          <Icon size={18} /> {tab.label}
                      </button>
                  )
              })}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
              
              {/* GENERAL SETTINGS */}
              {activeTab === 'general' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">App Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">App Name</label>
                                  <input type="text" defaultValue="Eazika" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Email</label>
                                  <input type="email" defaultValue="support@eazika.com" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Support Phone</label>
                                  <input type="tel" defaultValue="+91 1800 123 4567" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default Currency</label>
                                  <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                      <option>INR (₹)</option>
                                      <option>USD ($)</option>
                                  </select>
                              </div>
                          </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Localization</h3>
                          <div className="flex items-center justify-between">
                              <div>
                                  <p className="font-medium text-gray-900 dark:text-white">Maintenance Mode</p>
                                  <p className="text-xs text-gray-500">Prevent users from accessing the app.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                              </label>
                          </div>
                      </div>
                  </motion.div>
              )}

              {/* BUSINESS SETTINGS */}
              {activeTab === 'business' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Commission & Tax</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Platform Fee (%)</label>
                                  <div className="relative">
                                      <input type="number" defaultValue="5" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GST / Tax Rate (%)</label>
                                  <div className="relative">
                                      <input type="number" defaultValue="18" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Delivery Configuration</h3>
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Delivery Fee (₹)</label>
                                  <input type="number" defaultValue="40" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Free Delivery Above (₹)</label>
                                  <input type="number" defaultValue="500" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                              <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Delivery Radius (km)</label>
                                  <input type="number" defaultValue="15" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                          </div>
                      </div>
                  </motion.div>
              )}

              {/* NOTIFICATIONS SETTINGS */}
              {activeTab === 'notifications' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Email Alerts</h3>
                          <div className="space-y-4">
                              {['New Order Alerts', 'New Shop Registration', 'Rider Application', 'System Errors'].map((item, i) => (
                                  <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                          <Mail className="text-gray-400" size={18} />
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" defaultChecked className="sr-only peer" />
                                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                      </label>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">SMS & Push</h3>
                          <div className="space-y-4">
                              {['Order Status Updates', 'Promotional Messages', 'OTP Authentication'].map((item, i) => (
                                  <div key={i} className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                                      <div className="flex items-center gap-3">
                                          <Smartphone className="text-gray-400" size={18} />
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item}</span>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                          <input type="checkbox" defaultChecked className="sr-only peer" />
                                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                      </label>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </motion.div>
              )}

              {/* SYSTEM SETTINGS */}
              {activeTab === 'system' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                          <div className="flex items-start gap-4">
                              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600">
                                  <AlertTriangle size={24} />
                              </div>
                              <div>
                                  <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Danger Zone</h3>
                                  <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                                      Irreversible actions. Proceed with caution.
                                  </p>
                                  <div className="mt-6 flex gap-4">
                                      <button className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold text-sm rounded-lg hover:bg-red-50 transition-colors">
                                          Clear All Cache
                                      </button>
                                      <button className="px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition-colors">
                                          Reset Database
                                      </button>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
                                  <Database size={24} />
                              </div>
                              <div>
                                  <h3 className="font-bold text-gray-900 dark:text-white">Database Backup</h3>
                                  <p className="text-sm text-gray-500">Last backup: 2 hours ago</p>
                              </div>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors">
                              Download Backup
                          </button>
                      </div>
                  </motion.div>
              )}

          </div>
      </div>
    </div>
  );
}