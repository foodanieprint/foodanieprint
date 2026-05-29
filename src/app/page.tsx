'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Printer, ArrowRight, Award, Zap, Truck, Sparkles, 
  Layers, CheckCircle, ShieldCheck
} from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Cargar productos y categorías desde la API
  useEffect(() => {
    async function loadCatalogData() {
      try {
        const [resProducts, resCategories] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ]);
        if (resProducts.ok) {
          const data = await resProducts.json();
          setProducts(data);
        }
        if (resCategories.ok) {
          const data = await resCategories.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error loading catalog data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalogData();
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      
      {/* 1. HERO SECTION (MAIN) */}
      <section className="hero-gradient" style={{ padding: 'var(--section-padding-y) 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
          
          {/* Hero Text */}
          <div className="animate-fade-in-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 102, 0, 0.08)', border: '1px solid rgba(255, 102, 0, 0.3)', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-orange)', marginBottom: '24px' }}>
              <Sparkles size={14} />
              <span>DESIGN, PRINT AND STAND OUT</span>
            </div>
            
            <h1 style={{ fontSize: '56px', lineHeight: '1.1', marginBottom: '24px', fontWeight: '800' }}>
              Premium <span className="gradient-text">Custom Printing</span> Services for Your Business
            </h1>
            
            <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
              Create your business cards, branded corporate apparel, and promotional materials online using our interactive real-time editor. High precision, luxury finishes, and fast shipping.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="#products" className="btn btn-primary" style={{ padding: '14px 28px' }}>
                Browse Catalog <ArrowRight size={18} />
              </a>
              <Link href="/editor?product=business-cards" className="btn btn-secondary" style={{ padding: '14px 28px' }}>
                Design Free Cards
              </Link>
            </div>

            {/* Trust Assurances */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '48px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Award size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>100% Print Quality Guarantee</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <Zap size={18} style={{ color: 'var(--accent-primary)' }} />
                <span>Express Shipping Available</span>
              </div>
            </div>
          </div>

          {/* Visual Hero Graphic */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {/* Glowing background bubble */}
            <div style={{ position: 'absolute', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(0, 111, 66, 0.15) 0%, transparent 70%)', filter: 'blur(20px)', zIndex: 1 }}></div>
            
            <div className="glass-card" style={{ padding: '24px', width: '100%', maxWidth: '420px', position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Press Preview</span>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
              </div>
              
              {/* Simulated Card */}
              <div style={{ height: '200px', background: 'linear-gradient(135deg, #002447 0%, #003666 100%)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '30px' }}>
                {/* Bleed line virtual */}
                <div style={{ position: 'absolute', top: '4px', left: '4px', right: '4px', bottom: '4px', border: '1px dashed rgba(255, 255, 255, 0.3)' }}></div>
                
                <h3 style={{ fontSize: '20px', color: 'white', marginBottom: '4px', zIndex: 2 }}>CREATIVE STUDIO</h3>
                <p style={{ fontSize: '11px', color: 'var(--accent-orange)', letterSpacing: '0.1em', marginBottom: '20px', zIndex: 2 }}>DIGITAL BOOST</p>
                <div style={{ width: '100px', height: '2px', background: 'var(--accent-orange)', marginBottom: '16px', zIndex: 2 }}></div>
                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.7)', zIndex: 2 }}>✉ hello@creativestudio.com | ☎ +1 (555) 123-4567</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginTop: '8px' }}>
                <span>Business Cards</span>
                <strong style={{ color: 'var(--accent-primary)' }}>From $9.99</strong>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. PRODUCT CATALOG */}
      <section id="products" style={{ padding: 'var(--section-padding-y) 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 56px auto' }}>
            <h2 style={{ fontSize: '38px', marginBottom: '16px' }}>Our Print Catalog</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              Select the product you would like to print. Choose your physical specifications and personalize the design completely online.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-secondary)', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Loading premium catalog...</p>
            </div>
          ) : (
            <>
              {/* Category Filter Bar */}
              {categories.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  gap: '12px', 
                  flexWrap: 'wrap', 
                  marginBottom: '48px', 
                  padding: '6px', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  backdropFilter: 'blur(8px)', 
                  borderRadius: 'var(--radius-full)', 
                  border: '1px solid var(--border-color)', 
                  maxWidth: 'fit-content', 
                  margin: '0 auto 48px auto',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <button 
                    onClick={() => setSelectedCategorySlug('all')}
                    style={{ 
                      padding: '10px 24px', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      border: 'none', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: selectedCategorySlug === 'all' ? 'var(--accent-primary)' : 'transparent', 
                      color: selectedCategorySlug === 'all' ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: selectedCategorySlug === 'all' ? '0 4px 12px rgba(0, 150, 136, 0.15)' : 'none'
                    }}
                  >
                    All Products
                  </button>
                  {categories.map((cat) => {
                    const isActive = selectedCategorySlug === cat.slug;
                    return (
                      <button 
                        key={cat.id}
                        onClick={() => setSelectedCategorySlug(cat.slug)}
                        style={{ 
                          padding: '10px 24px', 
                          borderRadius: 'var(--radius-full)', 
                      fontSize: '13px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      border: 'none', 
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      background: isActive ? 'var(--accent-primary)' : 'transparent', 
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      boxShadow: isActive ? '0 4px 12px rgba(0, 150, 136, 0.15)' : 'none'
                        }}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '32px' }}>
                {(() => {
                  const filteredProducts = selectedCategorySlug === 'all'
                    ? products
                    : products.filter(p => p.categoryId === categories.find(c => c.slug === selectedCategorySlug)?.id);

                  if (filteredProducts.length > 0) {
                    return filteredProducts.map((prod) => (
                      <div key={prod.id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>
                        {/* Cover Image */}
                        <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                          <img 
                            src={prod.thumbnail} 
                            alt={prod.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                            className="prod-img"
                          />
                          <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(11, 13, 23, 0.85)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-secondary)', border: '1px solid var(--border-color)' }}>
                            From ${prod.basePrice.toFixed(2)}
                          </div>
                        </div>

                        {/* Details */}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>{prod.name}</h3>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>
                            {prod.description}
                          </p>
                          
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                            <Link href={`/products/${prod.slug}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                              Configure
                            </Link>
                            <Link href={`/editor?product=${prod.slug}`} className="btn btn-primary btn-sm" style={{ flex: 1, padding: '8px 12px' }}>
                              Personalize
                            </Link>
                          </div>
                        </div>
                      </div>
                    ));
                  } else {
                    return (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <Printer size={32} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h4 style={{ marginBottom: '8px' }}>No products found</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>There are no products in this category yet.</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </>
          )}

        </div>
      </section>

      {/* 3. PRINT PRECISION GRAPHIC BLOCK */}
      <section style={{ padding: 'var(--section-padding-y) 0', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '56px', alignItems: 'center' }}>
          
          {/* Explain Canvas Card */}
          <div className="glass-card" style={{ padding: '32px', background: 'var(--bg-secondary)' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '24px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
              Professional Press Precision
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '4px', background: 'var(--danger)', borderRadius: 'var(--radius-full)' }}></div>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>Bleed Margin Line (Bleed Edge)</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Outer safety margin for mechanical paper cutting, preventing unsightly unprinted raw white borders.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '4px', background: 'var(--accent-primary)', borderRadius: 'var(--radius-full)' }}></div>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>Safe Layout Zone (Safe Text Margin)</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Guarantees that all your typography, details, and branding logos remain safe during industrial guillotine cutting.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ width: '4px', background: 'var(--success)', borderRadius: 'var(--radius-full)' }}></div>
                <div>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>Full Vector SVG Exports</h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Our print team downloads your custom assets in original vector SVG format to preserve crisp lines and perfect resolution.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div>
            <h2 style={{ fontSize: '38px', marginBottom: '20px', lineHeight: '1.2' }}>Precision Prepress Blueprint Designing</h2>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
              The integrated Printear editor is engineered to meet strict industrial print production standards. Just like on UPrinting and VistaPrint, you will see real-time safe zones and bleed lines to configure your card graphics with complete confidence.
            </p>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
              You can upload custom logos, resize objects with dedicated handle controls, and duplicate layers in one click. Your final project prints in clean vector paths.
            </p>

            <Link href="/editor?product=business-cards" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
              Try the Editor <Sparkles size={16} style={{ marginLeft: '8px', color: 'var(--accent-secondary)' }} />
            </Link>
          </div>

        </div>
      </section>

      {/* 4. THREE-STEP PROCESS */}
      <section style={{ padding: 'var(--section-padding-y) 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 56px auto' }}>
            <h2 style={{ fontSize: '34px', marginBottom: '16px' }}>How Printear Works</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>The fastest and most elegant way to secure high-quality physical products for your business.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '32px' }}>
            
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 102, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--accent-primary)' }}>
                <strong style={{ fontSize: '18px' }}>1</strong>
              </div>
              <h4 style={{ fontSize: '18px', marginBottom: '12px' }}>1. Choose Your Product</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Select business cards, mugs, flyers, or corporate t-shirts and customize premium material options and elegant finishes.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: 'var(--accent-secondary)' }}>
                <strong style={{ fontSize: '18px' }}>2</strong>
              </div>
              <h4 style={{ fontSize: '18px', marginBottom: '12px' }}>2. Create Your Blueprint</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Use our full-screen editor. Add rich typography, upload corporate branding logos, and place geometric vector shapes.
              </p>
            </div>

            <div className="glass-card" style={{ padding: '30px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(121, 40, 202, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', color: '#a78bfa' }}>
                <strong style={{ fontSize: '18px' }}>3</strong>
              </div>
              <h4 style={{ fontSize: '18px', marginBottom: '12px' }}>3. Delivered to Your Door</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Complete your secure trial checkout. Our team downloads high-resolution vector SVGs and dispatches your order instantly.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
