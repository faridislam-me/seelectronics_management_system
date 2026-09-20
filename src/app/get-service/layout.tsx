import React from "react";
import Image from "next/image";

export default function ServiceFormLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <header className="bg-white shadow-sm border-b border-gray-100 py-4 px-4 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-row items-center justify-center gap-3 sm:gap-5">
          <div className="flex-shrink-0">
            <Image 
              src="/logo.jpg" 
              alt="SE Electronics Logo" 
              width={56} 
              height={56}
              className="rounded-full shadow-sm border border-gray-100 object-cover"
              priority
            />
          </div>
          <h1 className="font-bold text-[13px] sm:text-base md:text-lg tracking-[0.2em] uppercase text-center text-gray-800">
            SE ELECTRONICS Service Form
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  );
}
