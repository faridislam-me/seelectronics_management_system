import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import localFont from "next/font/local";
import { Slide, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";
import { ConnectivityAlert } from "@/components";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-primary",
  display: "swap",
});

const displayFont = localFont({
  src: "../assets/fonts/oldenglishtextmt.ttf",
  variable: "--font-display",
  display: "swap",
});

const scriptFont = localFont({
  src: "../assets/fonts/edwardianscriptitc.ttf",
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SE Electronics",
  description: "SE Electronics Service Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Marks pages opened inside the SE mobile apps (see --sab in globals.css) */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(/SE (Technician|Electrician|Customer|Seller)App/.test(navigator.userAgent))document.documentElement.classList.add('se-app')}catch(e){}",
          }}
        />
      </head>
      <body
        className={`${ubuntu.variable} ${displayFont.variable} ${scriptFont.variable} font-sans`}
        suppressHydrationWarning
      >
        <ConnectivityAlert />
        {children}
        <ToastContainer
          position="top-center"
          autoClose={1500}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          draggable
          pauseOnHover
          theme="colored"
          transition={Slide}
        />
      </body>
    </html>
  );
}
