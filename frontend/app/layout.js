import './globals.css';
import { AuthProvider } from '../components/AuthProvider';

export const metadata = {
  title: 'SteelEstimate',
  description: 'SteelEstimate SaaS for secure admin workflows, estimation, and public steel tools',
};

function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

export default RootLayout;
