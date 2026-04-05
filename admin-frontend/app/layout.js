import './globals.css';

export const metadata = {
  title: 'TEKLA AI | PEB Instant Quotation',
  description: 'High-conversion PEB estimation frontend for instant quotations, industrial trust, and lead capture'
};

function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;