"use client";

import React, { useState } from "react";
import { ArrowLeft, Smile, Bug, Star, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";

// --- Type for Feedback ---
type FeedbackType = "Suggestion" | "Bug" | "Compliment";

// --- Star Rating Component ---
const StarRating = ({
  rating,
  setRating,
}: {
  rating: number;
  setRating: (rating: number) => void;
}) => {
  return (
    <div className="flex justify-center space-x-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          type="button"
          key={star}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setRating(star)}
          className="p-1"
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </motion.button>
      ))}
    </div>
  );
};

// --- Main Page Component ---
export default function SupportFeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("Suggestion");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || rating === 0) {
      toast.error("Please leave a rating and a message.");
      return;
    }

    toast.success("Thank you for your feedback!");
    // Reset form
    setRating(0);
    setMessage("");
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <Toaster position="bottom-center" />
      {/* Header */}
      <header className="px-4 md:px-6 py-4 flex items-center space-x-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
        <a href="/support" aria-label="Go back to support">
          <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-white" />
        </a>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          App Feedback
        </h1>
      </header>

      {/* Main Content */}
      <main className="grow overflow-y-auto p-2 md:p-6">
        <motion.form
          onSubmit={handleSubmit}
          className="max-w-lg mx-auto"
          initial="hidden"
          animate="visible"
          variants={itemVariants}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 space-y-6">
            {/* Feedback Type */}
            <div>
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 text-center">
                What is this about?
              </label>
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-full">
                <button
                  type="button"
                  onClick={() => setFeedbackType("Suggestion")}
                  className={`w-1/3 py-2.5 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                    feedbackType === "Suggestion"
                      ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <Lightbulb className="w-4 h-4" /> Suggestion
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType("Bug")}
                  className={`w-1/3 py-2.5 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                    feedbackType === "Bug"
                      ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <Bug className="w-4 h-4" /> Bug
                </button>
                <button
                  type="button"
                  onClick={() => setFeedbackType("Compliment")}
                  className={`w-1/3 py-2.5 rounded-full font-semibold transition-colors flex items-center justify-center gap-2 text-sm ${
                    feedbackType === "Compliment"
                      ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm"
                      : "text-gray-500"
                  }`}
                >
                  <Smile className="w-4 h-4" /> Compliment
                </button>
              </div>
            </div>

            {/* Star Rating */}
            <div className="pt-4 border-t dark:border-gray-700">
              <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                How is your experience?
              </label>
              <StarRating rating={rating} setRating={setRating} />
            </div>

            {/* Message */}
            <div className="pt-4 border-t dark:border-gray-700">
              <label
                htmlFor="message"
                className="block text-lg font-semibold text-gray-900 dark:text-white mb-3 text-center"
              >
                Tell us more
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, suggestions, or issues..."
                className="block w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:text-white min-h-[120px]"
                rows={5}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-full text-center hover:bg-yellow-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
