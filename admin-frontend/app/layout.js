import './globals.css';

export const metadata = {
  title: 'SteelEstimate Admin',
  description: 'Secure admin dashboard for managing leads and quotation workflows',
};

function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;
