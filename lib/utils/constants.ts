// This file serves as the Single Source of Truth for all environment variables.

// API Configuration
// We use '||' to provide a fallback if the .env file is missing during dev
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'https://server.eazika.com';

// Construct the full API Base URL (v2)
export const API_BASE_URL = `${SERVER_URL}/api/v2`;

// Analytics
export const GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID || '';

// Other Constants (You can add more here later, e.g., MAX_FILE_SIZE)
export const APP_NAME = "Eazika";
export const DEFAULT_PAGE_SIZE = 10;