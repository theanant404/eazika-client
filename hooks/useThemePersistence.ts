import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export const useTheme = () => {
    // 1. Initialize state by reading from localStorage
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window === 'undefined') {
            return 'light'; // Default for server-side render
        }
        
        const storedTheme = localStorage.getItem('app-theme');
        // Type assertion is safe here as stored values are 'light' or 'dark'
        return (storedTheme as Theme) || 'light'; 
    });

    // 2. useEffect to sync theme to DOM and localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const root = document.documentElement;
            
            // Sync DOM class
            if (theme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
            
            // Save preference to localStorage
            localStorage.setItem('app-theme', theme);
        }
    }, [theme]); // Reruns whenever the theme state changes

    // Custom setter function
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return { 
        theme, 
        setTheme 
    };
};