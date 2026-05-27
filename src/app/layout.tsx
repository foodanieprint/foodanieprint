import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Printear - Premium Custom E-Commerce Printing (VistaPrint Standard)',
  description: 'Create, design, and order custom corporate print products online: business cards, printed t-shirts, ceramic mugs, and promotional flyers with high fidelity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {/* Premium Header */}
        <Header />

        {/* Contenido Principal */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>

        {/* Premium Footer */}
        <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', padding: '40px 0 20px 0', marginTop: 'auto' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px', marginBottom: '32px' }}>
              <div>
                <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>PRINTEAR</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  The leading corporate custom printing web portal. Empowering businesses through premium custom layout designs.
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>Popular Products</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <li><a href="/editor?product=business-cards">Business Cards</a></li>
                  <li><a href="/editor?product=custom-tshirts">Custom T-Shirts</a></li>
                  <li><a href="/editor?product=gradient-mugs">Ceramic Mugs</a></li>
                  <li><a href="/editor?product=promotional-flyers">Promotional Flyers</a></li>
                </ul>
              </div>
              <div>
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px', fontFamily: 'var(--font-title)' }}>Customer Support</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  ✉ support@printear.com<br />
                  ☎ +56 9 1234 5678<br />
                  ⏱ Mon to Fri: 9am - 6pm
                </p>
              </div>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                &copy; {new Date().getFullYear()} Printear Inc. All rights reserved.
              </p>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <a href="#">Terms of Service</a>
                <a href="#">Privacy Policy</a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
