'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Flame, Award, ArrowLeft, Paintbrush, Upload, CheckCircle2, ShieldCheck, HelpCircle, ChevronDown,
  ShoppingCart, X
} from 'lucide-react';
import { calculateDynamicPrice } from '@/lib/pricingUtils';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [unitPrice, setUnitPrice] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // States for Print-Ready Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUploadFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setUploadedFileUrl(data.url);
      setUploadedFileName(file.name);
    } catch (err: any) {
      alert(err.message || 'Error uploading file.');
      setUploadFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadAddToCart = async () => {
    if (!product) return;
    if (!uploadedFileUrl) {
      alert('Please upload a print-ready file first.');
      return;
    }

    setSaving(true);
    try {
      const canvasBlobData = JSON.stringify({
        isUploadMode: true,
        fileUrl: uploadedFileUrl,
        fileName: uploadedFileName,
      });

      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          name: `Upload: ${uploadedFileName}`,
          canvasData: canvasBlobData,
          previewUrl: uploadedFileUrl.toLowerCase().endsWith('.pdf') ? product.thumbnail : uploadedFileUrl,
        }),
      });

      if (!response.ok) throw new Error('Error saving custom design layout');
      const savedDesign = await response.json();

      const cartItem = {
        id: `cart-item-${Date.now()}`,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        thumbnail: uploadedFileUrl.toLowerCase().endsWith('.pdf') ? product.thumbnail : uploadedFileUrl,
        customDesignId: savedDesign.id,
        designName: `Upload: ${uploadedFileName}`,
        quantity: 1,
        selectedSpecs: JSON.stringify(selectedSpecs),
        unitPrice: unitPrice,
        printReadyFileUrl: uploadedFileUrl,
        printReadyFileName: uploadedFileName,
      };

      const existingCart = JSON.parse(localStorage.getItem('printear_cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('printear_cart', JSON.stringify(existingCart));

      setIsUploadModalOpen(false);
      router.push('/cart');
    } catch (err: any) {
      alert(err.message || 'An error occurred while adding file to cart.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Cargar producto por slug
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error('Producto no encontrado');
        const data = await res.json();
        setProduct(data);
        
        // Inicializar especificaciones por defecto o por parámetros URL
        const initialSpecs: Record<string, string> = {};
        const groups = new Set(data.specs.map((s: any) => s.group));
        groups.forEach((group: any) => {
          const queryVal = searchParams.get(group);
          if (queryVal && data.specs.some((s: any) => s.group === group && s.value === queryVal)) {
            initialSpecs[group] = queryVal;
          } else {
            const firstVal = data.specs.find((s: any) => s.group === group);
            if (firstVal) initialSpecs[group] = firstVal.value;
          }
        });
        setSelectedSpecs(initialSpecs);
        setUnitPrice(data.basePrice);

        // Inicializar activeImage con la imagen principal del producto (thumbnail)
        setActiveImage(data.thumbnail || '');

        setLoading(false);
      } catch (err) {
        console.error(err);
        router.push('/');
      }
    }
    fetchProduct();
  }, [slug]);

  // Recalcular precio unitario al cambiar especificaciones
  useEffect(() => {
    if (!product) return;
    const { unitPrice: calculatedPrice } = calculateDynamicPrice(product, selectedSpecs);
    setUnitPrice(calculatedPrice);
  }, [selectedSpecs, product]);

  const handleAddToCart = () => {
    if (!product) return;

    const cartItem = {
      id: `cart-item-${Date.now()}`,
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      thumbnail: activeImage || product.thumbnail,
      customDesignId: null,
      designName: `${product.name} (Standard Option)`,
      quantity: 1,
      selectedSpecs: JSON.stringify(selectedSpecs),
      unitPrice: unitPrice,
    };

    const existingCart = JSON.parse(localStorage.getItem('printear_cart') || '[]');
    existingCart.push(cartItem);
    localStorage.setItem('printear_cart', JSON.stringify(existingCart));

    router.push('/cart');
  };



  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading product specifications...</p>
      </div>
    );
  }

  // Detect selected size for filtering child specs (e.g. parentValue matching)
  const sizeKey = Object.keys(selectedSpecs).find(
    (k) =>
      k.toLowerCase() === 'size' ||
      k.toLowerCase() === 'tamaño' ||
      k.toLowerCase() === 'tamano' ||
      k.toLowerCase() === 'dimensions'
  );
  const activeSelectedSize = sizeKey ? selectedSpecs[sizeKey] : null;

  // Agrupar especificaciones por categoría/grupo para el UI, filtrando por tamaño padre si aplica
  const specGroups = (product.specs || []).reduce((acc: any, spec: any) => {
    // Si la especificación tiene un parentValue (pertenece a un tamaño específico),
    // solo se muestra si coincide con el tamaño actualmente seleccionado por el cliente
    if (spec.parentValue && activeSelectedSize && spec.parentValue !== activeSelectedSize) {
      return acc;
    }
    if (!acc[spec.group]) acc[spec.group] = [];
    acc[spec.group].push(spec);
    return acc;
  }, {});

  return (
    <div style={{ padding: '40px 0', background: 'var(--bg-primary)', position: 'relative' }}>
      {openDropdown && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 15 }} 
          onClick={() => setOpenDropdown(null)} 
        />
      )}
      <div className="container" style={{ position: 'relative', zIndex: 16 }}>
        
        {/* Enlace Volver */}
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '24px', fontFamily: 'var(--font-title)' }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>

        {/* SPLIT LAYOUT: COLUMNA IZQUIERDA (PREVIEW & CONFIANZA) / COLUMNA DERECHA (STICKY CONFIGURATOR) */}
        <div className="product-details-grid">
          
          {/* COLUMNA IZQUIERDA: FOTO DEL PRODUCTO BASE Y CARDS DE CONFIANZA */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Visual Preview */}
            {(() => {
              const galleryImages = Array.isArray(product.images)
                ? product.images
                : typeof product.images === 'string'
                  ? JSON.parse(product.images || '[]')
                  : [];
              
              const specImages = product.specs
                ? product.specs
                    .map((s: any) => s.imageUrl)
                    .filter((url: any) => url && typeof url === 'string' && url.trim() !== '')
                : [];

              const allImagesSet = new Set<string>();
              if (product.thumbnail) {
                allImagesSet.add(product.thumbnail);
              }
              galleryImages.forEach((img: string) => {
                if (img) allImagesSet.add(img);
              });
              specImages.forEach((img: string) => {
                if (img) allImagesSet.add(img);
              });

              const finalImages = Array.from(allImagesSet);


              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Main Image Container (Square 1:1 Aspect Ratio) */}
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '1 / 1', 
                    borderRadius: '24px', 
                    overflow: 'hidden', 
                    border: '1px solid var(--border-color)', 
                    position: 'relative',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    cursor: 'zoom-in'
                  }}
                  onClick={() => setLightboxOpen(true)}
                  >
                    <img 
                      src={activeImage || product.thumbnail} 
                      alt={product.name} 
                      decoding="async"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'contain',
                        transition: 'all 0.3s ease'
                      }}
                    />

                    {/* View Larger Badge inside Image Container */}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxOpen(true);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '16px',
                        right: '16px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '30px',
                        padding: '8px 16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontFamily: 'var(--font-body)',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        zIndex: 10
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={{ fontSize: '13px' }}>🔍</span>
                      <span>View Larger</span>
                    </button>

                    {/* Navigation Arrows inside Main Image */}
                    {finalImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const idx = finalImages.indexOf(activeImage);
                            const prevIdx = idx <= 0 ? finalImages.length - 1 : idx - 1;
                            setActiveImage(finalImages[prevIdx]);
                          }}
                          style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            color: 'var(--text-primary)',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            zIndex: 10
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          &#10094;
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const idx = finalImages.indexOf(activeImage);
                            const nextIdx = idx === finalImages.length - 1 ? 0 : idx + 1;
                            setActiveImage(finalImages[nextIdx]);
                          }}
                          style={{
                            position: 'absolute',
                            right: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            transition: 'all 0.2s ease',
                            color: 'var(--text-primary)',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            zIndex: 10
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                          }}
                        >
                          &#10095;
                        </button>
                      </>
                    )}
                  </div>

                  {/* Carousel / Thumbnails Section - only if > 1 image */}
                  {finalImages.length > 1 && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      justifyContent: 'center',
                      padding: '4px 0',
                      marginTop: '8px'
                    }}>
                      {finalImages.map((imgUrl: string, index: number) => {
                        const isSelected = activeImage === imgUrl;
                        return (
                          <div 
                            key={index}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImage(imgUrl);
                            }}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: isSelected ? '3px solid var(--accent-primary)' : '1px solid var(--border-color)',
                              boxShadow: isSelected ? '0 4px 12px rgba(0, 111, 66, 0.15)' : 'none',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                              flexShrink: 0,
                              background: '#ffffff'
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'var(--text-secondary)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            <img 
                              src={imgUrl} 
                              alt={`${product.name} gallery ${index + 1}`} 
                              loading="lazy"
                              decoding="async"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* UPRINTING TRUST CREDENTIALS WIDGET */}
            <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Printear Quality Assurance
              </h4>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Free Pre-Flight Technical Review</h5>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Our operators will inspect your canvas layout files manually before sending them to press.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <ShieldCheck size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h5 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Guillotine Precision Cutting</h5>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Pre-aligned trim lines and bleed zones guarantee symmetrical logo layouts.</p>
                </div>
              </div>
            </div>

          </div>

          {/* COLUMNA DERECHA: CONFIGURADOR DERECHO STICKY */}
          <div className="glass-card sticky-configurator" style={{ background: 'var(--bg-secondary)' }}>
            
            {/* Orange Promo Tag */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 102, 0, 0.08)', border: '1px solid rgba(255, 102, 0, 0.2)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-orange)', marginBottom: '16px' }}>
              <Flame size={12} />
              <span>SAVE 20% WITH CODE: PRINTEAR2026!</span>
            </div>

            <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: '800' }}>{product.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              {product.description}
            </p>

            {/* SELECCIÓN DE OPCIONES Y ACABADOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Configure Your Physical Options:
              </h3>

              {Object.entries(specGroups).map(([group, specsList]: [string, any]) => {
                const selectedValue = selectedSpecs[group] || '';
                const isNeutral = !selectedValue || 
                                  selectedValue.toLowerCase() === 'none' || 
                                  selectedValue.toLowerCase().includes('no special') ||
                                  selectedValue.toLowerCase() === 'basic' ||
                                  selectedValue.toLowerCase() === 'standard' ||
                                  selectedValue.toLowerCase().includes('no back');
                                  
                const borderColor = isNeutral ? 'var(--border-color)' : '#8cc63f';
                const labelColor = isNeutral ? 'var(--text-muted)' : '#5b9317'; // darker green for text contrast

                const isOrientation = group.toLowerCase() === 'orientation';
                const isPaper = group.toLowerCase() === 'paper' || group.toLowerCase() === 'paper stock';

                return (
                  <div key={group} style={{ marginBottom: '16px' }}>
                    {/* Paper Thickness Link above Paper field */}
                    {isPaper && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                        <a 
                          href="#paper-thickness" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            alert("Paper Thickness Guide:\n\n14 pt. Gloss is a thick, industry-standard cardstock with a glossy finish that makes colors vibrant.\n\n16 pt. Premium Matte is an extra-heavy premium cardstock with a soft, non-reflective matte finish for a luxury tactile experience."); 
                          }} 
                          style={{ 
                            fontSize: '12px', 
                            color: '#0066cc', 
                            textDecoration: 'none', 
                            cursor: 'pointer', 
                            fontFamily: 'var(--font-body)',
                            fontWeight: '600'
                          }}
                        >
                          Paper Thickness
                        </a>
                      </div>
                    )}

                    {isOrientation ? (
                      /* CUSTOM ORIENTATION SPLIT SELECTOR */
                      <div 
                        style={{ 
                          position: 'relative',
                          border: `1.5px solid #8cc63f`, // Always green since Horizontal/Vertical are active choices
                          borderRadius: '6px',
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          height: '52px',
                          boxShadow: 'var(--shadow-sm)',
                          width: '100%'
                        }}
                      >
                        {/* Floating-cut Label */}
                        <span style={{
                          position: 'absolute',
                          top: '-9px',
                          left: '12px',
                          background: 'var(--bg-secondary)',
                          padding: '0 6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#5b9317',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          zIndex: 2,
                          fontFamily: 'var(--font-title)'
                        }}>
                          {group}
                        </span>

                        {/* Split Buttons */}
                        {specsList.map((spec: any, idx: number) => {
                          const isSelected = selectedValue === spec.value;
                          const isHorizontal = spec.value.toLowerCase() === 'horizontal';
                          
                          return (
                            <React.Fragment key={spec.id}>
                              {idx > 0 && (
                                <div style={{ width: '1.5px', height: '100%', background: 'var(--border-color)' }}></div>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSpecs({ ...selectedSpecs, [group]: spec.value });
                                  if (spec.imageUrl && spec.imageUrl.trim()) {
                                    setActiveImage(spec.imageUrl);
                                  } else {
                                    setActiveImage(product.thumbnail || '');
                                  }
                                }}
                                style={{
                                  flex: 1,
                                  height: '100%',
                                  background: 'transparent',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '10px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: isSelected ? '700' : '500',
                                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                  outline: 'none',
                                  transition: 'all 0.2s ease',
                                  zIndex: 1
                                }}
                              >
                                {/* Card Shape Icon Indicator */}
                                {isHorizontal ? (
                                  <div 
                                    style={{ 
                                      width: '24px', 
                                      height: '14px', 
                                      borderRadius: '2px', 
                                      backgroundColor: isSelected ? '#8cc63f' : '#d1d5db',
                                      transition: 'background-color 0.2s ease'
                                    }} 
                                  />
                                ) : (
                                  <div 
                                    style={{ 
                                      width: '14px', 
                                      height: '24px', 
                                      borderRadius: '2px', 
                                      backgroundColor: isSelected ? '#8cc63f' : '#d1d5db',
                                      transition: 'background-color 0.2s ease'
                                    }} 
                                  />
                                )}
                                <span>{spec.value}</span>
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      /* STANDARD SELECTOR CONTAINER (CUSTOM SELECT DROPDOWN) */
                      <div 
                        style={{ 
                          position: 'relative',
                          border: `1.5px solid ${borderColor}`,
                          borderRadius: '6px',
                          padding: '0 16px',
                          background: 'var(--bg-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          height: '52px',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease',
                          boxShadow: 'var(--shadow-sm)',
                          zIndex: openDropdown === group ? 25 : 1
                        }}
                        onClick={() => setOpenDropdown(openDropdown === group ? null : group)}
                      >
                        {/* Floating-cut Label */}
                        <span style={{
                          position: 'absolute',
                          top: '-9px',
                          left: '12px',
                          background: 'var(--bg-secondary)',
                          padding: '0 6px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: labelColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          transition: 'color 0.2s ease',
                          zIndex: 2,
                          fontFamily: 'var(--font-title)'
                        }}>
                          {group}
                        </span>

                        {/* Custom Select Value text display */}
                        <div style={{ 
                          width: '100%',
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          paddingRight: '80px',
                          display: 'flex',
                          alignItems: 'center',
                          height: '100%',
                          userSelect: 'none'
                        }}>
                          {selectedValue}
                        </div>

                        {/* Custom Options List Dropdown */}
                        {openDropdown === group && (
                          <div 
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: '-1.5px',
                              right: '-1.5px',
                              background: '#ffffff', // Pure white background
                              border: `1.5px solid ${borderColor}`,
                              borderRadius: '6px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              zIndex: 30,
                              maxHeight: '240px',
                              overflowY: 'auto',
                              padding: '6px 0'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent close on list click
                          >
                            {specsList.map((spec: any) => {
                              const isSelected = selectedValue === spec.value;
                              // Calculate difference if this spec were chosen
                              const hypotheticalSpecs = { ...selectedSpecs, [group]: spec.value };
                              const hypotheticalPrice = calculateDynamicPrice(product, hypotheticalSpecs).unitPrice;
                              const diff = hypotheticalPrice - unitPrice;
                              const markupText = !isSelected && Math.abs(diff) >= 0.01
                                ? (diff > 0 ? `(+$${diff.toFixed(2)})` : `(-$${Math.abs(diff).toFixed(2)})`)
                                : '';
                              return (
                                <div
                                  key={spec.id}
                                  onClick={() => {
                                    setSelectedSpecs({ ...selectedSpecs, [group]: spec.value });
                                    setOpenDropdown(null);
                                    if (spec.imageUrl && spec.imageUrl.trim()) {
                                      setActiveImage(spec.imageUrl);
                                    } else {
                                      setActiveImage(product.thumbnail || '');
                                    }
                                  }}
                                  style={{
                                    padding: '12px 16px', // Comfortable padding as requested!
                                    fontSize: '14px',
                                    fontWeight: isSelected ? '700' : '500',
                                    color: isSelected ? '#5b9317' : 'var(--text-primary)',
                                    background: isSelected ? '#f5f9eb' : 'transparent', // very light green if selected
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = '#f9fafb'; // Very light gray hover
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) {
                                      e.currentTarget.style.background = 'transparent';
                                    }
                                  }}
                                >
                                  <span>{spec.value}</span>
                                  {markupText && (
                                    <span style={{ fontSize: '12px', fontWeight: '600', color: markupText.startsWith('(+-') || markupText.startsWith('(-') ? '#0284c7' : '#16a34a' }}>
                                      {markupText}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Icons Indicator overlay */}
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          pointerEvents: 'none',
                          zIndex: 2
                        }}>
                          {/* Help Tooltip (Optional, e.g. for Coating or Finish or Paper options) */}
                          {(group.toLowerCase().includes('coating') || group.toLowerCase().includes('finish') || group.toLowerCase().includes('paper')) && (
                            <div 
                              title={
                                group.toLowerCase().includes('coating') 
                                ? "Coating protects your card and enhances colors. High Gloss UV is shiny, Matte is elegant and non-reflective."
                                : "Paper selection affects weight and texture. Gloss is shiny and vibrant, Matte is soft and elegant."
                              }
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: '#8cc63f',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                cursor: 'help',
                                pointerEvents: 'auto'
                              }}
                            >
                              <span style={{ fontSize: '10px', fontWeight: 'bold', transform: 'translateY(-0.5px)' }}>?</span>
                            </div>
                          )}
                          
                          {/* Valid Selection Checkmark */}
                          {!isNeutral && (
                            <div style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#8cc63f',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#ffffff'
                            }}>
                              <span style={{ fontSize: '10px', fontWeight: 'bold', transform: 'translateY(-0.5px)' }}>✔</span>
                            </div>
                          )}
                          
                          {/* Dropdown Chevron */}
                          <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* PRECIO DINÁMICO Y CTAs APILADAS */}
            <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Estimated unit price:</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'var(--font-title)' }}>
                    ${unitPrice.toFixed(2)}
                  </div>
                  {Object.entries(selectedSpecs).some(([k, v]: [string, any]) => k.toLowerCase().includes('stand') && (v.toLowerCase() === 'yes' || v.toLowerCase() === 'si' || v.toLowerCase() === 'sí')) && (
                    <div style={{ fontSize: '11px', color: '#5b9317', fontWeight: 'bold', marginTop: '2px' }}>
                      * Includes 1 H-Stand per Yard Sign ordered
                    </div>
                  )}
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="btn btn-primary"
                  style={{ width: '100%', gap: '8px', padding: '14px' }}
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>

                <Link 
                  href={`/editor?product=${product.slug}&${new URLSearchParams(selectedSpecs).toString()}`} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', gap: '8px', padding: '14px' }}
                >
                  <Paintbrush size={16} /> Design Online
                </Link>

                <button 
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="btn btn-secondary" 
                  style={{ width: '100%', gap: '8px', padding: '14px' }}
                >
                  <Upload size={16} /> Upload Print-Ready Design
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Lightbox Zoom Modal */}
      {lightboxOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'zoom-out',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <div style={{ 
            position: 'relative', 
            maxWidth: '90%', 
            maxHeight: '90%',
            animation: 'zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeImage || product.thumbnail} 
              alt={product.name} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '90vh', 
                objectFit: 'contain',
                borderRadius: '16px',
                border: '4px solid #ffffff',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }} 
            />
            <button
              type="button"
              style={{
                position: 'absolute',
                top: '-45px',
                right: '0',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '36px',
                cursor: 'pointer',
                fontWeight: 'bold',
                lineHeight: '1',
                padding: '5px'
              }}
              onClick={() => setLightboxOpen(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Upload Print-Ready Design Modal */}
      {isUploadModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsUploadModalOpen(false)}
        >
          <div 
            style={{ 
              background: '#ffffff',
              borderRadius: '16px',
              padding: '40px',
              width: '90%',
              maxWidth: '600px',
              position: 'relative',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsUploadModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(0, 111, 66, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
              <Upload size={32} />
            </div>

            <div>
              <h2 style={{ fontSize: '22px', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: '800' }}>Upload Print-Ready File</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 auto', maxWidth: '400px' }}>
                Upload your high-resolution layout file. We support **PDF, JPG, and PNG** files in their original quality.
              </p>
            </div>

            {/* DROPZONE AREA */}
            <div 
              style={{
                width: '100%',
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '30px 20px',
                background: '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const input = document.createElement('input');
                  input.type = 'file';
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  input.files = dataTransfer.files;
                  const event = { target: input } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleUploadFileChange(event);
                }
              }}
            >
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                onChange={handleUploadFileChange} 
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
              />
              {uploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Uploading file in original quality...</span>
                </div>
              ) : uploadedFileUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '32px' }}>{uploadedFileName.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, wordBreak: 'break-all' }}>{uploadedFileName}</p>
                    <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '600' }}>✔ Uploaded Successfully</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--accent-primary)' }}>Click to browse files</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>or drag and drop layout files here</span>
                </div>
              )}
            </div>

            {uploadedFileUrl && !uploadedFileName.toLowerCase().endsWith('.pdf') && (
              <div style={{ width: '100%', height: '180px', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={uploadedFileUrl} alt="Uploaded Print Ready Layout" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '16px', width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '12px' }} 
                onClick={() => setIsUploadModalOpen(false)}
              >
                <ArrowLeft size={16} /> Back to Product
              </button>
              
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                onClick={handleUploadAddToCart}
                disabled={saving || uploading || !uploadedFileUrl}
              >
                {saving ? (
                  'Saving...'
                ) : uploading ? (
                  'Uploading...'
                ) : !uploadedFileUrl ? (
                  'Upload Design First'
                ) : (
                  <>
                    <ShoppingCart size={16} /> Add to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Loading product specifications...</p>
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  );
}
