import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative items-center justify-center  flex z-1">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs">
              <p className="text-center text-white text-2xl">
                 AI Agent Demo
                </p>
                <div className="w-full h-0.5 bg-white my-5"></div>
                <div className='flex items-center justify-center'>
                <Link href="/" className="  flex items-center justify-center">
                  <Image
                    width={50}
                    height={50}
                    src="/images/logo/plant_planet.png"
                    alt="Logo"
                  />
                  
                </Link>
                <span className="text-center  dark:text-white/60 text-bold text-white">
                  Plant Planet
                  </span>
                </div>
                
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
