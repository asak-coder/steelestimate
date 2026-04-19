import './globals.css';

export const metadata = {
  title: 'SteelEstimate',
  description: 'SteelEstimate SaaS for secure admin workflows, estimation, and public steel tools',
};

function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export default RootLayout;