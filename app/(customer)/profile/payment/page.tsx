"use client";

import React, { useState } from 'react';
// import Link from 'next/link'; // Replaced with <a> tag
// import MainLayout from '@/app/components/MainLayout'; // Removed, handled by layout.tsx
import { 
    CreditCard,
    Edit, 
    Trash2, 
    AlertTriangle, 
    Plus, 
    ArrowLeft,
    CheckCircle,
    Circle, // For default/non-default
    AtSign // For UPI
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Type Definitions and Mock Data ---
// Update types to support both Cards and UPI
type CardPaymentMethod = {
    id: number;
    type: 'Visa' | 'Mastercard';
    lastFour: string;
    expiry: string;
    isDefault: boolean;
};

type UpiPaymentMethod = {
    id: number;
    type: 'UPI';
    upiId: string;
    isDefault: boolean;
};

type PaymentMethod = CardPaymentMethod | UpiPaymentMethod;

const initialPaymentMethods: PaymentMethod[] = [
    { id: 1, type: 'Visa', lastFour: '1234', expiry: '12/26', isDefault: true },
    { id: 2, type: 'Mastercard', lastFour: '5678', expiry: '08/25', isDefault: false },
    { id: 3, type: 'UPI', upiId: 'rafatul@okbank', isDefault: false },
];

// --- Confirmation Modal for Deletion ---
const DeleteConfirmationModal = ({ method, onConfirm, onCancel }: { method: PaymentMethod, onConfirm: () => void, onCancel: () => void }) => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
    >
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }} 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl p-6 text-center"
        >
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-2 rounded-full" />
            <h2 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">Delete Method?</h2>
            {/* Conditional text for card vs UPI */}
            {method.type === 'UPI' ? (
                <p className="mt-2 text-gray-600 dark:text-gray-400"> Are you sure you want to delete your UPI ID: {method.upiId}?</p>
            ) : (
                <p className="mt-2 text-gray-600 dark:text-gray-400"> Are you sure you want to delete your {method.type} ending in {method.lastFour}?</p>
            )}
            <div className="flex gap-4 mt-6">
                <button 
                    onClick={onCancel} 
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white py-3 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={onConfirm} 
                    className="w-full bg-red-500 text-white py-3 rounded-full font-semibold hover:bg-red-600 transition-colors"
                >
                    Delete
                </button>
            </div>
        </motion.div>
    </motion.div>
);

