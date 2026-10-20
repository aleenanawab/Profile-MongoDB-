import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AvtivePlatformHeader } from "@/components/AvtivePlatformHeader";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Avtive | Complete Profile Platform",
  description: "Avtive - Complete Profile Platform. Multiple Profiles, Custom Themes, and Smart Privacy Sharing.",
  keywords: ["Avtive", "Profile Platform", "Digital Identity", "Privacy Sharing", "Next.js", "TypeScript"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="editorial"
      suppressHydrationWarning
      className="h-full antialiased font-sans"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Purge legacy oversized cookies that cause 494 REQUEST_HEADER_TOO_LARGE
                  var cookies = document.cookie.split(';');
                  for (var i = 0; i < cookies.length; i++) {
                    var c = cookies[i].trim();
                    var eq = c.indexOf('=');
                    var name = eq > -1 ? c.substring(0, eq).trim() : c.trim();
                    if (name === 'avtive_prof_count' || name.indexOf('avtive_prof_') === 0) {
                      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;';
                      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname + ';';
                    }
                  }
                  var savedPortfolioTheme = localStorage.getItem('portfolio_theme') || 'editorial';
                  document.documentElement.setAttribute('data-theme', savedPortfolioTheme);
                  var savedTheme = localStorage.getItem('avtive_theme_pref');
                  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
        <ThemeProvider>
          <div className="flex-1 flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
