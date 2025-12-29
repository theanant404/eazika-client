"use client";
import LocationGuard from "@/components/LocationGuard";
import { usePathname, useSearchParams } from "next/navigation";
import React from "react";

export default function AuthLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathName = usePathname();
    const searchParams = useSearchParams();
    const redirect = searchParams?.get("redirect") || "";

    return (
        <>
            {pathName !== "/shop/register" && redirect !== "/shop/register" && redirect !== "/admin" && redirect !== "/rider" && redirect !== "/shop" ? (
                <LocationGuard />
            ) : null}
            <div className="min-h-screen w-full bg-[#fffdf5] dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
                <div
                    className="absolute inset-0 z-0 opacity-[0.20] dark:opacity-[0.10]"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23f59e0b' stroke-width='2'%3E%3C!-- Apple/Fruit --%3E%3Ccircle cx='20' cy='20' r='8' /%3E%3Cpath d='M20 12 v-3 m-2 0 h4' stroke-linecap='round'/%3E%3C!-- Shopping Bag --%3E%3Crect x='60' y='15' width='14' height='16' rx='2' /%3E%3Cpath d='M63 15 a5 5 0 0 1 8 0' /%3E%3C!-- Wheat/Carrot Abstract --%3E%3Cpath d='M20 70 l5 -10 l5 10 m-5 -10 v15' stroke-linecap='round'/%3E%3C!-- Box/Carton --%3E%3Crect x='60' y='65' width='12' height='12' /%3E%3Cpath d='M60 65 l6 -4 l6 4' /%3E%3C/g%3E%3C/svg%3E\")",
                        backgroundSize: "100px 100px",
                    }}
                ></div>

                <div className="absolute inset-0 bg-linear-to-b from-transparent via-white/50 to-white/90 dark:from-transparent dark:via-gray-950/50 dark:to-gray-950/90 pointer-events-none z-0"></div>

                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-yellow-400/30 dark:bg-yellow-600/15 rounded-full blur-[80px] animate-pulse"></div>
                    <div className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-orange-300/30 dark:bg-orange-600/15 rounded-full blur-[80px] animate-pulse delay-1000"></div>
                </div>

                <div className="w-full max-w-md z-10 relative">{children}</div>
            </div>
        </>
    );
}