// --- Form for Adding/Editing Payment Methods ---
const PaymentMethodForm = ({ onSave, onCancel }: { onSave: (method: Omit<PaymentMethod, 'id' | 'isDefault'>) => void, onCancel: () => void }) => {
    
    // State for the form type
    const [formType, setFormType] = useState<'Card' | 'UPI'>('Card');

    // Card state
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [cardType, setCardType] = useState<'Visa' | 'Mastercard'>('Visa');

    // UPI state
    const [upiId, setUpiId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formType === 'Card') {
            // Basic card validation
            if (!cardNumber || cardNumber.length < 16 || !expiry || !cvv) {
                alert("Please fill all card fields correctly.");
                return;
            }
            // Explicitly type the payload to avoid TS error
            const payload: Omit<CardPaymentMethod, 'id' | 'isDefault'> = {
                type: cardType,
                lastFour: cardNumber.slice(-4),
                expiry: expiry,
            };
            onSave(payload);
        } else {
            // Basic UPI validation
            if (!upiId || !upiId.includes('@')) {
                alert("Please enter a valid UPI ID (e.g., user@okbank).");
                return;
            }
            // Explicitly type the payload to avoid TS error
            const payload: Omit<UpiPaymentMethod, 'id' | 'isDefault'> = {
                type: 'UPI',
                upiId: upiId,
            };
            onSave(payload);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }} 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 max-w-lg mx-auto"
        >
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Add New Payment Method</h2>
            
            {/* Form Type Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <button 
                    type="button" 
                    onClick={() => setFormType('Card')} 
                    className={`w-1/2 py-2 rounded-full font-semibold transition-colors ${formType === 'Card' ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white' : 'text-gray-500'}`}
                >
                    Card
                </button>
                <button 
                    type="button" 
                    onClick={() => setFormType('UPI')} 
                    className={`w-1/2 py-2 rounded-full font-semibold transition-colors ${formType === 'UPI' ? 'bg-white dark:bg-gray-900 text-gray-800 dark:text-white' : 'text-gray-500'}`}
                >
                    UPI
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {formType === 'Card' ? (
                    <>
                        {/* Card Number */}
                        <div>
                            <label htmlFor="cardNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">Card Number</label>
                            <input 
                                id="cardNumber"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9\s]{13,19}"
                                maxLength={19}
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                placeholder="0000 0000 0000 0000"
                                className="block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:text-white"
                            />
                        </div>
                        
                        {/* Expiry and CVV */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="expiry" className="text-sm font-medium text-gray-700 dark:text-gray-300">Expiry (MM/YY)</label>
                                <input 
                                    id="expiry"
                                    type="tel"
                                    inputMode="numeric"
                                    value={expiry}
                                    onChange={(e) => setExpiry(e.target.value)}
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    className="block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:text-white"
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="cvv" className="text-sm font-medium text-gray-700 dark:text-gray-300">CVV</label>
                                <input 
                                    id="cvv"
                                    type="tel"
                                    inputMode="numeric"
                                    value={cvv}
                                    onChange={(e) => setCvv(e.target.value)}
                                    placeholder="123"
                                    maxLength={4}
                                    className="block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Card Type (Simplified) */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Card Type</label>
                            <div className="flex gap-2 mt-2">
                                <button type="button" onClick={() => setCardType('Visa')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${cardType === 'Visa' ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300' : 'bg-gray-100 border-transparent text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    Visa
                                </button>
                                <button type="button" onClick={() => setCardType('Mastercard')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${cardType === 'Mastercard' ? 'bg-yellow-50 border-yellow-500 text-yellow-600 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-300' : 'bg-gray-100 border-transparent text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                    Mastercard
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* UPI ID */}
                        <div>
                            <label htmlFor="upiId" className="text-sm font-medium text-gray-700 dark:text-gray-300">UPI ID</label>
                            <input 
                                id="upiId"
                                type="email"
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                placeholder="yourname@okbank"
                                className="block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:text-white"
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Your UPI ID will be securely saved for future payments.
                        </p>
                    </>
                )}

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onCancel} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold py-3 rounded-full text-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    <button type="submit" className="w-full bg-yellow-400 text-gray-800 font-bold py-3 rounded-full text-center hover:bg-yellow-500 transition-colors">
                        {formType === 'Card' ? 'Save Card' : 'Save UPI ID'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

// --- Main Page Component ---
export default function PaymentMethodsPage() {
    const [methods, setMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
    const [isAdding, setIsAdding] = useState(false);
    const [methodToDelete, setMethodToDelete] = useState<PaymentMethod | null>(null);

    const handleSaveMethod = (method: Omit<PaymentMethod, 'id' | 'isDefault'>) => {
        setMethods(current => [
            ...current, 
            { 
                ...method, 
                id: Date.now(), 
                isDefault: current.length === 0 // Make first card default
            } as PaymentMethod // Cast as PaymentMethod to satisfy TypeScript
        ]);
        setIsAdding(false);
    };

    const handleConfirmDelete = () => {
        if (methodToDelete) {
            setMethods(current => current.filter(a => a.id !== methodToDelete.id));
            setMethodToDelete(null);
        }
    };

    const handleSetDefault = (id: number) => {
        setMethods(current => 
            current.map(method => 
                method.id === id 
                    ? { ...method, isDefault: true } 
                    : { ...method, isDefault: false }
            )
        );
    };

    return (
        <>
            <div className="w-full max-w-5xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
                <header className="px-4 md:px-6 py-4 flex items-center space-x-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
                    <a href="/profile" aria-label="Go back to profile">
                        <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-white" />
                    </a>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Methods</h1>
                </header>
                <main className="grow overflow-y-auto p-4 md:p-6">
                    <AnimatePresence mode="wait">
                        {isAdding ? (
                            <PaymentMethodForm key="form" onSave={handleSaveMethod} onCancel={() => setIsAdding(false)} />
                        ) : (
                            <motion.div key="list" className="space-y-4 max-w-lg mx-auto">
                                {methods.map((method, index) => (
                                    <motion.div 
                                        key={method.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                        transition={{ delay: index * 0.05 }}
                                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 border border-gray-100 dark:border-gray-700"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                {/* Conditional Icon */}
                                                {method.type === 'UPI' ? (
                                                    <AtSign className="w-6 h-6 text-gray-400 dark:text-gray-500 mt-1 shrink-0" />
                                                ) : (
                                                    <CreditCard className="w-6 h-6 text-gray-400 dark:text-gray-500 mt-1 shrink-0" />
                                                )}
                                                <div>
                                                    {/* Conditional Text */}
                                                    {method.type === 'UPI' ? (
                                                        <h3 className="font-bold text-gray-800 dark:text-white">{method.upiId}</h3>
                                                    ) : (
                                                        <>
                                                            <h3 className="font-bold text-gray-800 dark:text-white">{method.type} ending in {method.lastFour}</h3>
                                                            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Expires {method.expiry}</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0 ml-2">
                                                {/* <button className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"><Edit className="w-4 h-4" /></button> */}
                                                <button onClick={() => setMethodToDelete(method)} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                        {/* Set as Default Button */}
                                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                            <button 
                                                onClick={() => handleSetDefault(method.id)}
                                                className="flex items-center gap-2 text-sm font-medium"
                                                disabled={method.isDefault}
                                            >
                                                {method.isDefault ? (
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-400" />
                                                )}
                                                <span className={method.isDefault ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                                                    {method.isDefault ? "Default Payment Method" : "Set as Default"}
                                                </span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                                {/* "Add New" button at the bottom of the list */}
                                {methods.length > 0 && (
                                    <motion.button 
                                        onClick={() => setIsAdding(true)} 
                                        className="w-full flex items-center justify-center gap-2 py-3 font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    >
                                        <Plus className="w-5 h-5"/> Add New Method
                                    </motion.button>
                                )}
                                {/* Centered "Add New" button for the empty state */}
                                {methods.length === 0 && (
                                    <div className="text-center py-20">
                                        <CreditCard className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                                        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300">No payment methods yet</h2>
                                        <p className="text-gray-500 dark:text-gray-400 mt-2">Add your first payment method to get started.</p>
                                        <button onClick={() => setIsAdding(true)} className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-full hover:bg-yellow-600 transition-colors">
                                            <Plus className="w-5 h-5"/> Add Your First Method
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
            <AnimatePresence>
                {methodToDelete && (
                    <DeleteConfirmationModal 
                        method={methodToDelete} 
                        onConfirm={handleConfirmDelete} 
                        onCancel={() => setMethodToDelete(null)} 
                    />
                )}
            </AnimatePresence>
        </>
    );
}