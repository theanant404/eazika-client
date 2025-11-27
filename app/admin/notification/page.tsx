"use client";

import React, { useState } from 'react';
import { 
    Send, 
    BellRing, 
    History, 
    CheckCircle, 
    Clock, 
    Users, 
    Store, 
    Bike, 
    Repeat,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock History Data
const initialHistory = [
    { id: 1, title: 'Weekend Sale!', message: 'Get 50% off on all electronics this weekend.', audience: 'All Users', date: '2 hours ago', status: 'Sent' },
    { id: 2, title: 'System Maintenance', message: 'App will be down for 1 hour tonight.', audience: 'All Users', date: 'Yesterday', status: 'Sent' },
    { id: 3, title: 'New Policy Update', message: 'Updated terms for delivery partners.', audience: 'Riders Only', date: '3 days ago', status: 'Sent' },
];

export default function AdminNotificationPage() {
  const [history, setHistory] = useState(initialHistory);
  const [isSending, setIsSending] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
      title: '',
      message: '',
      audience: 'All Users'
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate API Call
    setTimeout(() => {
        const newNotification = {
            id: Date.now(),
            title: formData.title,
            message: formData.message,
            audience: formData.audience,
            date: 'Just now',
            status: 'Sent'
        };
        
        setHistory([newNotification, ...history]);
        setIsSending(false);
        setFormData({ title: '', message: '', audience: 'All Users' }); // Reset form
        alert("Notification broadcasted successfully!");
    }, 1500);
  };

  const handleResend = (item: typeof initialHistory[0]) => {
      setFormData({
          title: item.title,
          message: item.message,
          audience: item.audience
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getAudienceIcon = (audience: string) => {
      switch(audience) {
          case 'Shopkeepers Only': return <Store size={14} />;
          case 'Riders Only': return <Bike size={14} />;
          case 'Customers Only': return <Users size={14} />;
          default: return <BellRing size={14} />;
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Push Notifications</h1>
            <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold">
                {history.length} Total Sent
            </span>
        </div>
        
        {/* Compose Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Send size={20} className="text-indigo-500" /> Compose Message
                    </h2>
                    <form onSubmit={handleSend} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Target Audience</label>
                            <select 
                                value={formData.audience}
                                onChange={(e) => setFormData({...formData, audience: e.target.value})}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            >
                                <option>All Users</option>
                                <option>Shopkeepers Only</option>
                                <option>Customers Only</option>
                                {/* Riders managed by shopkeepers, but admin might need global announcements */}
                                <option>Riders Only (System Wide)</option> 
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Title</label>
                            <input 
                                type="text" 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="e.g. Special Weekend Sale!" 
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5">Message Body</label>
                            <textarea 
                                rows={4} 
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                placeholder="Enter your notification text here..." 
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" 
                                required 
                            />
                        </div>

                        <div className="pt-2">
                            <button 
                                type="submit" 
                                disabled={isSending}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-70 shadow-lg shadow-indigo-500/20"
                            >
                                {isSending ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send Notification</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Info Sidebar */}
            <div className="space-y-4">
                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                        <BellRing className="text-blue-600 shrink-0 mt-1" size={20} />
                        <div>
                            <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-1">Best Practices</h4>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-2 list-disc pl-4">
                                <li>Keep titles short and catchy (under 40 chars).</li>
                                <li>Avoid sending late at night (10 PM - 8 AM).</li>
                                <li>Use clear calls to action.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* History Section */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={24} className="text-gray-400" /> Recent History
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    <AnimatePresence initial={false}>
                        {history.map((item) => (
                            <motion.div 
                                key={item.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{item.title}</h3>
                                            <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs font-medium flex items-center gap-1">
                                                {getAudienceIcon(item.audience)} {item.audience}
                                            </span>
                                            {item.status === 'Sent' && (
                                                <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold flex items-center gap-1">
                                                    <CheckCircle size={10} /> Sent
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.message}</p>
                                        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                                            <Clock size={12} /> {item.date}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleResend(item)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        title="Resend this notification"
                                    >
                                        <Repeat size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
                {history.length === 0 && (
                    <div className="p-12 text-center text-gray-400">
                        No notifications sent yet.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}