'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, LogIn, UserPlus, X } from 'lucide-react';

interface AuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: 'login' | 'signup';
}

export default function AuthModal({ isOpen: propIsOpen, onClose: propOnClose, initialTab = 'login' }: AuthModalProps) {
  const [isOpen, setIsOpen] = useState(propIsOpen ?? false);
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  
  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync prop isOpen with local state
  useEffect(() => {
    if (propIsOpen !== undefined) {
      setIsOpen(propIsOpen);
    }
  }, [propIsOpen]);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setError('');
      // Clean forms
      setLoginEmail('');
      setLoginPassword('');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
    }
  }, [isOpen, initialTab]);

  // Listen to global open event
  useEffect(() => {
    const handleGlobalOpen = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) {
        setTab(customEvent.detail.tab);
      }
      setIsOpen(true);
    };

    window.addEventListener('printear_open_auth', handleGlobalOpen);
    return () => {
      window.removeEventListener('printear_open_auth', handleGlobalOpen);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (propOnClose) propOnClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new Event('printear_auth_change')); // Sync header
        handleClose();
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName, email: signupEmail, password: signupPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        window.dispatchEvent(new Event('printear_auth_change')); // Sync header
        handleClose();
      } else {
        setError(data.error || 'Error creating account');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 36, 71, 0.5)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={handleClose}>
      
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        position: 'relative',
        animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          className="close-hover"
          title="Close Modal"
        >
          <X size={18} />
        </button>

        {/* Tab Selection */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
          <button 
            style={{
              flex: 1,
              padding: '18px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              fontFamily: 'var(--font-title)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: 'none',
              background: 'transparent',
              borderBottom: `2px solid ${tab === 'login' ? 'var(--accent-primary)' : 'transparent'}`,
              color: tab === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Sign In
          </button>
          <button 
            style={{
              flex: 1,
              padding: '18px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              fontFamily: 'var(--font-title)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              border: 'none',
              background: 'transparent',
              borderBottom: `2px solid ${tab === 'signup' ? 'var(--accent-primary)' : 'transparent'}`,
              color: tab === 'signup' ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 0.2s'
            }}
            onClick={() => { setTab('signup'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        {/* Content Form */}
        <div style={{ padding: '32px' }}>
          {error && (
            <div style={{
              background: 'rgba(217, 83, 79, 0.1)',
              border: '1px solid rgba(217, 83, 79, 0.2)',
              color: 'var(--danger)',
              fontSize: '13px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '6px', fontFamily: 'var(--font-title)' }}>Welcome Back</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Sign in to access your customized print dashboard.</p>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }} 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)} 
                    placeholder="youremailhere@gmail.com" 
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '4px' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }} 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)} 
                    placeholder="••••••••" 
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={loading}
              >
                <LogIn size={16} />
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '20px', marginBottom: '6px', fontFamily: 'var(--font-title)' }}>Create Account</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Save templates and track orders instantly.</p>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }} 
                    value={signupName} 
                    onChange={(e) => setSignupName(e.target.value)} 
                    placeholder="John Doe" 
                  />
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }} 
                    value={signupEmail} 
                    onChange={(e) => setSignupEmail(e.target.value)} 
                    placeholder="youremailhere@gmail.com" 
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '4px' }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    required 
                    className="input-field" 
                    style={{ paddingLeft: '40px' }} 
                    value={signupPassword} 
                    onChange={(e) => setSignupPassword(e.target.value)} 
                    placeholder="Min 6 characters" 
                    minLength={6}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={loading}
              >
                <UserPlus size={16} />
                <span>{loading ? 'Creating...' : 'Register'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .close-hover:hover {
          background-color: var(--bg-primary) !important;
          color: var(--text-primary) !important;
        }
      `}</style>
    </div>
  );
}
