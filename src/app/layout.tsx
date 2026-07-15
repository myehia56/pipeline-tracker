import "./globals.css";

export const metadata = {
  title: "The Hunt",
  description: "Pipeline Tracker",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* Service Worker for PWA Installation */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) { 
                      console.log('Service Worker registration successful'); 
                    },
                    function(err) { 
                      console.log('Service Worker registration failed: ', err); 
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