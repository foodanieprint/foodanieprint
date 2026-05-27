'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CreditCard, ShieldCheck, CheckCircle2, ArrowLeft, 
  Printer, ArrowRight, Truck, Calendar
} from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const shippingMethod = searchParams.get('shipping') || 'standard';
  const shippingPrice = shippingMethod === 'express' ? 15.00 : 5.00;

  // Carrito y Totales
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);

  // Formulario Envío
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    zip: '',
    phone: '',
  });

  // Formulario Pago
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });

  // Estado Transacción
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);

  // 1. Cargar datos del carrito
  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('printear_cart') || '[]');
    setCartItems(items);

    if (items.length === 0 && !success) {
      router.push('/');
    }

    let sub = 0;
    items.forEach((it: any) => {
      sub += parseFloat(it.unitPrice) * it.quantity;
    });
    setSubtotal(sub);
    setTotal(sub + shippingPrice);
  }, [success]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardData({ ...cardData, [e.target.name]: e.target.value });
  };

  // 2. Enviar Pedido a la Base de Datos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Mapear los items locales al formato esperado por el backend
      const itemsForBackend = cartItems.map((item) => ({
        productId: item.productId,
        customDesignId: item.customDesignId,
        quantity: item.quantity,
        selectedSpecs: item.selectedSpecs, // JSON string
        unitPrice: item.unitPrice,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingName: formData.name,
          shippingAddress: formData.address,
          shippingCity: formData.city,
          shippingZip: formData.zip,
          shippingPhone: formData.phone,
          items: itemsForBackend,
        }),
      });

      if (!response.ok) throw new Error('Error processing order');
      
      const data = await response.json();
      
      // Limpiar Carrito Local al tener éxito
      localStorage.removeItem('printear_cart');
      
      setOrderResult(data.order);
      setSuccess(true);
    } catch (err) {
      alert('Checkout error. Please verify PostgreSQL connection or fallback in-memory status.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (success && orderResult) {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (shippingMethod === 'express' ? 2 : 7));

    return (
      <div style={{ padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '650px', textAlign: 'center' }}>
          
          <div className="glass-card responsive-card-padding" style={{ borderTop: '4px solid var(--success)' }}>
            <CheckCircle2 size={56} style={{ color: 'var(--success)', margin: '0 auto 24px auto' }} />
            
            <h1 style={{ fontSize: 'var(--h1-size)', marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Order Received Successfully!</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '32px' }}>
              Your simulation transaction completed successfully. Your custom layout files have been dispatched to our printing prepress queues.
            </p>

            {/* Ficha del Pedido */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Order Reference ID:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{orderResult.id.toUpperCase().substring(0, 8)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Customer Name:</span>
                <span style={{ fontWeight: 'bold' }}>{orderResult.shippingName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Shipping Destination:</span>
                <span style={{ fontWeight: 'bold', textAlign: 'right' }}>{orderResult.shippingAddress}, {orderResult.shippingCity}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Amount Charged:</span>
                <strong style={{ color: 'var(--accent-primary)' }}>${orderResult.totalAmount.toFixed(2)}</strong>
              </div>
            </div>

            {/* Fecha Estimada */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '32px' }}>
              <Truck size={18} style={{ color: 'var(--success)' }} />
              <span style={{ fontSize: '13px' }}>Estimated Delivery Date: <strong>{deliveryDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <Link href="/" className="btn btn-primary" style={{ flex: 1 }}>
                Back to Home
              </Link>
              <Link href="/dashboard" className="btn btn-secondary" style={{ flex: 1 }}>
                View My Orders
              </Link>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        
        <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back to Cart
        </Link>

        <h1 style={{ fontSize: 'var(--h1-size)', marginBottom: '40px', fontFamily: 'var(--font-title)' }}>Secure Checkout Gateway</h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px' }}>
          
          {/* COLUMNA 1: DATOS DE ENVÍO */}
          <div className="glass-card responsive-card-padding">
            <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', fontFamily: 'var(--font-title)' }}>
              1. Shipping Destination Address
            </h3>

            <div className="form-group">
              <label className="form-label">Full Legal Name</label>
              <input type="text" name="name" required className="input-field" value={formData.name} onChange={handleInputChange} placeholder="e.g. John Doe" />
            </div>

            <div className="form-group">
              <label className="form-label">Street Address</label>
              <input type="text" name="address" required className="input-field" value={formData.address} onChange={handleInputChange} placeholder="e.g. 123 Main Street, Apt 4B" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" name="city" required className="input-field" value={formData.city} onChange={handleInputChange} placeholder="e.g. San Francisco" />
              </div>
              <div className="form-group">
                <label className="form-label">ZIP / Postal Code</label>
                <input type="text" name="zip" required className="input-field" value={formData.zip} onChange={handleInputChange} placeholder="e.g. 94103" />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label">Contact Phone Number</label>
              <input type="tel" name="phone" required className="input-field" value={formData.phone} onChange={handleInputChange} placeholder="e.g. +1 (555) 987-6543" />
            </div>
          </div>

          {/* COLUMNA 2: PAGO MOCK & CONFIRMACIÓN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Formulario de Pago */}
            <div className="glass-card responsive-card-padding">
              <h3 style={{ fontSize: '18px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={18} style={{ color: 'var(--accent-primary)' }} />
                2. Payment Simulation (Secure Mock Processing)
              </h3>

              <div className="form-group">
                <label className="form-label">Credit Card Number</label>
                <input type="text" name="number" required className="input-field" value={cardData.number} onChange={handleCardChange} placeholder="4000 1234 5678 9010" maxLength={19} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '0' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Expiration Date</label>
                  <input type="text" name="expiry" required className="input-field" value={cardData.expiry} onChange={handleCardChange} placeholder="MM/AA" maxLength={5} />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">CVV Security Code</label>
                  <input type="password" name="cvc" required className="input-field" value={cardData.cvc} onChange={handleCardChange} placeholder="***" maxLength={4} />
                </div>
              </div>
            </div>

            {/* Confirmación y Checkout Button */}
            <div className="glass-card responsive-card-padding">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Subtotal Prints:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <span>Shipping Fees:</span>
                <span>${shippingPrice.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginBottom: '24px' }}>
                <span style={{ fontWeight: 'bold' }}>Total Amount Due:</span>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'var(--font-title)' }}>
                  ${total.toFixed(2)}
                </span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px' }}
                disabled={processing}
              >
                {processing ? 'Simulating Transaction...' : 'Confirm Order & Secure Pay'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '11px', color: 'var(--text-secondary)', justifyContent: 'center' }}>
                <ShieldCheck size={14} style={{ color: 'var(--success)' }} />
                <span>Simulated secure SSL encrypted checkout connection</span>
              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', fontWeight: 'bold' }}>
        <p>Loading Secure Checkout...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
