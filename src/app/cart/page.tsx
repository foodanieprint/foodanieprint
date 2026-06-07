'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Trash2, ShoppingCart, ArrowLeft, ArrowRight, Minus, 
  Plus, Tag, ShieldCheck, Truck
} from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  
  // Opciones de Envío
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const shippingPrice = shippingMethod === 'express' ? 15.00 : 5.00;

  // 1. Cargar el carrito desde localStorage
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('printear_cart') || '[]');
    setCartItems(items);
  }, []);

  // 2. Calcular subtotal al cambiar ítems
  useEffect(() => {
    let total = 0;
    cartItems.forEach((item) => {
      total += parseFloat(item.unitPrice) * parseInt(item.quantity);
    });
    setSubtotal(total);
  }, [cartItems]);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    setCartItems(updated);
    localStorage.setItem('printear_cart', JSON.stringify(updated));
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter((item) => item.id !== id);
    setCartItems(updated);
    localStorage.setItem('printear_cart', JSON.stringify(updated));
  };

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        
        <h1 style={{ fontSize: 'var(--h1-size)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <ShoppingCart size={32} style={{ color: 'var(--accent-primary)' }} /> Your Print Shopping Cart
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Review your custom design files before submitting them to production.</p>

        {cartItems.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <ShoppingCart size={48} style={{ color: 'var(--text-muted)', marginBottom: '20px' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Your Shopping Cart is Empty</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              You don't have any custom design layouts saved in your cart yet. Explore our catalog and customize your prints today!
            </p>
            <Link href="/" className="btn btn-primary">
              Explore Print Catalog
            </Link>
          </div>
        ) : (
          <div className="cart-grid">
            
            {/* LISTA DE ARTÍCULOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {cartItems.map((item) => {
                const parsedSpecs = typeof item.selectedSpecs === 'string' ? JSON.parse(item.selectedSpecs) : item.selectedSpecs;
                
                return (
                  <div key={item.id} className="glass-card cart-item-card">
                    
                    {/* Thumbnail del Producto */}
                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                      <img 
                        src={item.thumbnail} 
                        alt={item.productName} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Descripción y Especificaciones */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '4px' }}>{item.designName}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '4px' }}>Product Base: {item.productName}</p>
                      {item.printReadyFileUrl && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          📄 Print-Ready File: <a href={item.printReadyFileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)', textDecoration: 'underline', fontWeight: '600' }}>{item.printReadyFileName || 'View Uploaded File'}</a>
                        </div>
                      )}
                      
                      {/* Opciones Seleccionadas */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(() => {
                          // Calcular cantidad real basada en specs
                          let specQty = 1;
                          let hasQtySpec = false;
                          Object.entries(parsedSpecs).forEach(([k, v]: [string, any]) => {
                            if (k.toLowerCase().includes('quantity') || k.toLowerCase().includes('cantidad') || k.toLowerCase() === 'qty') {
                              const parsed = parseInt(v.replace(/[^0-9]/g, ''), 10);
                              if (!isNaN(parsed) && parsed > 0) {
                                specQty = parsed;
                                hasQtySpec = true;
                              }
                            }
                          });
                          const totalStands = hasQtySpec ? (specQty * item.quantity) : item.quantity;

                          return Object.entries(parsedSpecs).map(([key, val]: [string, any]) => {
                            const isStandOption = key.toLowerCase().includes('stand');
                            const isYesValue = val.toLowerCase() === 'yes' || val.toLowerCase() === 'sí' || val.toLowerCase() === 'si';
                            return (
                              <span key={key} style={{ fontSize: '11px', background: 'var(--bg-input)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                {key}: {val} {isStandOption && isYesValue && `(Includes ${totalStands} H-Stands)`}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Ajustador de cantidad */}
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                      <button className="btn" style={{ padding: '6px 10px', border: 'none', background: 'none' }} onClick={() => updateQuantity(item.id, -1)}><Minus size={12} /></button>
                      <span style={{ padding: '0 12px', fontSize: '13px', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button className="btn" style={{ padding: '6px 10px', border: 'none', background: 'none' }} onClick={() => updateQuantity(item.id, 1)}><Plus size={12} /></button>
                    </div>

                    {/* Precio y eliminar */}
                    <div className="cart-item-price-block">
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        (${parseFloat(item.unitPrice).toFixed(2)} / pack)
                      </div>
                    </div>

                    <button 
                      onClick={() => removeItem(item.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>
                );
              })}

              {/* Botón Seguir Comprando */}
              <Link href="/#products" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', marginTop: '12px' }}>
                <ArrowLeft size={16} /> Keep Designing More Products
              </Link>
            </div>

            {/* RESUMEN DEL PEDIDO */}
            <div className="glass-card cart-summary-card" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '20px', fontFamily: 'var(--font-title)' }}>Order Summary</h3>

              {/* Subtotal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Item Subtotal:</span>
                <span style={{ fontWeight: 'bold' }}>${subtotal.toFixed(2)}</span>
              </div>

              {/* Opciones de Envío */}
              <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '20px 0', margin: '20px 0' }}>
                <label className="form-label" style={{ marginBottom: '12px' }}>Shipping Option</label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingMethod === 'standard'} 
                      onChange={() => setShippingMethod('standard')}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    <span>Standard Ground Shipping (5-7 Days) - <strong>$5.00</strong></span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="shipping" 
                      checked={shippingMethod === 'express'} 
                      onChange={() => setShippingMethod('express')}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                    <span>Express Priority Shipping (1-2 Days) - <strong>$15.00</strong></span>
                  </label>
                </div>
              </div>

              {/* Total final */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>Estimated Subtotal:</span>
                <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'var(--font-title)' }}>
                  ${(subtotal + shippingPrice).toFixed(2)}
                </span>
              </div>

              {/* Botón Proceder al Pago */}
              <button 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px' }} 
                onClick={() => router.push(`/checkout?shipping=${shippingMethod}`)}
              >
                Proceed to Checkout <ArrowRight size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                <span>Printear Safe Checkout Guarantee</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
