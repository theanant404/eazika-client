"use client";

import React, { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Phone, Lock, ArrowRight, Loader2 } from "lucide-react";
import { userService } from "@/services/userService";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requestId, setRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    router.refresh();
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer, router]);
  // Helper to set cookies for Middleware
  const setAuthCookies = (token: string, role: string) => {
    const maxAge = 7 * 24 * 60 * 60; // 7 days
    document.cookie = `accessToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `userRole=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      // Use Service instead of raw fetch
      const data = await userService.loginUser(cleanPhone);

      if (data?.data?.requestId) {
        setRequestId(data.data.requestId);
        setStep(2);
        setTimer(30);
      } else {
        toast.error(data.message || "Failed to send OTP.");
        return;
      }
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await userService.verifyLogin({
        phone: phone.replace(/\D/g, ""),
        requestId,
        otp,
        deviceInfo: navigator.userAgent,
      });

      if (data.data?.accessToken) {
        const token = data.data.accessToken;
        const user = data.data.user;
        const role = user?.role || "user"; // Default to user if role missing

        // 1. Update Store & LocalStorage (For Client-side Logic)
        // setAuthToken(token);
        if (user) await localStorage.setItem("user", JSON.stringify(user));

        await setAuthCookies(token, role);

        if (redirectPath) {
          router.push(redirectPath);
        } else if (role === "admin") router.push("/admin");
        else if (role === "shopkeeper") router.push("/shop");
        else if (role === "delivery_boy") router.push("/delivery");
        else router.push("/");
        toast.success("Logged in successfully!");
        router.refresh();
      } else {
        toast.error(data.message || "Invalid OTP.");
        return;
      }
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message || "Failed to verify OTP.");
      return;
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setLoading(true);
    try {
      await userService.resendLoginOtp(phone.replace(/\D/g, ""), requestId);
      setTimer(30);
      toast.success("OTP resent successfully!");
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl border border-yellow-100 dark:border-yellow-900/20 w-full relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="mb-8 text-center relative z-10">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-400 mb-4 transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome Back
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          {step === 1
            ? "Enter your mobile number to login"
            : `OTP sent to +91 ${phone}`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleSendOtp}
            className="space-y-5 relative z-10"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mobile Number
              </label>
              <div className="relative group">
                <Phone
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 group-focus-within:text-yellow-600 transition-colors"
                  size={20}
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white text-lg tracking-wide placeholder:text-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className="w-full bg-yellow-400 text-black font-bold py-3.5 rounded-xl hover:bg-yellow-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex justify-center items-center shadow-md"
            >
              {loading ? <Loader2 className="animate-spin" /> : "GET OTP"}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleVerifyOtp}
            className="space-y-5 relative z-10"
          >
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter OTP
                </label>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline font-medium"
                >
                  Change Number
                </button>
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500 group-focus-within:text-yellow-600 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • •"
                  maxLength={4}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all dark:text-white text-lg tracking-[0.5em] text-center font-bold placeholder:tracking-normal placeholder:text-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 4}
              className="w-full bg-yellow-400 text-black font-bold py-3.5 rounded-xl hover:bg-yellow-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex justify-center items-center shadow-md"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "VERIFY & LOGIN"
              )}
            </button>

            <div className="text-center mt-4">
              {timer > 0 ? (
                <p className="text-sm text-gray-400">Resend OTP in {timer}s</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-sm font-bold text-gray-900 dark:text-white hover:text-yellow-500 transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  Resend OTP <ArrowRight size={14} />
                </button>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-8 text-center pt-6 border-t border-gray-100 dark:border-gray-800 relative z-10">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Don&#39;t have an account?
          <Link
            href="/register"
            className="text-yellow-600 dark:text-yellow-400 font-bold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
