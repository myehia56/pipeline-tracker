// Keep your existing imports at the very top (like globals.css or fonts)
 import "./globals.css"; 

export const metadata = {
  title: "The Hunt",
  description: "Pipeline Tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* The Nuclear Option: Forcing Chrome to see the manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        {children}
        
        {/* The Heartbeat: Forcing the browser to recognize a true PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) { 
                      console.log('Service Worker registration successful:', registration.scope); 
                    },
                    function(err) { 
                      console.log('Service Worker registration failed:', err); 
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}