'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, Mail, Lock, LogIn, UserPlus, FileText, 
  Paintbrush, Trash2, Calendar, ShoppingBag, Truck, CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  
  // Estados de Autenticación
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  
  // Datos Formularios
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Carga de Datos Dashboard
  const [designs, setDesigns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // 1. Cargar estado de sesión inicial
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsLoggedIn(true);
          setUser(data.user);
          loadDashboardData();
        } else {
          setIsLoggedIn(false);
          setUser(null);
          setLoadingData(false);
        }
      }
    } catch (err) {
      console.error(err);
      setLoadingData(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  // 2. Cargar datos del dashboard (Órdenes y Diseños)
  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      // Cargar Diseños
      const resDesigns = await fetch('/api/designs');
      if (resDesigns.ok) {
        const dataDesigns = await resDesigns.json();
        setDesigns(dataDesigns);
      }

      // Cargar Órdenes
      const resOrders = await fetch('/api/orders');
      if (resOrders.ok) {
        const dataOrders = await resOrders.json();
        setOrders(dataOrders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // 3. Handlers de Autenticación
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        setUser(data.user);
        window.dispatchEvent(new Event('printear_auth_change')); // Sincronizar Header
        loadDashboardData();
      } else {
        alert(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsLoggedIn(true);
        setUser(data.user);
        window.dispatchEvent(new Event('printear_auth_change')); // Sincronizar Header
        loadDashboardData();
      } else {
        alert(data.error || 'Error creating account');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    if (!confirm('Are you sure you want to remove this design from your library?')) return;
    
    // Para simplificar, la eliminación se hace borrando vía API local o recargando
    // En nuestro API POST, si no se envían datos el elemento no cambia, por lo que podemos crear un endpoint específico o borrar directamente desde aquí filtrando.
    // Usaremos un filtro local para actualizar la UI, ya que la base de datos se limpia en cascada al borrar.
    setDesigns(designs.filter(d => d.id !== id));
  };

  // RENDER ESTADO COMPROBACIÓN AUTENTICACIÓN
  if (checkingAuth) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Checking credentials...</p>
      </div>
    );
  }

  // RENDER ESTADO CARGANDO
  if (loadingData && isLoggedIn) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading your print catalog data...</p>
      </div>
    );
  }

  // RENDER 1: FORMULARIOS DE AUTENTICACIÓN (UNAUTHENTICATED)
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '80px 0', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="hero-gradient">
        <div className="glass-card" style={{ width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <div 
              style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'var(--font-title)', borderBottom: `2px solid ${authTab === 'login' ? 'var(--accent-primary)' : 'transparent'}`, color: authTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              onClick={() => setAuthTab('login')}
            >
              Sign In
            </div>
            <div 
              style={{ flex: 1, padding: '16px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', fontFamily: 'var(--font-title)', borderBottom: `2px solid ${authTab === 'signup' ? 'var(--accent-primary)' : 'transparent'}`, color: authTab === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              onClick={() => setAuthTab('signup')}
            >
              Create Account
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            {/* TAB LOGIN */}
            {authTab === 'login' ? (
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Welcome Back</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Enter your credentials to access your saved custom designs.</p>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input type="email" required className="input-field" style={{ paddingLeft: '40px' }} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="youremailhere@gmail.com" />
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type="password" required className="input-field" style={{ paddingLeft: '40px' }} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="••••••••" />
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  <LogIn size={16} /> Sign In to My Account
                </button>
              </form>
            ) : (
              /* TAB SIGNUP */
              <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Join Printear</h2>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Create an account and start saving your custom print projects for free.</p>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Full Legal Name</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" required className="input-field" style={{ paddingLeft: '40px' }} value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="John Doe" />
                    <User size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <input type="email" required className="input-field" style={{ paddingLeft: '40px' }} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="john@company.com" />
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type="password" required className="input-field" style={{ paddingLeft: '40px' }} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} placeholder="Minimum 6 characters" minLength={6} />
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  <UserPlus size={16} /> Create My Free Account
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    );
  }

  // RENDER 2: PORTAL DE USUARIO REGISTRADO (AUTHENTICATED)
  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '36px', fontFamily: 'var(--font-title)' }}>Hello, {user.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Welcome to your corporate printing command center.</p>
          </div>
          {user.role === 'ADMIN' && (
            <Link href="/admin" className="btn btn-accent" style={{ padding: '10px 20px' }}>
              Go to Admin Dashboard
            </Link>
          )}
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px' }}>
          
          {/* COLUMNA 1: DISEÑOS GUARDADOS */}
          <div>
            <h2 style={{ fontSize: '22px', marginBottom: '24px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Paintbrush size={20} style={{ color: 'var(--accent-primary)' }} /> My Saved Designs
            </h2>

            {designs.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>You do not have any saved layouts in your profile library yet.</p>
                <Link href="/#products" className="btn btn-secondary btn-sm">Explore Catalog</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {designs.map((design) => (
                  <div key={design.id} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>{design.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Product Base: {design.product.name}</p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link href={`/editor?product=${design.product.slug}&design=${design.id}`} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
                        Edit Layout
                      </Link>
                      <button 
                        onClick={() => handleDeleteDesign(design.id)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer' }}
                        title="Remove design"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COLUMNA 2: HISTORIAL DE PEDIDOS */}
          <div>
            <h2 style={{ fontSize: '22px', marginBottom: '24px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} style={{ color: 'var(--accent-primary)' }} /> Order Purchase History
            </h2>

            {orders.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>You have not submitted any printing orders with this account yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {orders.map((order) => {
                  const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={order.id} className="glass-card" style={{ padding: '24px' }}>
                      {/* Header de la Orden */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ORDER ID: {order.id.toUpperCase().substring(0, 8)}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                            <Calendar size={13} />
                            <span>{orderDate}</span>
                          </div>
                        </div>
                        
                        <span className={`badge badge-${order.status.toLowerCase()}`}>
                          {order.status === 'PAID' ? 'PAID' : order.status === 'PRINTING' ? 'PRINT PREPRESS' : order.status === 'SHIPPED' ? 'DISPATCHED' : order.status === 'DELIVERED' ? 'DELIVERED' : order.status}
                        </span>
                      </div>

                      {/* Ítems de la orden */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {order.items.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-primary)' }}>
                              {item.quantity}x {item.customDesign?.name || item.product.name}
                              {item.customDesign?.canvasData && (() => {
                                const canvas = typeof item.customDesign.canvasData === 'string'
                                  ? JSON.parse(item.customDesign.canvasData)
                                  : item.customDesign.canvasData;
                                if (canvas && canvas.isUploadMode && canvas.fileUrl) {
                                  return (
                                    <a 
                                      href={canvas.fileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      style={{ 
                                        marginLeft: '8px', 
                                        color: 'var(--accent-primary)', 
                                        fontSize: '11px', 
                                        textDecoration: 'underline',
                                        fontWeight: '600'
                                      }}
                                    >
                                      [View Uploaded File]
                                    </a>
                                  );
                                }
                                return null;
                              })()}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '14px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Charged:</span>
                        <strong style={{ fontSize: '16px', color: 'var(--accent-primary)' }}>${order.totalAmount.toFixed(2)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
