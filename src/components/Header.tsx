'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, User, Printer, LogOut, Shield, Menu, X } from 'lucide-react';
import AuthModal from './AuthModal';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  // Si estamos en el editor de canvas, ocultamos la barra de navegación estándar
  if (pathname === '/editor') {
    return null;
  }

  // 1. Verificar sesión de usuario
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Escuchar cambios en el carrito
  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('printear_cart') || '[]');
    setCartCount(cart.length);
  };

  useEffect(() => {
    checkAuth();
    updateCartCount();

    // Polling ligero para mantener sincronizado el carrito si cambia de página
    const interval = setInterval(updateCartCount, 2000);

    // Escuchar el evento de logout o login en otras páginas
    window.addEventListener('printear_auth_change', checkAuth);

    return () => {
      clearInterval(interval);
      window.removeEventListener('printear_auth_change', checkAuth);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth', { method: 'DELETE' });
      if (res.ok) {
        setUser(null);
        localStorage.removeItem('printear_cart'); // Opcional, limpiar carrito al salir
        window.dispatchEvent(new Event('printear_auth_change'));
        setMobileMenuOpen(false);
        router.push('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* 1. UPRINTING UPPER PROMOTION BAR */}
      <div style={{ background: 'var(--text-primary)', color: 'white', fontSize: '11px', textAlign: 'center', padding: '6px 12px', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-title)' }}>
        🚚 FREE SHIPPING ON ALL BUSINESS CARD ORDERS | PROMO CODE: <span style={{ color: 'var(--accent-orange)' }}>PRINTEAR2026</span>
      </div>

      {/* 2. MAIN BRAND HEADER */}
      <header className="glass-nav">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          
          {/* LOGO */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '20px', fontFamily: 'var(--font-title)', color: 'var(--text-primary)' }}>
            <Printer size={22} style={{ color: 'var(--accent-primary)' }} />
            <span>PRINTEAR</span>
          </Link>

          {/* SIMULATED SEARCH BAR */}
          <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '4px 12px', width: '280px', height: '36px', gap: '8px' }}>
            <svg style={{ color: 'var(--text-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Search products (e.g. Mugs)..." style={{ border: 'none', background: 'none', fontSize: '12px', width: '100%', outline: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }} disabled />
          </div>

          {/* NAVEGACIÓN PRINCIPAL */}
          <nav className="mobile-hide" style={{ display: 'flex', gap: '24px', fontSize: '11px', fontFamily: 'var(--font-title)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Link href="/#products" style={{ color: 'var(--text-primary)' }} className="nav-link">Products</Link>
            <Link href="/editor?product=business-cards" style={{ color: 'var(--text-primary)' }} className="nav-link">Canvas Editor</Link>
            {user && user.role === 'ADMIN' && (
              <Link href="/admin" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={14} /> Admin Panel
              </Link>
            )}
          </nav>

          {/* ACCIONES DEL USUARIO / ACCESOS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Carrito */}
            <Link href="/cart" style={{ position: 'relative', display: 'flex', alignItems: 'center', padding: '8px', color: 'var(--text-primary)' }} title="View My Cart">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: 'var(--accent-primary)',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Menú de Usuario */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', background: 'var(--bg-primary)', padding: '6px 12px', borderRadius: 'var(--radius-sm)' }}>
                  <User size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span className="mobile-hide">{user.name.split(' ')[0].toUpperCase()}</span>
                </Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '8px' }} title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthModalTab('login');
                  setIsAuthModalOpen(true);
                }} 
                className="btn btn-secondary btn-sm" 
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <User size={14} />
                <span>Sign In</span>
              </button>
            )}

            {/* HAMBURGER TOGGLE BUTTON */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="desktop-hide"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-primary)', 
                cursor: 'pointer', 
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>

        </div>
      </header>

      {/* 3. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', fontFamily: 'var(--font-title)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Link href="/#products" style={{ color: 'var(--text-primary)', padding: '8px 0' }} onClick={() => setMobileMenuOpen(false)}>Products</Link>
              <Link href="/editor?product=business-cards" style={{ color: 'var(--text-primary)', padding: '8px 0' }} onClick={() => setMobileMenuOpen(false)}>Canvas Editor</Link>
              {user && user.role === 'ADMIN' && (
                <Link href="/admin" style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0' }} onClick={() => setMobileMenuOpen(false)}>
                  <Shield size={16} /> Admin Panel
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Auth Modal Component */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        initialTab={authModalTab} 
      />
    </>
  );
}

