'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Type, Square, Circle, Image as ImageIcon, Layers, 
  Trash2, Copy, MoveUp, MoveDown, Undo, Redo, 
  Save, ShoppingCart, Plus, Minus, ArrowLeft,
  ChevronRight, Award, HelpCircle, ChevronDown,
  Sliders, Upload, Palette, Grid, Columns, Search, Maximize2,
  Settings, Eye, EyeOff, Edit3, Shield,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { getCanvasDimensions } from '@/lib/canvasUtils';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number; // in pixels
  y: number;
  width: number;
  height: number;
  angle: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  src?: string; // base64 or URL
  shapeType?: 'rect' | 'circle' | 'line' | 'triangle' | 'star' | 'sun' | 'sparkle';
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold';
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const productSlug = searchParams.get('product') || 'business-cards';
  const designId = searchParams.get('design');
  const templateId = searchParams.get('template');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<any>(null);
  
  // E-commerce Configuration Specs Selected
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const mode = searchParams.get('mode');
  const isUploadMode = mode === 'upload';

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');

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
        quantity: quantity,
        selectedSpecs: JSON.stringify(selectedSpecs),
        unitPrice: totalPrice,
        printReadyFileUrl: uploadedFileUrl,
        printReadyFileName: uploadedFileName,
      };

      const existingCart = JSON.parse(localStorage.getItem('printear_cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('printear_cart', JSON.stringify(existingCart));

      router.push('/cart');
    } catch (err: any) {
      alert(err.message || 'An error occurred while adding file to cart.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };


  // Canvas Editor States
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);
  const elementsStartPositions = useRef<Record<string, { x: number, y: number }>>({});
  const [canvasName, setCanvasName] = useState('My Custom Design');
  const [selectedTab, setSelectedTab] = useState<'options' | 'text' | 'uploads' | 'graphics' | 'background' | 'pattern' | 'templates' | 'more'>('graphics');
  const [graphicsSearch, setGraphicsSearch] = useState('');
  const [mobileTab, setMobileTab] = useState<'canvas' | 'tools' | 'specs'>('canvas');
  
  // Canvas Helper Visibility States
  const [showRulers, setShowRulers] = useState(true);
  const [showBleed, setShowBleed] = useState(true);
  const [showSafeZone, setShowSafeZone] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);
  
  // Canvas scale zoom
  const [scale, setScale] = useState(0.8);
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [uploadedImages, setUploadedImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150',
    'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=150'
  ]);
  
  // Custom workspace dimensions linked to product Size and Orientation
  const [canvasWidth, setCanvasWidth] = useState(1050);
  const [canvasHeight, setCanvasHeight] = useState(600);

  // Multi-page layout states linked to product Sides
  const [activePage, setActivePage] = useState<'front' | 'back'>('front');
  const [frontElements, setFrontElements] = useState<CanvasElement[]>([]);
  const [backElements, setBackElements] = useState<CanvasElement[]>([]);
  
  // Undo/Redo stacks
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Dragging and Resizing Ref states
  const canvasRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isResizing = useRef<string | null>(null); // 'nw', 'ne', 'sw', 'se'
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Admin and Dynamic Templates States
  const [isAdmin, setIsAdmin] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [bleedValue, setBleedValue] = useState(0.25);
  const [dpiValue, setDpiValue] = useState(300);
  const [globalDpi, setGlobalDpi] = useState(300);

  // Load templates list for product
  const loadTemplates = async (productId: string, currentSpecs?: Record<string, string>) => {
    setLoadingTemplates(true);
    try {
      let url = `/api/templates?productId=${productId}`;
      if (currentSpecs) {
        url += `&specs=${encodeURIComponent(JSON.stringify(currentSpecs))}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Refetch templates when product, selectedSpecs or selectedTab changes (lazy load when templates tab is active)
  useEffect(() => {
    if (product && product.id && selectedTab === 'templates') {
      loadTemplates(product.id, selectedSpecs);
    }
  }, [product, selectedSpecs, selectedTab]);

  // Check user role and load designer settings on mount
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch('/api/auth');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user.role === 'ADMIN') {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Error checking auth:', err);
      }
    }
    async function loadDesignerSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.designer) {
            setBleedValue(Number(data.designer.bleed ?? 0.25));
            setDpiValue(Number(data.designer.dpi ?? 300));
            setGlobalDpi(Number(data.designer.dpi ?? 300));
          }
        }
      } catch (err) {
        console.error('Error loading designer settings in editor:', err);
      }
    }
    checkUser();
    loadDesignerSettings();
  }, []);

  // 1. Fetch Product details from API
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/products/${productSlug}`);
        if (!res.ok) throw new Error('Product not found');
        const prodData = await res.json();
        setProduct(prodData);
        
        // Inicializar especificaciones por defecto o cargadas de la URL
        const initialSpecs: Record<string, string> = {};
        const specGroups = new Set(prodData.specs.map((s: any) => s.group));
        specGroups.forEach((group: any) => {
          const queryVal = searchParams.get(group);
          if (queryVal && prodData.specs.some((s: any) => s.group === group && s.value === queryVal)) {
            initialSpecs[group] = queryVal;
          } else {
            const firstVal = prodData.specs.find((s: any) => s.group === group);
            if (firstVal) initialSpecs[group] = firstVal.value;
          }
        });
        setSelectedSpecs(initialSpecs);

        // Si estamos editando una plantilla existente (Admin)
        if (templateId) {
          const resTpl = await fetch(`/api/templates?id=${templateId}`);
          if (resTpl.ok) {
            const template = await resTpl.json();
            if (template) {
              setCanvasName(template.name);
              // Si la plantilla tiene targetSpecs, inicializar las especificaciones del editor
              if (template.targetSpecs) {
                const specs = typeof template.targetSpecs === 'string' ? JSON.parse(template.targetSpecs) : template.targetSpecs;
                setSelectedSpecs(prev => ({ ...prev, ...specs }));
              }
              const parsed = typeof template.canvasData === 'string' ? JSON.parse(template.canvasData) : template.canvasData;
              if (parsed && (parsed.front || parsed.back)) {
                const front = parsed.front || [];
                const back = parsed.back || [];
                setFrontElements(front);
                setBackElements(back);
                setCanvasElements(front);
                saveToHistory(front);
              } else {
                setFrontElements(parsed || []);
                setCanvasElements(parsed || []);
                saveToHistory(parsed || []);
              }
            }
          }
        } else if (designId) {
          // Si estamos editando un diseño existente, cargarlo
          const resDesign = await fetch('/api/designs');
          if (resDesign.ok) {
            const designs = await resDesign.json();
            const design = designs.find((d: any) => d.id === designId);
            if (design) {
              setCanvasName(design.name);
              const parsed = typeof design.canvasData === 'string' ? JSON.parse(design.canvasData) : design.canvasData;
              if (parsed && (parsed.front || parsed.back)) {
                const front = parsed.front || [];
                const back = parsed.back || [];
                setFrontElements(front);
                setBackElements(back);
                setCanvasElements(front);
                saveToHistory(front);
              } else {
                setFrontElements(parsed || []);
                setCanvasElements(parsed || []);
                saveToHistory(parsed || []);
              }
            }
          }
        } else {
          // Cargar lienzo vacío o plantilla por defecto
          const defaultCanvas: CanvasElement[] = getInitialTemplate(productSlug);
          setFrontElements(defaultCanvas);
          setCanvasElements(defaultCanvas);
          saveToHistory(defaultCanvas);
        }

        setLoading(false);
      } catch (err) {
        console.error(err);
        router.push('/');
      }
    }
    loadData();
  }, [productSlug, designId, templateId]);

  // Overwrite DPI if product specifies a custom one, otherwise fall back to global default
  useEffect(() => {
    if (product) {
      if (product.dpi && Number(product.dpi) > 0) {
        setDpiValue(Number(product.dpi));
      } else {
        setDpiValue(globalDpi);
      }
    }
  }, [product, globalDpi]);

  // Dynamic Canvas Dimension Calculation (Size & Orientation binding)
  useEffect(() => {
    if (!product) return;
    const { width, height } = getCanvasDimensions(product, selectedSpecs, bleedValue, dpiValue);
    setCanvasWidth(width);
    setCanvasHeight(height);
  }, [selectedSpecs, product, bleedValue, dpiValue]);

  // 2. Calcular precio dinámico según especificaciones elegidas
  useEffect(() => {
    if (!product) return;
    
    // Determinar primero si hay alguna especificación que reemplaza el precio base
    let basePrice = product.basePrice;
    Object.entries(selectedSpecs).forEach(([group, value]) => {
      const match = product.specs.find((s: any) => s.group === group && s.value === value);
      if (match && match.isBasePrice) {
        basePrice = match.priceMarkup;
      }
    });

    // Determinar cantidad actual desde las especificaciones para multiplicadores
    let specQty = 1;
    let hasQtySpec = false;
    Object.entries(selectedSpecs).forEach(([k, v]: [string, any]) => {
      if (k.toLowerCase().includes('quantity') || k.toLowerCase().includes('cantidad') || k.toLowerCase() === 'qty') {
        const parsed = parseInt(v.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) {
          specQty = parsed;
          hasQtySpec = true;
        }
      }
    });
    const currentQuantity = hasQtySpec ? specQty : quantity;

    let currentPrice = basePrice;
    
    // Sumar recargo de especificaciones
    Object.entries(selectedSpecs).forEach(([group, value]) => {
      const match = product.specs.find((s: any) => s.group === group && s.value === value);
      if (match) {
        // Si esta especificación es la que define el precio base, no la sumamos otra vez
        if (match.isBasePrice) return;

        const actualMarkup = match.markupType === 'PERCENTAGE'
          ? (basePrice * match.priceMarkup) / 100
          : match.markupType === 'MULTIPLY_BY_QTY'
            ? match.priceMarkup * currentQuantity
            : match.priceMarkup;
        currentPrice += actualMarkup;
      }
    });

    setTotalPrice(currentPrice);
  }, [product, selectedSpecs, quantity]);

  // Helper to dynamically auto-fit canvas inside workspace viewport
  const resetZoomToFit = () => {
    if (!product) return;
    const parentEl = canvasRef.current?.parentElement;
    if (!parentEl) return;
    
    const parentWidth = parentEl.clientWidth;
    const parentHeight = parentEl.clientHeight;
    
    if (parentWidth > 0 && parentHeight > 0) {
      const targetWidth = parentWidth - 120;
      const targetHeight = parentHeight - 120; // leaves a clean margin around viewport
      
      const scaleW = targetWidth / canvasWidth;
      const scaleH = targetHeight / canvasHeight;
      
      const fitScale = Math.min(scaleW, scaleH);
      setScale(Math.max(0.15, Math.min(0.7, parseFloat(fitScale.toFixed(2)))));
    }
  };

  // 2b. Auto-fit scale on mount, window resize, and when product or mobile tab changes
  useEffect(() => {
    const timer = setTimeout(resetZoomToFit, 150);
    window.addEventListener('resize', resetZoomToFit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', resetZoomToFit);
    };
  }, [product, mobileTab, canvasWidth, canvasHeight]);

  // Keyboard navigation: Delete/Backspace to remove, Arrow keys to nudge selected element(s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      const activeIds = selectedElementIds.length > 0 ? selectedElementIds : (selectedElementId ? [selectedElementId] : []);
      if (activeIds.length === 0) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedElement();
      } else if (
        e.key === 'ArrowUp' || 
        e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || 
        e.key === 'ArrowRight'
      ) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        
        const updated = canvasElements.map(el => {
          if (!activeIds.includes(el.id)) return el;
          return {
            ...el,
            x: el.x + dx,
            y: el.y + dy
          };
        });
        setCanvasElements(updated);
        saveToHistory(updated);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, selectedElementIds, canvasElements, history, historyIndex]);


  // Plantillas base según tipo de producto (English)
  const getInitialTemplate = (slug: string): CanvasElement[] => {
    if (slug === 'business-cards') {
      return [
        { id: 't1', type: 'text', x: 200, y: 150, width: 650, height: 60, angle: 0, text: 'ACME CORPORATION S.A.', fontSize: 36, fontFamily: 'Outfit', color: '#0066ff' },
        { id: 't2', type: 'text', x: 200, y: 220, width: 500, height: 35, angle: 0, text: 'John Doe', fontSize: 18, fontFamily: 'Inter', color: '#f3f4f6' },
        { id: 't3', type: 'text', x: 200, y: 260, width: 450, height: 30, angle: 0, text: 'Lead Graphic Designer', fontSize: 13, fontFamily: 'Inter', color: '#9ca3af' },
        { id: 's1', type: 'shape', x: 200, y: 310, width: 250, height: 3, angle: 0, shapeType: 'line', color: '#00e5ff' },
        { id: 't4', type: 'text', x: 200, y: 340, width: 500, height: 30, angle: 0, text: '✉ contact@acmecorp.com | ☎ +1 (555) 123-4567', fontSize: 12, fontFamily: 'Inter', color: '#9ca3af' },
      ];
    } else if (slug === 'custom-tshirts') {
      return [
        { id: 't1', type: 'text', x: 150, y: 200, width: 500, height: 80, angle: 0, text: 'CREATIVE', fontSize: 48, fontFamily: 'Outfit', color: '#ff0080' },
        { id: 't2', type: 'text', x: 150, y: 290, width: 500, height: 40, angle: 0, text: 'No Limits 2026', fontSize: 20, fontFamily: 'Inter', color: '#00e5ff' },
        { id: 's1', type: 'shape', x: 250, y: 360, width: 300, height: 300, angle: 0, shapeType: 'circle', color: 'rgba(0, 102, 255, 0.15)' },
      ];
    } else if (slug === 'gradient-mugs') {
      return [
        { id: 't1', type: 'text', x: 250, y: 150, width: 400, height: 60, angle: 0, text: 'Coffee & Creative', fontSize: 32, fontFamily: 'Outfit', color: '#7928ca' },
        { id: 't2', type: 'text', x: 250, y: 220, width: 400, height: 40, angle: 0, text: 'Monday Morning Fuel', fontSize: 16, fontFamily: 'Inter', color: '#1f2239' },
      ];
    } else {
      return [
        { id: 't1', type: 'text', x: 100, y: 150, width: 550, height: 100, angle: 0, text: 'GRAND OPENING!', fontSize: 52, fontFamily: 'Outfit', color: '#0066ff' },
        { id: 't2', type: 'text', x: 100, y: 270, width: 550, height: 50, angle: 0, text: 'This Weekend Only - 50% Off Everything', fontSize: 20, fontFamily: 'Inter', color: '#f3f4f6' },
        { id: 's1', type: 'shape', x: 100, y: 350, width: 550, height: 200, angle: 0, shapeType: 'rect', color: 'rgba(121, 40, 202, 0.1)' },
      ];
    }
  };

  // 3. Sistema de Historial (Deshacer/Rehacer)
  const saveToHistory = (elements: CanvasElement[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(JSON.parse(JSON.stringify(elements)));
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setCanvasElements(JSON.parse(JSON.stringify(history[prevIndex])));
      setSelectedElementId(null);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setCanvasElements(JSON.parse(JSON.stringify(history[nextIndex])));
      setSelectedElementId(null);
    }
  };

  const switchPage = (targetPage: 'front' | 'back') => {
    if (activePage === targetPage) return;

    if (activePage === 'front') {
      setFrontElements(canvasElements);
      setCanvasElements(backElements);
      setSelectedElementId(null);
      setHistory([backElements]);
      setHistoryIndex(0);
    } else {
      setBackElements(canvasElements);
      setCanvasElements(frontElements);
      setSelectedElementId(null);
      setHistory([frontElements]);
      setHistoryIndex(0);
    }

    setActivePage(targetPage);
  };

  const isDoubleSided = () => {
    return Object.entries(selectedSpecs).some(([group, value]) => {
      const val = value.toLowerCase();
      return val.includes('both sides') || 
             val.includes('both') || 
             val.includes('back') || 
             val.includes('double') || 
             val.includes('2 caras') || 
             val.includes('dos caras');
    });
  };

  // 4. Agregar Elementos al Canvas
  const addTextElement = (customText?: string, customFontSize?: number, customWeight?: string) => {
    const newEl: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 150,
      y: 150,
      width: 450,
      height: customFontSize ? customFontSize * 1.6 : 45,
      angle: 0,
      text: customText || 'Double click to edit text',
      fontSize: customFontSize || 24,
      fontFamily: customWeight === 'bold' ? 'Outfit' : 'Inter',
      color: '#002447',
    };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    setSelectedElementId(newEl.id);
    saveToHistory(updated);
  };

  const addShapeElement = (shapeType: 'rect' | 'circle' | 'line' | 'triangle' | 'star' | 'sun' | 'sparkle', customColor?: string) => {
    const newEl: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeType,
      x: 200,
      y: 200,
      width: shapeType === 'line' ? 300 : 120,
      height: shapeType === 'line' ? 4 : 120,
      angle: 0,
      color: customColor || '#002447',
    };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    setSelectedElementId(newEl.id);
    saveToHistory(updated);
  };

  const addImageElement = (src: string) => {
    const newEl: CanvasElement = {
      id: `image-${Date.now()}`,
      type: 'image',
      x: 150,
      y: 150,
      width: 200,
      height: 200,
      angle: 0,
      src,
    };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    setSelectedElementId(newEl.id);
    saveToHistory(updated);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newEl: CanvasElement = {
          id: `image-${Date.now()}`,
          type: 'image',
          x: 150,
          y: 150,
          width: 250,
          height: 250,
          angle: 0,
          src: reader.result,
        };
        const updated = [...canvasElements, newEl];
        setCanvasElements(updated);
        setSelectedElementId(newEl.id);
        saveToHistory(updated);
        setUploadedImages(prev => [reader.result as string, ...prev]);
      }
    };
    reader.readAsDataURL(file);
  };

  // 5. Cargar plantilla predefinida en el sidebar
  const loadSidebarTemplate = (templateName: string) => {
    let elements: CanvasElement[] = [];
    if (templateName === 'corporate') {
      elements = [
        { id: 't1', type: 'text', x: 150, y: 120, width: 750, height: 60, angle: 0, text: 'GLOBAL TECH INC', fontSize: 38, fontFamily: 'Outfit', color: '#0066ff' },
        { id: 't2', type: 'text', x: 150, y: 190, width: 500, height: 30, angle: 0, text: 'Secure Digital Solutions', fontSize: 16, fontFamily: 'Inter', color: '#9ca3af' },
        { id: 's1', type: 'shape', x: 150, y: 240, width: 400, height: 2, angle: 0, shapeType: 'line', color: '#00e5ff' },
        { id: 't3', type: 'text', x: 150, y: 260, width: 600, height: 50, angle: 0, text: 'Headquarters | www.globaltech.com', fontSize: 12, fontFamily: 'Inter', color: '#6b7280' },
      ];
    } else if (templateName === 'creative') {
      elements = [
        { id: 't1', type: 'text', x: 100, y: 100, width: 850, height: 120, angle: 0, text: 'HOLOGRAPHIC STUDIO', fontSize: 44, fontFamily: 'Outfit', color: '#ff0080' },
        { id: 't2', type: 'text', x: 100, y: 220, width: 850, height: 40, angle: 0, text: 'DIGITAL ART & DESIGN', fontSize: 20, fontFamily: 'Inter', color: '#00e5ff' },
        { id: 's1', type: 'shape', x: 100, y: 280, width: 120, height: 120, angle: 0, shapeType: 'circle', color: 'rgba(121, 40, 202, 0.3)' },
        { id: 's2', type: 'shape', x: 180, y: 280, width: 120, height: 120, angle: 0, shapeType: 'rect', color: 'rgba(0, 102, 255, 0.2)' },
      ];
    } else { // minimalist
      elements = [
        { id: 't1', type: 'text', x: 300, y: 200, width: 450, height: 60, angle: 0, text: 'MINIMAL', fontSize: 28, fontFamily: 'Courier New', color: '#11131f' },
        { id: 's1', type: 'shape', x: 300, y: 270, width: 150, height: 1, angle: 0, shapeType: 'line', color: '#11131f' },
        { id: 't2', type: 'text', x: 300, y: 290, width: 450, height: 30, angle: 0, text: 'Less is more.', fontSize: 14, fontFamily: 'Inter', color: '#6b7280' },
      ];
    }
    setCanvasElements(elements);
    saveToHistory(elements);
  };

  const loadDynamicTemplate = (template: any) => {
    if (!confirm('Loading this template will replace all active elements on your canvas. Do you want to proceed?')) {
      return;
    }
    try {
      const parsed = typeof template.canvasData === 'string' 
        ? JSON.parse(template.canvasData) 
        : template.canvasData;
        
      if (parsed && (parsed.front || parsed.back)) {
        const front = parsed.front || [];
        const back = parsed.back || [];
        setFrontElements(front);
        setBackElements(back);
        if (activePage === 'front') {
          setCanvasElements(front);
        } else {
          setCanvasElements(back);
        }
        saveToHistory(activePage === 'front' ? front : back);
      } else if (Array.isArray(parsed)) {
        setFrontElements(parsed);
        setCanvasElements(parsed);
        saveToHistory(parsed);
      }
    } catch (e) {
      console.error('Error loading template elements:', e);
      alert('Error loading this template data.');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name.');
      return;
    }
    setSavingTemplate(true);
    try {
      let finalFront = frontElements;
      let finalBack = backElements;
      if (activePage === 'front') {
        finalFront = canvasElements;
      } else {
        finalBack = canvasElements;
      }

      const canvasBlobData = JSON.stringify({
        front: finalFront,
        back: finalBack
      });

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: templateId || undefined,
          productId: product.id,
          name: templateName,
          canvasData: canvasBlobData,
          previewUrl: '', // Default fallback will be handled by route
          targetSpecs: selectedSpecs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save template');
      }

      alert('Template saved successfully!');
      setShowSaveTemplateModal(false);
      setTemplateName('');
      // Reload templates list
      loadTemplates(product.id, selectedSpecs);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving template.');
    } finally {
      setSavingTemplate(false);
    }
  };

  // 6. Edición rápida del Toolbar
  const getSelectedElement = () => canvasElements.find(el => el.id === selectedElementId);

  const updateSelectedElement = (updates: Partial<CanvasElement>) => {
    if (!selectedElementId) return;
    const updated = canvasElements.map(el => {
      if (el.id === selectedElementId) {
        return { ...el, ...updates };
      }
      return el;
    });
    setCanvasElements(updated);
    saveToHistory(updated);
  };

  const deleteSelectedElement = () => {
    const targets = selectedElementIds.length > 0 ? selectedElementIds : (selectedElementId ? [selectedElementId] : []);
    if (targets.length === 0) return;
    const updated = canvasElements.filter(el => !targets.includes(el.id));
    setCanvasElements(updated);
    setSelectedElementId(null);
    setSelectedElementIds([]);
    saveToHistory(updated);
  };

  const duplicateSelectedElement = () => {
    const el = getSelectedElement();
    if (!el) return;
    const copyEl: CanvasElement = {
      ...el,
      id: `${el.type}-${Date.now()}`,
      x: el.x + 25,
      y: el.y + 25,
    };
    const updated = [...canvasElements, copyEl];
    setCanvasElements(updated);
    setSelectedElementId(copyEl.id);
    saveToHistory(updated);
  };

  const moveLayer = (direction: 'up' | 'down') => {
    if (!selectedElementId) return;
    const idx = canvasElements.findIndex(el => el.id === selectedElementId);
    if (idx === -1) return;

    const updated = [...canvasElements];
    if (direction === 'up' && idx < updated.length - 1) {
      const temp = updated[idx];
      updated[idx] = updated[idx + 1];
      updated[idx + 1] = temp;
      setCanvasElements(updated);
      saveToHistory(updated);
    } else if (direction === 'down' && idx > 0) {
      const temp = updated[idx];
      updated[idx] = updated[idx - 1];
      updated[idx - 1] = temp;
      setCanvasElements(updated);
      saveToHistory(updated);
    }
  };

  // 7. Lógica de Ratón: Arrastrar & Redimensionar
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      e.target === canvasRef.current || 
      (e.target as HTMLElement).classList.contains('canvas-bleed-line') || 
      (e.target as HTMLElement).classList.contains('canvas-safe-zone') ||
      (e.target as HTMLElement).classList.contains('canvas-wrapper')
    ) {
      const isShift = e.shiftKey;
      if (!isShift) {
        setSelectedElementId(null);
        setSelectedElementIds([]);
      }
      
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (!canvasBounds) return;
      
      const startX = (e.clientX - canvasBounds.left) / scale;
      const startY = (e.clientY - canvasBounds.top) / scale;
      
      setSelectionBox({ startX, startY, endX: startX, endY: startY });
      
      const handleSelectionMove = (moveEv: MouseEvent) => {
        const currentEndX = (moveEv.clientX - canvasBounds.left) / scale;
        const currentEndY = (moveEv.clientY - canvasBounds.top) / scale;
        
        setSelectionBox(prev => {
          if (!prev) return null;
          return { ...prev, endX: currentEndX, endY: currentEndY };
        });
        
        const boxLeft = Math.min(startX, currentEndX);
        const boxTop = Math.min(startY, currentEndY);
        const boxRight = Math.max(startX, currentEndX);
        const boxBottom = Math.max(startY, currentEndY);
        
        const intersectingIds = canvasElements.filter(el => {
          return el.x < boxRight && 
                 el.x + el.width > boxLeft && 
                 el.y < boxBottom && 
                 el.y + el.height > boxTop;
        }).map(el => el.id);
        
        if (isShift) {
          const combined = Array.from(new Set([...selectedElementIds, ...intersectingIds]));
          setSelectedElementIds(combined);
          if (combined.length > 0) {
            setSelectedElementId(combined[combined.length - 1]);
          }
        } else {
          setSelectedElementIds(intersectingIds);
          if (intersectingIds.length > 0) {
            setSelectedElementId(intersectingIds[intersectingIds.length - 1]);
          } else {
            setSelectedElementId(null);
          }
        }
      };
      
      const handleSelectionUp = () => {
        setSelectionBox(null);
        document.removeEventListener('mousemove', handleSelectionMove);
        document.removeEventListener('mouseup', handleSelectionUp);
      };
      
      document.addEventListener('mousemove', handleSelectionMove);
      document.addEventListener('mouseup', handleSelectionUp);
    }
  };

  const handleElementMouseDown = (e: React.MouseEvent, el: CanvasElement) => {
    e.stopPropagation();
    
    const isShift = e.shiftKey;
    let activeSelection = [...selectedElementIds];
    
    if (!selectedElementIds.includes(el.id)) {
      if (isShift) {
        activeSelection = [...selectedElementIds, el.id];
        setSelectedElementIds(activeSelection);
        setSelectedElementId(el.id);
      } else {
        activeSelection = [el.id];
        setSelectedElementIds(activeSelection);
        setSelectedElementId(el.id);
      }
    } else if (isShift) {
      activeSelection = selectedElementIds.filter(id => id !== el.id);
      setSelectedElementIds(activeSelection);
      setSelectedElementId(activeSelection[activeSelection.length - 1] || null);
      return;
    }
    
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    
    const startCoords: Record<string, { x: number, y: number }> = {};
    canvasElements.forEach(item => {
      if (activeSelection.includes(item.id)) {
        startCoords[item.id] = { x: item.x, y: item.y };
      }
    });
    elementsStartPositions.current = startCoords;
    elementStart.current = { x: el.x, y: el.y, width: el.width, height: el.height };
    
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, el: CanvasElement, handle: string) => {
    e.stopPropagation();
    isResizing.current = handle;
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { x: el.x, y: el.y, width: el.width, height: el.height };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleGlobalMouseMove = (e: MouseEvent) => {
    const activeIds = selectedElementIds.length > 0 ? selectedElementIds : (selectedElementId ? [selectedElementId] : []);
    if (activeIds.length === 0) return;
    
    const deltaX = (e.clientX - dragStart.current.x) / scale;
    const deltaY = (e.clientY - dragStart.current.y) / scale;

    setCanvasElements(currentElements => 
      currentElements.map(el => {
        if (!activeIds.includes(el.id)) return el;

        if (isDragging.current) {
          const startCoords = elementsStartPositions.current[el.id];
          if (!startCoords) return el;
          return {
            ...el,
            x: Math.round(startCoords.x + deltaX),
            y: Math.round(startCoords.y + deltaY),
          };
        }

        if (isResizing.current && el.id === selectedElementId) {
          const handle = isResizing.current;
          let newWidth = elementStart.current.width;
          let newHeight = elementStart.current.height;
          let newX = elementStart.current.x;
          let newY = elementStart.current.y;

          if (handle.includes('e')) {
            newWidth = Math.max(20, elementStart.current.width + deltaX);
          }
          if (handle.includes('s')) {
            newHeight = Math.max(20, elementStart.current.height + deltaY);
          }
          if (handle.includes('w')) {
            const possibleWidth = elementStart.current.width - deltaX;
            if (possibleWidth > 20) {
              newWidth = possibleWidth;
              newX = elementStart.current.x + deltaX;
            }
          }
          if (handle.includes('n')) {
            const possibleHeight = elementStart.current.height - deltaY;
            if (possibleHeight > 20) {
              newHeight = possibleHeight;
              newY = elementStart.current.y + deltaY;
            }
          }

          if (el.type === 'image') {
            const ratio = elementStart.current.width / elementStart.current.height;
            if (handle === 'se' || handle === 'nw') {
              newHeight = newWidth / ratio;
            } else {
              newWidth = newHeight * ratio;
            }
          }

          return {
            ...el,
            x: Math.round(newX),
            y: Math.round(newY),
            width: Math.round(newWidth),
            height: Math.round(newHeight),
          };
        }

        return el;
      })
    );
  };

  const handleGlobalMouseUp = () => {
    isDragging.current = false;
    isResizing.current = null;
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    
    // Guardar el estado actual en el historial después del arrastre/escala
    setCanvasElements(current => {
      saveToHistory(current);
      return current;
    });
  };

  // 8. Guardar Diseño en API & añadir al Carrito
  const saveDesignAndCheckout = async () => {
    setSaving(true);
    try {
      // Sync currently active elements to the correct page array first
      let finalFront = frontElements;
      let finalBack = backElements;
      if (activePage === 'front') {
        finalFront = canvasElements;
      } else {
        finalBack = canvasElements;
      }

      const canvasBlobData = JSON.stringify({
        front: finalFront,
        back: finalBack
      });
      
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: designId || undefined,
          productId: product.id,
          name: canvasName,
          canvasData: canvasBlobData,
          previewUrl: '', // Opcional, guardado local
        }),
      });

      if (!response.ok) throw new Error('Error saving custom design layout');
      const savedDesign = await response.json();

      // 2. Guardar en el Carrito local (localStorage)
      const cartItem = {
        id: `cart-item-${Date.now()}`,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        thumbnail: product.thumbnail,
        customDesignId: savedDesign.id,
        designName: canvasName,
        quantity: quantity,
        selectedSpecs: JSON.stringify(selectedSpecs),
        unitPrice: totalPrice,
      };

      const existingCart = JSON.parse(localStorage.getItem('printear_cart') || '[]');
      existingCart.push(cartItem);
      localStorage.setItem('printear_cart', JSON.stringify(existingCart));

      // Redirigir al Carrito
      router.push('/cart');
    } catch (err) {
      alert('An error occurred while saving your design. Please verify database seeding or local fallback state.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px', height: '80vh' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-secondary)', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ fontFamily: 'var(--font-title)', color: 'var(--text-secondary)' }}>Loading Printear Design Canvas...</p>
      </div>
    );
  }

  const selectedEl = getSelectedElement();

  // Calculate dynamic ruler ticks based on size & metric specifications (case-insensitive key lookup)
  const sizeKey = Object.keys(selectedSpecs).find(k => k.toLowerCase() === 'size' || k.toLowerCase() === 'tamaño') || 'Size';
  const sizeVal = selectedSpecs[sizeKey] || '';
  const selectedSpec = product?.specs?.find((s: any) => 
    s?.group && s?.value &&
    (s.group.toLowerCase() === 'size' || s.group.toLowerCase() === 'tamaño') && 
    s.value.toLowerCase().trim() === sizeVal.toLowerCase().trim()
  );
  const metric = (selectedSpec?.metric || 'in').toLowerCase().trim();

  let pxPerUnit = dpiValue;
  let unitLabel = 'in';

  if (metric === 'cm') {
    pxPerUnit = dpiValue / 2.54;
    unitLabel = 'cm';
  } else if (metric === 'px') {
    pxPerUnit = 100;
    unitLabel = 'px';
  } else if (metric === 'none') {
    const isSmall = selectedSpec && selectedSpec.horizontal <= 30;
    pxPerUnit = isSmall ? dpiValue : 100;
    unitLabel = isSmall ? 'in' : 'px';
  }

  const bleedPx = metric === 'cm' ? (bleedValue * 2.54) * pxPerUnit : (metric === 'px' ? bleedValue * 100 : bleedValue * pxPerUnit);
  const cutLineOffset = bleedPx / 2;
  const safeZoneOffset = cutLineOffset + (0.125 * pxPerUnit); // 0.125 inches inside the cut line

  const majorStep = pxPerUnit;
  const mediumStep = pxPerUnit / 2;
  let minorStep = pxPerUnit / 10;
  if (minorStep < 8) {
    minorStep = pxPerUnit / 5;
  }

  const hTicks: { x: number; type: 'major' | 'medium' | 'minor'; label: string }[] = [];
  for (let x = 0; x <= canvasWidth; x += minorStep) {
    let type: 'major' | 'medium' | 'minor' = 'minor';
    let label = '';
    
    const distToMajor = Math.abs(x % majorStep);
    const distToMedium = Math.abs(x % mediumStep);
    
    if (distToMajor < 0.1 || Math.abs(distToMajor - majorStep) < 0.1) {
      type = 'major';
      label = Math.round(x / majorStep).toString();
    } else if (distToMedium < 0.1 || Math.abs(distToMedium - mediumStep) < 0.1) {
      type = 'medium';
    }
    hTicks.push({ x, type, label });
  }

  const vTicks: { y: number; type: 'major' | 'medium' | 'minor'; label: string }[] = [];
  for (let y = 0; y <= canvasHeight; y += minorStep) {
    let type: 'major' | 'medium' | 'minor' = 'minor';
    let label = '';
    
    const distToMajor = Math.abs(y % majorStep);
    const distToMedium = Math.abs(y % mediumStep);
    
    if (distToMajor < 0.1 || Math.abs(distToMajor - majorStep) < 0.1) {
      type = 'major';
      label = Math.round(y / majorStep).toString();
    } else if (distToMedium < 0.1 || Math.abs(distToMedium - mediumStep) < 0.1) {
      type = 'medium';
    }
    vTicks.push({ y, type, label });
  }

  if (isUploadMode) {
    return (
      <div className="editor-container" style={{ position: 'relative' }}>
        {openDropdown && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 15 }} 
            onClick={() => setOpenDropdown(null)} 
          />
        )}

        {/* MOBILE EDITOR TAB BAR */}
        <div className="editor-mobile-tab-bar desktop-hide">
          <button 
            className={`editor-mobile-tab ${mobileTab === 'canvas' ? 'active' : ''}`}
            onClick={() => setMobileTab('canvas')}
          >
            Upload File
          </button>
          <button 
            className={`editor-mobile-tab ${mobileTab === 'specs' ? 'active' : ''}`}
            onClick={() => setMobileTab('specs')}
          >
            Specs
          </button>
        </div>

        {/* LEFT PANEL: UPLOAD ZONE */}
        <div 
          className={`editor-canvas-wrapper ${mobileTab === 'canvas' ? '' : 'mobile-hide'}`}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '40px', background: 'radial-gradient(#d2d6dc 1px, transparent 1px) 0 0/16px 16px', backgroundColor: '#e8ebf0', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '40px', background: '#ffffff', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', borderRadius: '16px' }}>
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
                onClick={() => router.push(`/products/${productSlug}?${new URLSearchParams(selectedSpecs).toString()}`)}
              >
                <ArrowLeft size={16} /> Back to Product
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CONFIGURATION SIDEBAR */}
        <aside className={`editor-properties-panel ${mobileTab === 'specs' ? '' : 'mobile-hide'}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 20 }}>
          <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', marginBottom: '4px' }}>Confirm Print Specifications</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{product.name}</p>

          <div className="form-group">
            <label className="form-label">Reference Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={canvasName} 
              onChange={(e) => setCanvasName(e.target.value)} 
              placeholder="e.g. My Print Ready Design"
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', fontFamily: 'var(--font-title)' }}>Physical Specifications</h4>
            
            {Object.entries(
              product.specs.reduce((acc: any, spec: any) => {
                if (!acc[spec.group]) acc[spec.group] = [];
                acc[spec.group].push(spec);
                return acc;
              }, {})
            ).map(([group, specsList]: [string, any]) => {
              const selectedValue = selectedSpecs[group] || '';
              const isNeutral = !selectedValue || 
                                selectedValue.toLowerCase() === 'none' || 
                                selectedValue.toLowerCase().includes('no special') ||
                                selectedValue.toLowerCase() === 'basic' ||
                                selectedValue.toLowerCase() === 'standard' ||
                                selectedValue.toLowerCase().includes('no back');
                                
              const borderColor = isNeutral ? 'var(--border-color)' : '#8cc63f';
              const labelColor = isNeutral ? 'var(--text-muted)' : '#5b9317';

              const isOrientation = group.toLowerCase() === 'orientation';
              
              return (
                <div key={group} style={{ marginBottom: '12px' }}>
                  {isOrientation ? (
                    <div 
                      style={{ 
                        position: 'relative',
                        border: `1.5px solid #8cc63f`,
                        borderRadius: '6px',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        height: '46px',
                        boxShadow: 'var(--shadow-sm)',
                        width: '100%'
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '-9px',
                        left: '10px',
                        background: 'var(--bg-secondary)',
                        padding: '0 4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#5b9317',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        zIndex: 2,
                        fontFamily: 'var(--font-title)'
                      }}>
                        {group}
                      </span>
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
                              onClick={() => setSelectedSpecs({ ...selectedSpecs, [group]: spec.value })}
                              style={{
                                flex: 1,
                                height: '100%',
                                background: 'transparent',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: isSelected ? '700' : '500',
                                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                outline: 'none',
                                transition: 'all 0.2s ease',
                                zIndex: 1
                              }}
                            >
                              {isHorizontal ? (
                                <div style={{ width: '20px', height: '12px', borderRadius: '2px', backgroundColor: isSelected ? '#8cc63f' : '#d1d5db' }} />
                              ) : (
                                <div style={{ width: '12px', height: '20px', borderRadius: '2px', backgroundColor: isSelected ? '#8cc63f' : '#d1d5db' }} />
                              )}
                              <span>{spec.value}</span>
                            </button>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div 
                      style={{ 
                        position: 'relative',
                        border: `1.5px solid ${borderColor}`,
                        borderRadius: '6px',
                        padding: '0 10px',
                        background: 'var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        height: '46px',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        zIndex: openDropdown === group ? 25 : 1
                      }}
                      onClick={() => setOpenDropdown(openDropdown === group ? null : group)}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '-9px',
                        left: '10px',
                        background: 'var(--bg-secondary)',
                        padding: '0 4px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: labelColor,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        zIndex: 2,
                        fontFamily: 'var(--font-title)'
                      }}>
                        {group}
                      </span>
                      <div style={{ width: '100%', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', paddingRight: '70px', display: 'flex', alignItems: 'center', height: '100%', userSelect: 'none' }}>
                        {selectedValue}
                      </div>

                      {openDropdown === group && (
                        <div 
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: '-1.5px',
                            right: '-1.5px',
                            background: '#ffffff',
                            border: `1.5px solid ${borderColor}`,
                            borderRadius: '6px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            zIndex: 30,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: '4px 0'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {specsList.map((spec: any) => {
                            const isSelected = selectedValue === spec.value;
                            return (
                              <div
                                key={spec.id}
                                onClick={() => {
                                  setSelectedSpecs({ ...selectedSpecs, [group]: spec.value });
                                  setOpenDropdown(null);
                                }}
                                style={{
                                  padding: '10px 14px',
                                  fontSize: '13px',
                                  fontWeight: isSelected ? '700' : '500',
                                  color: isSelected ? '#5b9317' : 'var(--text-primary)',
                                  background: isSelected ? '#f5f9eb' : 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span>{spec.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'none' }}>
                        {!isNeutral && (
                          <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#8cc63f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                            <span style={{ fontSize: '9px', fontWeight: 'bold' }}>✔</span>
                          </div>
                        )}
                        <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="form-group" style={{ marginBottom: '0' }}>
              <label className="form-label" style={{ fontSize: '12px' }}>Order Quantity (Packs)</label>
              <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <button className="btn" style={{ padding: '8px 12px', border: 'none', background: 'var(--bg-primary)' }} onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={14} /></button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>{quantity}</div>
                <button className="btn" style={{ padding: '8px 12px', border: 'none', background: 'var(--bg-primary)' }} onClick={() => setQuantity(q => q + 1)}><Plus size={14} /></button>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Price Per Unit:</span>
              <span style={{ fontSize: '16px', fontWeight: '600' }}>${totalPrice.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Estimated Subtotal:</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'var(--font-title)' }}>
                ${(totalPrice * quantity).toFixed(2)}
              </span>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px' }} 
              onClick={handleUploadAddToCart}
              disabled={saving || uploading || !uploadedFileUrl}
            >
              {saving ? (
                'Saving File Reference...'
              ) : uploading ? (
                'File Uploading...'
              ) : !uploadedFileUrl ? (
                'Upload Print-Ready File First'
              ) : (
                <>
                  <ShoppingCart size={16} /> Add Uploaded File to Cart
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* 1. TOP GLOBAL MENU BAR */}
      <header style={{ height: '56px', background: '#ffffff', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 100 }}>
        {/* Left: Logo + Menus */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff6600', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', fontSize: '18px' }}>X</div>
          <nav style={{ display: 'flex', gap: '16px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            <span style={{ cursor: 'pointer' }}>File</span>
            <span style={{ cursor: 'pointer' }}>Edit</span>
            <span style={{ cursor: 'pointer' }}>View</span>
            <span style={{ cursor: 'pointer' }}>?</span>
          </nav>
        </div>

        {/* Center: Undo/Redo & Page Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="editor-toolbar-btn" onClick={undo} disabled={historyIndex <= 0} style={{ opacity: historyIndex <= 0 ? 0.3 : 1, padding: '4px 8px' }} title="Undo"><Undo size={16} /> <span style={{ fontSize: '11px', marginLeft: '4px' }}>Undo</span></button>
            <button className="editor-toolbar-btn" onClick={redo} disabled={historyIndex >= history.length - 1} style={{ opacity: historyIndex >= history.length - 1 ? 0.3 : 1, padding: '4px 8px' }} title="Redo"><Redo size={16} /> <span style={{ fontSize: '11px', marginLeft: '4px' }}>Redo</span></button>
          </div>
          {isDoubleSided() && (
            <div style={{ display: 'flex', background: 'var(--bg-primary)', borderRadius: '6px', padding: '2px' }}>
              <button onClick={() => switchPage('front')} style={{ border: 'none', background: activePage === 'front' ? '#ffffff' : 'transparent', color: activePage === 'front' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '12px', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>Front</button>
              <button onClick={() => switchPage('back')} style={{ border: 'none', background: activePage === 'back' ? '#ffffff' : 'transparent', color: activePage === 'back' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 'bold', fontSize: '12px', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>Back</button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', borderRadius: '6px' }} onClick={() => alert("3D Preview Rendering simulation...")}>3D</button>
          <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', borderRadius: '6px' }} onClick={() => alert("Share link copied to clipboard!")}>Share</button>
          <button className="btn btn-primary btn-sm" style={{ padding: '6px 16px', borderRadius: '6px', background: '#002447', borderColor: '#002447' }} onClick={saveDesignAndCheckout}>
            Process &rarr;
          </button>
        </div>
      </header>

      {/* 2. DYNAMIC CONTEXTUAL TOOLBAR */}
      <div style={{ height: '46px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px', flexShrink: 0, zIndex: 90 }}>
        {selectedEl ? (
          <>
            {selectedEl.type === 'text' && (
              <>
                {/* Font selection */}
                <select 
                  className="input-field"
                  style={{ width: '180px', padding: '4px 8px', fontSize: '13px', height: '32px' }}
                  value={selectedEl.fontFamily || 'Inter'}
                  onChange={(e) => updateSelectedElement({ fontFamily: e.target.value })}
                >
                  <option value="Inter">Inter (Clean Sans)</option>
                  <option value="Outfit">Outfit (Bold Tech)</option>
                  <option value="Courier New">Courier (Monospace)</option>
                  <option value="Georgia">Georgia (Elegant Serif)</option>
                </select>

                {/* Font size */}
                <input 
                  type="number"
                  className="input-field"
                  style={{ width: '70px', padding: '4px 8px', fontSize: '13px', height: '32px' }}
                  value={selectedEl.fontSize || 16}
                  onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) || 12 })}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pt</span>

                <div style={{ width: '1px', background: 'var(--border-color)', height: '20px' }}></div>

                {/* Color picker */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input 
                    type="color"
                    style={{ border: 'none', background: 'none', width: '28px', height: '28px', cursor: 'pointer', padding: 0 }}
                    value={selectedEl.color || '#000000'}
                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                  />
                  <input 
                    type="text"
                    className="input-field"
                    style={{ width: '80px', padding: '4px 8px', fontSize: '12px', height: '32px' }}
                    value={selectedEl.color || '#000000'}
                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                  />
                </div>

                <div style={{ width: '1px', background: 'var(--border-color)', height: '20px' }}></div>

                {/* Bold toggle */}
                <button 
                  onClick={() => updateSelectedElement({ fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  style={{
                    height: '32px',
                    width: '32px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: selectedEl.fontWeight === 'bold' ? '#e2e8f0' : '#ffffff',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Toggle Bold"
                >
                  B
                </button>

                {/* Italic toggle */}
                <button 
                  onClick={() => updateSelectedElement({ fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  style={{
                    height: '32px',
                    width: '32px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: selectedEl.fontStyle === 'italic' ? '#e2e8f0' : '#ffffff',
                    fontStyle: 'italic',
                    fontFamily: 'Georgia, serif',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Toggle Italic"
                >
                  I
                </button>

                <div style={{ width: '1px', background: 'var(--border-color)', height: '20px' }}></div>

                {/* Alignment toggles */}
                <div style={{ display: 'flex', gap: '2px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px' }}>
                  <button 
                    onClick={() => updateSelectedElement({ textAlign: 'left' })}
                    style={{ border: 'none', background: (selectedEl.textAlign || 'left') === 'left' ? '#e2e8f0' : 'transparent', padding: '4px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center' }}
                    title="Align Left"
                  >
                    <AlignLeft size={14} />
                  </button>
                  <button 
                    onClick={() => updateSelectedElement({ textAlign: 'center' })}
                    style={{ border: 'none', background: selectedEl.textAlign === 'center' ? '#e2e8f0' : 'transparent', padding: '4px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center' }}
                    title="Align Center"
                  >
                    <AlignCenter size={14} />
                  </button>
                  <button 
                    onClick={() => updateSelectedElement({ textAlign: 'right' })}
                    style={{ border: 'none', background: selectedEl.textAlign === 'right' ? '#e2e8f0' : 'transparent', padding: '4px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center' }}
                    title="Align Right"
                  >
                    <AlignRight size={14} />
                  </button>
                  <button 
                    onClick={() => updateSelectedElement({ textAlign: 'justify' })}
                    style={{ border: 'none', background: selectedEl.textAlign === 'justify' ? '#e2e8f0' : 'transparent', padding: '4px', cursor: 'pointer', borderRadius: '2px', display: 'flex', alignItems: 'center' }}
                    title="Justify"
                  >
                    <AlignJustify size={14} />
                  </button>
                </div>

                <div style={{ width: '1px', background: 'var(--border-color)', height: '20px' }}></div>

                {/* Case transform */}
                <button 
                  onClick={() => updateSelectedElement({ text: (selectedEl.text || '').toUpperCase() })}
                  style={{
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: '#ffffff',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="Transform to Uppercase"
                >
                  aA
                </button>
              </>
            )}

            {selectedEl.type === 'shape' && (
              <>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Shape Fill:</span>
                <input 
                  type="color"
                  style={{ border: 'none', background: 'none', width: '28px', height: '28px', cursor: 'pointer', padding: 0 }}
                  value={selectedEl.color || '#000000'}
                  onChange={(e) => updateSelectedElement({ color: e.target.value })}
                />
              </>
            )}

            <div style={{ width: '1px', background: 'var(--border-color)', height: '20px', marginLeft: 'auto' }}></div>
            
            {/* Layer Controls in Toolbar */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="editor-toolbar-btn" onClick={duplicateSelectedElement} title="Duplicate"><Copy size={14} /></button>
              <button className="editor-toolbar-btn" onClick={() => moveLayer('up')} title="Bring to Front"><MoveUp size={14} /></button>
              <button className="editor-toolbar-btn" onClick={() => moveLayer('down')} title="Send to Back"><MoveDown size={14} /></button>
              <button className="editor-toolbar-btn danger" onClick={deleteSelectedElement} title="Delete"><Trash2 size={14} /></button>
            </div>
          </>
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Select an element on canvas to display properties.</span>
        )}
      </div>

      <div className="editor-container" style={{ position: 'relative', flex: 1, display: 'flex', height: 'auto', overflow: 'hidden' }}>
        {openDropdown && (
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 15 }} 
            onClick={() => setOpenDropdown(null)} 
          />
        )}

        {/* MOBILE EDITOR TAB BAR */}
      <div className="editor-mobile-tab-bar desktop-hide">
        <button 
          className={`editor-mobile-tab ${mobileTab === 'canvas' ? 'active' : ''}`}
          onClick={() => setMobileTab('canvas')}
        >
          Canvas
        </button>
        <button 
          className={`editor-mobile-tab ${mobileTab === 'tools' ? 'active' : ''}`}
          onClick={() => setMobileTab('tools')}
        >
          Tools
        </button>
        <button 
          className={`editor-mobile-tab ${mobileTab === 'specs' ? 'active' : ''}`}
          onClick={() => setMobileTab('specs')}
        >
          Specs
        </button>
      </div>

      {/* SIDEBAR DE HERRAMIENTAS (IZQUIERDO) */}
      <aside className={`editor-sidebar ${mobileTab === 'tools' ? '' : 'mobile-hide'}`} style={{ display: 'flex', flexDirection: 'row', width: '360px', height: '100%', borderRight: '1px solid var(--border-color)', position: 'relative', zIndex: 20 }}>
        {/* COLUMNA VERTICAL DE TABS (IZQUIERDO) */}
        <div style={{ width: '76px', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', borderRight: '1px solid var(--border-color)', height: '100%', alignItems: 'center', paddingTop: '16px', gap: '4px' }}>
          {/* TAB 1: PRODUCT OPTIONS */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'options' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('options')}
          >
            <div className="icon-container">
              <Sliders size={18} />
            </div>
            <span className="editor-nav-tab-label">Product options</span>
          </div>

          {/* TAB 2: TEXT */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'text' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('text')}
          >
            <div className="icon-container">
              <Type size={18} />
            </div>
            <span className="editor-nav-tab-label">Text</span>
          </div>

          {/* TAB 3: UPLOADS */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'uploads' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('uploads')}
          >
            <div className="icon-container">
              <Upload size={18} />
            </div>
            <span className="editor-nav-tab-label">Uploads</span>
          </div>

          {/* TAB 4: GRAPHICS */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'graphics' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('graphics')}
          >
            <div className="icon-container">
              <Palette size={18} />
            </div>
            <span className="editor-nav-tab-label">Graphics</span>
          </div>

          {/* TAB 5: BACKGROUND */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'background' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('background')}
          >
            <div className="icon-container">
              <ImageIcon size={18} />
            </div>
            <span className="editor-nav-tab-label">Background</span>
          </div>

          {/* TAB 6: PATTERN */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'pattern' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('pattern')}
          >
            <div className="icon-container">
              <Grid size={18} />
            </div>
            <span className="editor-nav-tab-label">Pattern</span>
          </div>

          {/* TAB 7: TEMPLATE */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'templates' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('templates')}
          >
            <div className="icon-container">
              <Columns size={18} />
            </div>
            <span className="editor-nav-tab-label">Template</span>
          </div>

          {/* TAB 8: MORE */}
          <div 
            className={`editor-nav-tab ${selectedTab === 'more' ? 'active' : ''}`} 
            onClick={() => setSelectedTab('more')}
          >
            <div className="icon-container">
              <Plus size={18} />
            </div>
            <span className="editor-nav-tab-label">More</span>
          </div>
        </div>

        {/* CONTENIDO DEL PANEL SELECCIONADO (DERECHA) */}
        <div className="editor-sidebar-content" style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
          <div style={{ flex: 1 }}>
            {/* TAB 1: PRODUCT OPTIONS */}
            {selectedTab === 'options' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Sliders size={18} style={{ color: '#0284c7' }} />
                  Product Options
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>
                  Configure your product's size, quantity, and print options. The canvas adapts to your specifications.
                </p>

                {/* Name reference input */}
                <div style={{ marginBottom: '8px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>Design Reference Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={canvasName} 
                    onChange={(e) => setCanvasName(e.target.value)} 
                    placeholder="e.g. My Custom Print Design"
                    style={{ padding: '8px 12px', fontSize: '13px' }}
                  />
                </div>

                {/* Specs selectors */}
                {product && product.specs && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {Object.entries(
                      product.specs.reduce((acc: any, spec: any) => {
                        if (!acc[spec.group]) acc[spec.group] = [];
                        acc[spec.group].push(spec);
                        return acc;
                      }, {})
                    ).map(([group, specsList]: [string, any]) => {
                      const selectedValue = selectedSpecs[group] || '';
                      const isNeutral = !selectedValue || 
                                        selectedValue.toLowerCase() === 'none' || 
                                        selectedValue.toLowerCase().includes('no special') ||
                                        selectedValue.toLowerCase() === 'basic' ||
                                        selectedValue.toLowerCase() === 'standard' ||
                                        selectedValue.toLowerCase().includes('no back');
                                        
                      const borderColor = isNeutral ? 'var(--border-color)' : '#8cc63f';
                      const labelColor = isNeutral ? 'var(--text-muted)' : '#5b9317';
                      const isOrientation = group.toLowerCase() === 'orientation';
                      const isPaper = group.toLowerCase() === 'paper' || group.toLowerCase() === 'paper stock';

                      return (
                        <div key={group} style={{ marginBottom: '2px', position: 'relative' }}>
                          {isPaper && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
                              <a 
                                href="#paper-thickness" 
                                onClick={(e) => { 
                                  e.preventDefault(); 
                                  alert("Paper Thickness Guide:\n\n14 pt. Gloss is a thick, industry-standard cardstock with a glossy finish that makes colors vibrant.\n\n16 pt. Premium Matte is an extra-heavy premium cardstock with a soft, non-reflective matte finish for a luxury tactile experience."); 
                                }} 
                                style={{ 
                                  fontSize: '10px', 
                                  color: '#0066cc', 
                                  textDecoration: 'none', 
                                  cursor: 'pointer',
                                  fontWeight: '600'
                                }}
                              >
                                Paper Thickness
                              </a>
                            </div>
                          )}

                          {isOrientation ? (
                            <div 
                              style={{ 
                                position: 'relative',
                                border: `1.5px solid #8cc63f`,
                                borderRadius: '6px',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                height: '42px',
                                width: '100%'
                              }}
                            >
                              <span style={{
                                position: 'absolute',
                                top: '-9px',
                                left: '10px',
                                background: '#ffffff',
                                padding: '0 4px',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                color: '#5b9317',
                                textTransform: 'uppercase',
                                zIndex: 2
                              }}>
                                {group}
                              </span>
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
                                      onClick={() => setSelectedSpecs({ ...selectedSpecs, [group]: spec.value })}
                                      style={{
                                        flex: 1,
                                        height: '100%',
                                        background: 'transparent',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: isSelected ? '700' : '500',
                                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                                        outline: 'none'
                                      }}
                                    >
                                      {isHorizontal ? (
                                        <div style={{ width: '16px', height: '10px', borderRadius: '1px', backgroundColor: isSelected ? '#8cc63f' : '#d1d5db' }} />
                                      ) : (
                                        <div style={{ width: '10px', height: '16px', borderRadius: '1px', backgroundColor: isSelected ? '#8cc63f' : '#d1d5db' }} />
                                      )}
                                      <span>{spec.value}</span>
                                    </button>
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          ) : (
                            <div 
                              style={{ 
                                position: 'relative',
                                border: `1.5px solid ${borderColor}`,
                                borderRadius: '6px',
                                padding: '0 10px',
                                background: 'var(--bg-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                height: '42px',
                                cursor: 'pointer',
                                zIndex: openDropdown === group ? 25 : 1
                              }}
                              onClick={() => setOpenDropdown(openDropdown === group ? null : group)}
                            >
                              <span style={{
                                position: 'absolute',
                                top: '-9px',
                                left: '10px',
                                background: '#ffffff',
                                padding: '0 4px',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                color: labelColor,
                                textTransform: 'uppercase',
                                zIndex: 2
                              }}>
                                {group}
                              </span>
                              <div style={{ width: '100%', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', paddingRight: '50px', display: 'flex', alignItems: 'center', height: '100%', userSelect: 'none' }}>
                                {selectedValue}
                              </div>

                              {openDropdown === group && (
                                <div 
                                  style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 4px)',
                                    left: '-1.5px',
                                    right: '-1.5px',
                                    background: '#ffffff',
                                    border: `1.5px solid ${borderColor}`,
                                    borderRadius: '6px',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                                    zIndex: 30,
                                    maxHeight: '180px',
                                    overflowY: 'auto',
                                    padding: '4px 0'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {specsList.map((spec: any) => {
                                    const isSelected = selectedValue === spec.value;
                                    const markupVal = Number(spec.priceMarkup || 0);
                                    const actualMarkup = spec.markupType === 'PERCENTAGE'
                                      ? (product.basePrice * markupVal) / 100
                                      : markupVal;
                                    const markupText = markupVal > 0 
                                      ? `(+$${actualMarkup.toFixed(2)})` 
                                      : '';
                                    return (
                                      <div
                                        key={spec.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedSpecs({ ...selectedSpecs, [group]: spec.value });
                                          setOpenDropdown(null);
                                        }}
                                        style={{
                                          padding: '8px 12px',
                                          fontSize: '12px',
                                          fontWeight: isSelected ? '700' : '500',
                                          color: isSelected ? '#5b9317' : 'var(--text-primary)',
                                          background: isSelected ? '#f5f9eb' : 'transparent',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <span>{spec.value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              <div style={{ position: 'absolute', right: '10px', display: 'flex', alignItems: 'center', gap: '6px', pointerEvents: 'none' }}>
                                {(group.toLowerCase().includes('coating') || group.toLowerCase().includes('finish') || group.toLowerCase().includes('paper')) && (
                                  <div 
                                    title={
                                      group.toLowerCase().includes('coating') 
                                      ? "Coating protects your card and enhances colors."
                                      : "Paper selection affects weight and texture."
                                    }
                                    style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#8cc63f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', cursor: 'help', pointerEvents: 'auto' }}
                                  >
                                    <span style={{ fontSize: '8px', fontWeight: 'bold' }}>?</span>
                                  </div>
                                )}
                                {!isNeutral && (
                                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#8cc63f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                                    <span style={{ fontSize: '8px', fontWeight: 'bold' }}>✔</span>
                                  </div>
                                )}
                                <ChevronDown size={12} style={{ color: 'var(--text-secondary)' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Quantity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label className="form-label" style={{ fontSize: '11px', color: 'var(--text-primary)', margin: 0 }}>Quantity (Packs)</label>
                  <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '36px' }}>
                    <button type="button" className="btn" style={{ padding: '0 12px', border: 'none', background: 'var(--bg-primary)' }} onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus size={12} /></button>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 'bold' }}>{quantity}</div>
                    <button type="button" className="btn" style={{ padding: '0 12px', border: 'none', background: 'var(--bg-primary)' }} onClick={() => setQuantity(q => q + 1)}><Plus size={12} /></button>
                  </div>
                </div>

                {/* Pricing subtotal */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Price Per Unit:</span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Estimated Subtotal:</span>
                    <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--accent-primary)', fontFamily: 'var(--font-title)' }}>
                      ${(totalPrice * quantity).toFixed(2)}
                    </span>
                  </div>

                  <button 
                    type="button"
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '10px', fontSize: '12px' }} 
                    onClick={saveDesignAndCheckout}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (
                      <>
                        <ShoppingCart size={14} /> Add to Cart & Checkout
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: TEXT */}
            {selectedTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: '0' }}>
                    <Type size={18} style={{ color: '#0284c7' }} />
                    Text
                  </h3>
                  <Maximize2 size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: '0' }}>
                  Edit your text below, or click on the field you'd like to edit directly on your design.
                </p>

                {/* DYNAMIC TEXT FIELDS LIST */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {canvasElements.filter(el => el.type === 'text').map((el, index) => {
                    const isFocused = selectedElementId === el.id;
                    
                    // Simple helper to get semantic labels matching VistaPrint
                    const getTextLabel = (element: CanvasElement, idx: number) => {
                      if (element.id === 't1') return 'Company Name';
                      if (element.id === 't2') return 'Full Name';
                      if (element.id === 't3') return 'Job Title';
                      if (element.id === 't4') return 'Contact / Other';
                      
                      const txt = (element.text || '').toLowerCase();
                      if (txt.includes('street') || txt.includes('address') || txt.includes('av.') || txt.includes('ave') || txt.includes('dir')) {
                        return `Address Line ${idx - 3 > 0 ? idx - 3 : ''}`;
                      }
                      if (txt.includes('@') || txt.includes('email') || txt.includes('mail')) {
                        return 'Email / Other';
                      }
                      if (txt.includes('tel') || txt.includes('phone') || txt.includes('cell') || txt.includes('☎') || txt.includes('+')) {
                        return 'Phone / Other';
                      }
                      if (txt.includes('www') || txt.includes('.com') || txt.includes('.net') || txt.includes('.org') || txt.includes('web')) {
                        return 'Web / Other';
                      }
                      if (txt.includes('acme') || txt.includes('company') || txt.includes('corp')) {
                        return 'Company Name';
                      }
                      if (txt.includes('heading')) return 'Heading';
                      if (txt.includes('subheading')) return 'Subheading';
                      return `Text Field ${idx + 1}`;
                    };

                    return (
                      <div 
                        key={el.id} 
                        className={`text-element-row ${isFocused ? 'focused' : ''}`}
                        onClick={() => setSelectedElementId(el.id)}
                      >
                        <div className="text-element-row-header">
                          <span className="text-element-row-label">{getTextLabel(el, index)}</span>
                          {isFocused && (
                            <span style={{ fontSize: '9px', color: '#0284c7', fontWeight: 'bold' }}>SELECTED</span>
                          )}
                        </div>
                        <input
                          type="text"
                          className="input-field"
                          style={{ 
                            padding: '6px 8px', 
                            fontSize: '13px', 
                            border: 'none', 
                            borderBottom: isFocused ? '1px solid #0284c7' : '1px solid var(--border-color)', 
                            borderRadius: '0', 
                            background: 'transparent',
                            outline: 'none',
                            boxShadow: 'none'
                          }}
                          value={el.text || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const updated = canvasElements.map(item => {
                              if (item.id === el.id) {
                                return { ...item, text: val };
                              }
                              return item;
                            });
                            setCanvasElements(updated);
                            saveToHistory(updated);
                          }}
                          onFocus={() => {
                            setSelectedElementId(el.id);
                            setFocusedElementId(el.id);
                          }}
                          onBlur={() => setFocusedElementId(null)}
                          placeholder="Empty text field"
                        />
                      </div>
                    );
                  })}
                  
                  {canvasElements.filter(el => el.type === 'text').length === 0 && (
                    <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No text layers on this page. Add a text field below.
                    </div>
                  )}
                </div>

                {/* NEW TEXT FIELD BUTTON */}
                <button 
                  type="button"
                  className="btn" 
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    gap: '8px', 
                    justifyContent: 'center', 
                    background: '#60a5fa', 
                    color: '#002447', 
                    padding: '12px',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    marginTop: '8px'
                  }} 
                  onClick={() => addTextElement('New Text Field', 16, 'normal')}
                >
                  <Plus size={16} /> New Text Field
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm" 
                    style={{ padding: '8px', fontSize: '11px' }} 
                    onClick={() => addTextElement('Add a Heading', 36, 'bold')}
                  >
                    + Heading
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary btn-sm" 
                    style={{ padding: '8px', fontSize: '11px' }} 
                    onClick={() => addTextElement('Add body text', 14, 'normal')}
                  >
                    + Body Text
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: UPLOADS */}
            {selectedTab === 'uploads' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} style={{ color: '#0284c7' }} />
                  Uploads
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Upload your business logos or transparent PNG vectors to place on your design.</p>
                
                <label className="btn btn-primary" style={{ width: '100%', cursor: 'pointer', display: 'flex', gap: '8px', justifyContent: 'center', padding: '12px', background: '#0284c7', borderColor: '#0284c7' }}>
                  <Upload size={16} /> Upload image file
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>

                <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Your Gallery</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {uploadedImages.map((src, i) => (
                    <div 
                      key={i} 
                      onClick={() => addImageElement(src)}
                      style={{ aspectRatio: '1', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <img src={src} alt="Uploaded logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: GRAPHICS */}
            {selectedTab === 'graphics' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-title)', margin: '0' }}>Graphics</h3>
                  <Maximize2 size={16} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                </div>
                
                {/* Search input */}
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="text" 
                    placeholder="Search for content" 
                    value={graphicsSearch}
                    onChange={(e) => setGraphicsSearch(e.target.value)}
                    style={{ width: '100%', padding: '10px 36px 10px 12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '13px' }}
                  />
                  <Search size={16} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }} />
                </div>

                {/* Section 1: Shapes */}
                {(!graphicsSearch || 'shapes'.includes(graphicsSearch.toLowerCase())) && (
                  <div className="graphics-section">
                    <div className="graphics-section-header">
                      <h4>Shapes</h4>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="graphics-grid">
                      <div className="graphics-item-box" onClick={() => addShapeElement('rect')}>
                        <div style={{ width: '32px', height: '32px', background: '#000000' }}></div>
                      </div>
                      <div className="graphics-item-box" onClick={() => addShapeElement('circle')}>
                        <div style={{ width: '32px', height: '32px', background: '#000000', borderRadius: '50%' }}></div>
                      </div>
                      <div className="graphics-item-box" onClick={() => addShapeElement('triangle')}>
                        <svg viewBox="0 0 100 100" style={{ width: '32px', height: '32px' }}>
                          <polygon points="50,5 95,95 5,95" fill="#000000" />
                        </svg>
                      </div>
                    </div>
                    <div className="graphics-carousel-dots">
                      <div className="graphics-dot active"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                    </div>
                  </div>
                )}

                {/* Section 2: Images */}
                {(!graphicsSearch || 'images'.includes(graphicsSearch.toLowerCase()) || 'desk computer paint'.includes(graphicsSearch.toLowerCase())) && (
                  <div className="graphics-section">
                    <div className="graphics-section-header">
                      <h4>Images</h4>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="graphics-grid">
                      {[
                        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=150',
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=150',
                        'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=150'
                      ].map((url, i) => (
                        <div key={i} className="graphics-item-box" onClick={() => addImageElement(url)}>
                          <img src={url} alt="Desk setup preset" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                    <div className="graphics-carousel-dots">
                      <div className="graphics-dot active"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                    </div>
                  </div>
                )}

                {/* Section 3: Icons */}
                {(!graphicsSearch || 'icons'.includes(graphicsSearch.toLowerCase())) && (
                  <div className="graphics-section">
                    <div className="graphics-section-header">
                      <h4>Icons</h4>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="graphics-grid">
                      {[
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20'/></svg>",
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2'><circle cx='12' cy='12' r='10'/><polygon points='12 12 8 16 16 16'/><circle cx='10' cy='9' r='1'/></svg>",
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>"
                      ].map((svgUrl, i) => (
                        <div key={i} className="graphics-item-box" onClick={() => addImageElement(svgUrl)}>
                          <img src={svgUrl} alt="SVG Icon preset" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                        </div>
                      ))}
                    </div>
                    <div className="graphics-carousel-dots">
                      <div className="graphics-dot active"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                    </div>
                  </div>
                )}

                {/* Section 4: Illustrations */}
                {(!graphicsSearch || 'illustrations'.includes(graphicsSearch.toLowerCase()) || 'star sun sparkle'.includes(graphicsSearch.toLowerCase())) && (
                  <div className="graphics-section">
                    <div className="graphics-section-header">
                      <h4>Illustrations</h4>
                      <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div className="graphics-grid">
                      <div className="graphics-item-box" onClick={() => addShapeElement('star')} style={{ padding: '8px' }}>
                        <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="none" stroke="#718096" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="graphics-item-box" onClick={() => addShapeElement('sun')} style={{ padding: '8px' }}>
                        <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%' }}>
                          <circle cx="12" cy="12" r="5" fill="none" stroke="#718096" strokeWidth="1.5" />
                          <path d="M12 2v3M12 19v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12" stroke="#718096" strokeWidth="1.5" />
                        </svg>
                      </div>
                      <div className="graphics-item-box" onClick={() => addShapeElement('sparkle')} style={{ padding: '8px' }}>
                        <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', fill: 'none', stroke: '#718096', strokeWidth: '1.5' }}>
                          <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.34 6.34l3.54 3.54M14.12 14.12l3.54 3.54M6.34 17.66l3.54-3.54M14.12 9.88l3.54-3.54" />
                        </svg>
                      </div>
                    </div>
                    <div className="graphics-carousel-dots">
                      <div className="graphics-dot active"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                      <div className="graphics-dot"></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: BACKGROUND */}
            {selectedTab === 'background' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ImageIcon size={18} style={{ color: '#0284c7' }} />
                  Background
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Select a canvas background preset color or template pattern overlay.</p>
                
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>Colors</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {[
                    { name: 'White', value: '#ffffff' },
                    { name: 'Dark Navy', value: '#002447' },
                    { name: 'Forest Green', value: '#006f42' },
                    { name: 'Sunset Coral', value: '#ff6600' },
                    { name: 'Pastel Blue', value: '#e0f2fe' },
                    { name: 'Soft Yellow', value: '#fef08a' },
                    { name: 'Light Grey', value: '#f1f5f9' },
                    { name: 'Jet Black', value: '#1a1a1a' }
                  ].map((color) => (
                    <div
                      key={color.name}
                      onClick={() => setCanvasBg(color.value)}
                      style={{
                        aspectRatio: '1',
                        background: color.value,
                        border: canvasBg === color.value ? '2px solid #0284c7' : '1px solid var(--border-color)',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transform: canvasBg === color.value ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: PATTERN */}
            {selectedTab === 'pattern' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Grid size={18} style={{ color: '#0284c7' }} />
                  Patterns
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Apply a repeating watermark print pattern onto the backdrop canvas.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div 
                    onClick={() => setCanvasBg('#ffffff')}
                    style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: '#fff', fontSize: '13px', fontWeight: '600' }}
                  >
                    Solid Pure Background
                  </div>
                  <div 
                    onClick={() => addShapeElement('line', 'rgba(0, 0, 0, 0.1)')}
                    style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'radial-gradient(#ccc 1px, transparent 1px) 0 0/10px 10px', fontSize: '13px', fontWeight: '600' }}
                  >
                    Add Grid Rules
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: TEMPLATES */}
            {selectedTab === 'templates' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Columns size={18} style={{ color: '#0284c7' }} />
                  Templates
                </h3>
                
                {isAdmin && (
                  <div style={{ padding: '12px', border: '1px solid #bae6fd', borderRadius: '8px', background: '#f0f9ff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 'bold', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Shield size={14} /> Admin Controls
                    </h4>
                    <p style={{ fontSize: '11px', color: '#0e7490', margin: 0 }}>Save your current canvas layout as an admin template for this product base.</p>
                    <button
                      type="button"
                      className="btn"
                      style={{ background: '#0284c7', color: 'white', border: 'none', padding: '8px 12px', fontSize: '12px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}
                      onClick={() => {
                        setTemplateName(canvasName);
                        setShowSaveTemplateModal(true);
                      }}
                    >
                      <Save size={14} /> Save Current as Template
                    </button>
                  </div>
                )}

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', margin: 0 }}>Load a template to replace active elements on your canvas.</p>
                
                {/* Dynamic DB-backed templates */}
                {templates.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', margin: '8px 0 0 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                      Custom Templates
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {templates.map((tpl) => (
                        <div 
                          key={tpl.id} 
                          className="template-card" 
                          onClick={() => loadDynamicTemplate(tpl)}
                          style={{ cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', transition: 'all 0.15s ease' }}
                        >
                          <div style={{ height: '60px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {tpl.previewUrl ? (
                              <img src={tpl.previewUrl} alt={tpl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ fontSize: '20px', color: 'var(--text-muted)' }}><Columns size={20} /></div>
                            )}
                          </div>
                          <div style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 'bold', textAlign: 'center', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={tpl.name}>
                            {tpl.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <h4 style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em', margin: '8px 0 0 0', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  Starter Templates
                </h4>
                <div className="templates-grid" style={{ marginTop: '0', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div className="template-card" onClick={() => loadSidebarTemplate('corporate')} style={{ cursor: 'pointer' }}>
                    <div style={{ height: '60px', background: 'linear-gradient(135deg, #002447 0%, #003666 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 'bold' }}>Corporate</div>
                    <div style={{ padding: '8px', fontSize: '11px', textAlign: 'center' }}>Global Tech</div>
                  </div>
                  <div className="template-card" onClick={() => loadSidebarTemplate('creative')} style={{ cursor: 'pointer' }}>
                    <div style={{ height: '60px', background: 'linear-gradient(135deg, #ff6600 0%, #ff8833 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 'bold' }}>Creative</div>
                    <div style={{ padding: '8px', fontSize: '11px', textAlign: 'center' }}>Hologram</div>
                  </div>
                </div>
                <div className="template-card" style={{ width: '100%', cursor: 'pointer' }} onClick={() => loadSidebarTemplate('minimalist')}>
                  <div style={{ height: '60px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-primary)', fontWeight: 'bold' }}>Minimalist</div>
                  <div style={{ padding: '8px', fontSize: '11px', textAlign: 'center' }}>Essential</div>
                </div>
              </div>
            )}

            {/* TAB 8: MORE */}
            {selectedTab === 'more' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={18} style={{ color: '#0284c7' }} />
                  More
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Additional print setup settings and canvas actions.</p>
                
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}
                  onClick={() => {
                    setCanvasElements([]);
                    setHistory([]);
                    setHistoryIndex(-1);
                  }}
                >
                  Clear Canvas Elements
                </button>
              </div>
            )}
          </div>

          {/* REGRESAR A PRODUCTO */}
                          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center', padding: '10px' }} onClick={() => router.push(`/products/${productSlug}?${new URLSearchParams(selectedSpecs).toString()}`)}>
              <ArrowLeft size={14} /> Back to Configurator
            </button>
          </div>
        </div>
      </aside>

      {/* SECCIÓN CENTRAL */}
      <div 
        className={`editor-canvas-wrapper ${mobileTab === 'canvas' ? '' : 'mobile-hide'}`}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}
      >
        {/* LIENZO DE DISEÑO CENTRAL SCROLLABLE */}
        <main className="editor-canvas-area" style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {/* LIENZO REAL (CONTAINER CON REGLAS) */}
        <div 
          className="editor-canvas-container"
          ref={canvasRef}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            position: 'relative',
            flexShrink: 0
          }}
        >
          {/* SVG DEF MARKERS FOR DIMENSION ARROWS */}
          <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
            <defs>
              <marker id="arrow-start" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 10 0 L 0 5 L 10 10 z" fill="#64748b" />
              </marker>
              <marker id="arrow-end" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
              <marker id="arrow-up" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 10 0 L 0 5 L 10 10 z" fill="#64748b" />
              </marker>
              <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
              </marker>
            </defs>
          </svg>

          {showRulers && (
            <>
              {/* ESQUINA DE UNIDAD */}
              <div style={{
                position: 'absolute',
                left: '-22px',
                top: '-22px',
                width: '22px',
                height: '22px',
                background: '#f8fafc',
                borderTop: '1px solid #cbd5e1',
                borderLeft: '1px solid #cbd5e1',
                borderRight: '2px solid #64748b',
                borderBottom: '2px solid #64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'bold',
                color: '#64748b',
                userSelect: 'none',
                fontFamily: 'monospace',
                zIndex: 10
              }}>
                {unitLabel}
              </div>

              {/* REGLA HORIZONTAL */}
              <div className="canvas-ruler-horizontal" style={{ width: `${canvasWidth}px` }}>
                {hTicks.map((tick, idx) => (
                  <div 
                    key={`h-tick-${idx}`} 
                    style={{
                      position: 'absolute',
                      left: `${tick.x}px`,
                      bottom: 0,
                      width: '1px',
                      height: tick.type === 'major' ? '12px' : tick.type === 'medium' ? '8px' : '4px',
                      background: '#64748b',
                    }}
                  >
                    {tick.type === 'major' && (
                      <span style={{
                        position: 'absolute',
                        left: '3px',
                        bottom: '2px',
                        fontSize: '8px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'monospace'
                      }}>
                        {tick.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* REGLA VERTICAL */}
              <div className="canvas-ruler-vertical" style={{ height: `${canvasHeight}px` }}>
                {vTicks.map((tick, idx) => (
                  <div 
                    key={`v-tick-${idx}`} 
                    style={{
                      position: 'absolute',
                      top: `${tick.y}px`,
                      right: 0,
                      height: '1px',
                      width: tick.type === 'major' ? '12px' : tick.type === 'medium' ? '8px' : '4px',
                      background: '#64748b',
                    }}
                  >
                    {tick.type === 'major' && (
                      <span style={{
                        position: 'absolute',
                        right: '14px',
                        top: '0',
                        transform: 'translateY(-50%)',
                        fontSize: '8px',
                        fontWeight: '600',
                        color: '#475569',
                        fontFamily: 'monospace',
                        lineHeight: 1
                      }}>
                        {tick.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* HORIZONTAL DIMENSION LINE */}
          <div className="dimension-line-horizontal">
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <line x1="5" y1="10" x2={canvasWidth - 5} y2="10" stroke="#cbd5e1" strokeWidth="1" markerStart="url(#arrow-start)" markerEnd="url(#arrow-end)" />
            </svg>
            <div 
              className="dimension-label-badge" 
              onClick={() => setSelectedTab('options')}
              title="Click to edit product size options"
            >
              <span>{((canvasWidth) / pxPerUnit).toFixed(2)} {unitLabel}</span>
              <Edit3 size={10} />
            </div>
          </div>

          {/* VERTICAL DIMENSION LINE */}
          <div className="dimension-line-vertical">
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <line x1="10" y1="5" x2="10" y2={canvasHeight - 5} stroke="#cbd5e1" strokeWidth="1" markerStart="url(#arrow-up)" markerEnd="url(#arrow-down)" />
            </svg>
            <div 
              className="dimension-label-badge" 
              style={{ 
                position: 'absolute', 
                left: '-22px', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '2px',
                padding: '4px 6px'
              }}
              onClick={() => setSelectedTab('options')}
              title="Click to edit product size options"
            >
              <span>{((canvasHeight) / pxPerUnit).toFixed(2)} {unitLabel}</span>
              <Edit3 size={10} />
            </div>
          </div>

          {/* EL LIENZO EN SÍ */}
          <div 
            className="canvas-wrapper"
            onMouseDown={handleCanvasMouseDown}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: canvasBg,
            }}
          >
          {/* Línea de sangrado (azul/roja) */}
          {showBleed && (
            <div 
              className="canvas-bleed-line"
              style={{
                position: 'absolute',
                top: `${cutLineOffset}px`,
                left: `${cutLineOffset}px`,
                right: `${cutLineOffset}px`,
                bottom: `${cutLineOffset}px`,
                border: '1.5px solid #ef4444',
                pointerEvents: 'none',
                zIndex: 50
              }}
            >
              <span style={{ position: 'absolute', top: '-14px', left: '4px', fontSize: '9px', color: 'rgba(239, 68, 68, 0.75)', fontFamily: 'monospace', fontWeight: 'bold' }}>CUT / TRIM LINE</span>
            </div>
          )}
          
          {/* Línea de área segura (verde) */}
          {showSafeZone && (
            <div 
              className="canvas-safe-zone"
              style={{
                position: 'absolute',
                top: `${safeZoneOffset}px`,
                left: `${safeZoneOffset}px`,
                right: `${safeZoneOffset}px`,
                bottom: `${safeZoneOffset}px`,
                border: '1.5px dashed #16a34a',
                pointerEvents: 'none',
                zIndex: 50
              }}
            >
              <span style={{ position: 'absolute', top: '2px', left: '4px', fontSize: '9px', color: 'rgba(22, 163, 74, 0.5)', fontFamily: 'monospace' }}>SAFE PREPRESS LIMIT</span>
            </div>
          )}

          {/* RENDERIZADO DE LOS ELEMENTOS */}
          {canvasElements.map((el) => {
            const isSelected = selectedElementIds.includes(el.id);
            
            return (
              <div
                key={el.id}
                className={`canvas-element ${isSelected ? 'selected' : ''}`}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
                style={{
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  height: `${el.height}px`,
                  transform: `rotate(${el.angle}deg)`,
                  zIndex: canvasElements.indexOf(el) + 1,
                }}
              >
                {/* 1. TEXT ELEMENT */}
                {el.type === 'text' && (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      updateSelectedElement({ text: e.currentTarget.textContent || '' });
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      fontFamily: el.fontFamily || 'Inter',
                      fontSize: `${el.fontSize || 16}px`,
                      color: el.color || '#000000',
                      wordBreak: 'break-word',
                      outline: 'none',
                      textAlign: el.textAlign || 'left',
                      fontWeight: el.fontWeight === 'bold' ? 700 : (el.fontFamily === 'Outfit' ? 700 : 400),
                      fontStyle: el.fontStyle || 'normal',
                    }}
                  >
                    {el.text}
                  </div>
                )}

                {/* 2. IMAGE ELEMENT */}
                {el.type === 'image' && el.src && (
                  <img
                    src={el.src}
                    alt="Custom upload"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* 3. SHAPE ELEMENT */}
                {el.type === 'shape' && (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    {el.shapeType === 'rect' && (
                      <div style={{ width: '100%', height: '100%', background: el.color || '#000' }}></div>
                    )}
                    {el.shapeType === 'circle' && (
                      <div style={{ width: '100%', height: '100%', background: el.color || '#000', borderRadius: '50%' }}></div>
                    )}
                    {el.shapeType === 'line' && (
                      <div style={{ width: '100%', height: `${el.height}px`, background: el.color || '#000' }}></div>
                    )}
                    {el.shapeType === 'triangle' && (
                      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
                        <polygon points="50,5 95,95 5,95" fill={el.color || '#000'} />
                      </svg>
                    )}
                    {el.shapeType === 'star' && (
                      <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', display: 'block' }}>
                        <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="none" stroke={el.color || '#000'} strokeWidth="2" />
                      </svg>
                    )}
                    {el.shapeType === 'sun' && (
                      <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', display: 'block' }}>
                        <circle cx="12" cy="12" r="5" fill="none" stroke={el.color || '#000'} strokeWidth="2" />
                        <path d="M12 2v3M12 19v3M3 12h3M18 12h3M5.64 5.64l2.12 2.12M16.24 16.24l2.12 2.12M5.64 18.36l2.12-2.12M16.24 7.76l2.12-2.12" stroke={el.color || '#000'} strokeWidth="2" />
                      </svg>
                    )}
                    {el.shapeType === 'sparkle' && (
                      <svg viewBox="0 0 24 24" style={{ width: '100%', height: '100%', display: 'block', fill: 'none', stroke: el.color || '#000', strokeWidth: '2' }}>
                        <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.34 6.34l3.54 3.54M14.12 14.12l3.54 3.54M6.34 17.66l3.54-3.54M14.12 9.88l3.54-3.54" />
                      </svg>
                    )}
                  </div>
                )}

                {/* Controles de Redimensionamiento (esquinas) */}
                {isSelected && selectedElementIds.length === 1 && (
                  <>
                    <div className="canvas-element-handle handle-nw" onMouseDown={(e) => handleResizeMouseDown(e, el, 'nw')}></div>
                    <div className="canvas-element-handle handle-ne" onMouseDown={(e) => handleResizeMouseDown(e, el, 'ne')}></div>
                    <div className="canvas-element-handle handle-sw" onMouseDown={(e) => handleResizeMouseDown(e, el, 'sw')}></div>
                    <div className="canvas-element-handle handle-se" onMouseDown={(e) => handleResizeMouseDown(e, el, 'se')}></div>
                  </>
                )}
              </div>
            );
          })}

          {/* SELECTION BOX OVERLAY */}
          {selectionBox && (
            <div 
              style={{
                position: 'absolute',
                left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
                top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
                width: `${Math.abs(selectionBox.startX - selectionBox.endX)}px`,
                height: `${Math.abs(selectionBox.startY - selectionBox.endY)}px`,
                border: '1.5px dotted #0284c7',
                backgroundColor: 'rgba(2, 132, 199, 0.08)',
                pointerEvents: 'none',
                zIndex: 100
              }}
            />
          )}
          </div>
        </div>
      </main>

      {/* BOTTOM LEFT FLOATING STATUS GUIDES (PILL BADGES) */}
      <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '8px', zIndex: 40 }}>
        <div 
          className="canvas-badge" 
          style={{ cursor: 'pointer', opacity: showSafeZone ? 1 : 0.5, transition: 'opacity 0.2s', borderColor: 'rgba(22, 163, 74, 0.2)', color: '#16a34a' }}
          onClick={() => setShowSafeZone(!showSafeZone)}
          title="Toggle Safety Area guide lines"
        >
          <span className="canvas-badge-dot" style={{ background: '#16a34a', border: 'none' }}></span>
          <span>Safe Zone</span>
        </div>
        <div 
          className="canvas-badge" 
          style={{ cursor: 'pointer', opacity: showBleed ? 1 : 0.5, transition: 'opacity 0.2s', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}
          onClick={() => setShowBleed(!showBleed)}
          title="Toggle Bleed guide lines"
        >
          <span className="canvas-badge-dot" style={{ background: '#ef4444', border: 'none' }}></span>
          <span>Cut Line</span>
        </div>
      </div>

      {/* BOTTOM RIGHT FLOATING ZOOM CAPSULE */}
      <div style={{ position: 'absolute', bottom: '20px', right: '20px', zIndex: 40 }}>
        <div className="zoom-capsule">
          <button 
            type="button"
            className="editor-toolbar-btn" 
            onClick={() => setScale(s => Math.max(0.1, s - 0.1))} 
            title="Zoom Out"
          >
            <Minus size={14} />
          </button>
          
          <button 
            type="button"
            className="editor-toolbar-btn" 
            style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              minWidth: '50px',
              padding: '6px 8px',
              textAlign: 'center',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-sm)'
            }} 
            onClick={resetZoomToFit}
            title="Reset Zoom to Fit Screen"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button 
            type="button"
            className="editor-toolbar-btn" 
            onClick={() => setScale(s => Math.min(1.5, s + 0.1))} 
            title="Zoom In"
          >
            <Plus size={14} />
          </button>

          <div style={{ width: '1px', background: 'var(--border-color)', height: '16px', margin: '0 4px' }}></div>

          {/* SETTINGS GEAR DROP */}
          <div className="settings-menu-container">
            <button 
              type="button"
              className={`editor-toolbar-btn ${isSettingsOpen ? 'active' : ''}`} 
              style={{ 
                padding: '6px', 
                color: isSettingsOpen ? '#0284c7' : 'var(--text-secondary)'
              }}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Editor Canvas Settings"
            >
              <Settings size={14} />
            </button>

            {isSettingsOpen && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 45 }} 
                  onClick={() => setIsSettingsOpen(false)}
                />
                <div className="settings-dropdown-menu">
                  <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '4px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                    Canvas Guides
                  </div>
                  <div className="settings-dropdown-item" onClick={() => setShowRulers(!showRulers)}>
                    <input type="checkbox" checked={showRulers} readOnly className="settings-dropdown-checkbox" />
                    <span>Show Rulers</span>
                  </div>
                  <div className="settings-dropdown-item" onClick={() => setShowBleed(!showBleed)}>
                    <input type="checkbox" checked={showBleed} readOnly className="settings-dropdown-checkbox" />
                    <span>Show Bleed Line</span>
                  </div>
                  <div className="settings-dropdown-item" onClick={() => setShowSafeZone(!showSafeZone)}>
                    <input type="checkbox" checked={showSafeZone} readOnly className="settings-dropdown-checkbox" />
                    <span>Show Safety Area</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING RIGHT-SIDE PAGE SWITCHER */}
      {isDoubleSided() && (
        <div className="thumbnail-switcher-container">
          {/* FRONT SIDE CARD */}
          <div 
            className={`thumbnail-card ${activePage === 'front' ? 'active' : ''}`}
            onClick={() => switchPage('front')}
          >
            <div className="thumbnail-preview-box">
              {/* Dynamically draw miniature elements */}
              {(() => {
                const elements = activePage === 'front' ? canvasElements : frontElements;
                return (
                  <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: canvasBg, overflow: 'hidden' }}>
                    {elements.map((el) => {
                      const xPct = `${(el.x / canvasWidth) * 100}%`;
                      const yPct = `${(el.y / canvasHeight) * 100}%`;
                      const wPct = `${(el.width / canvasWidth) * 100}%`;
                      const hPct = `${(el.height / canvasHeight) * 100}%`;
                      return (
                        <div 
                          key={el.id}
                          style={{
                            position: 'absolute',
                            left: xPct,
                            top: yPct,
                            width: wPct,
                            height: el.type === 'text' ? '1.5px' : hPct,
                            background: el.color || '#94a3b8',
                            borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : '0px',
                            opacity: 0.6
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <span className="thumbnail-label">Front</span>
          </div>

          {/* BACK SIDE CARD */}
          <div 
            className={`thumbnail-card ${activePage === 'back' ? 'active' : ''}`}
            onClick={() => switchPage('back')}
          >
            <div className="thumbnail-preview-box">
              {/* Dynamically draw miniature elements */}
              {(() => {
                const elements = activePage === 'back' ? canvasElements : backElements;
                return (
                  <div style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: canvasBg, overflow: 'hidden' }}>
                    {elements.map((el) => {
                      const xPct = `${(el.x / canvasWidth) * 100}%`;
                      const yPct = `${(el.y / canvasHeight) * 100}%`;
                      const wPct = `${(el.width / canvasWidth) * 100}%`;
                      const hPct = `${(el.height / canvasHeight) * 100}%`;
                      return (
                        <div 
                          key={el.id}
                          style={{
                            position: 'absolute',
                            left: xPct,
                            top: yPct,
                            width: wPct,
                            height: el.type === 'text' ? '1.5px' : hPct,
                            background: el.color || '#94a3b8',
                            borderRadius: el.type === 'shape' && el.shapeType === 'circle' ? '50%' : '0px',
                            opacity: 0.6
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <span className="thumbnail-label">Back</span>
          </div>
        </div>
      )}
      </div>

      {showSaveTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Save Admin Template</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>Enter a reference name for this template. It will be available for all customers configuring this product.</p>
            <input 
              type="text" 
              className="input-field" 
              value={templateName} 
              onChange={(e) => setTemplateName(e.target.value)} 
              placeholder="e.g. Elegant Gold Minimalist"
              style={{ width: '100%', marginBottom: '20px', padding: '10px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowSaveTemplateModal(false)}
                disabled={savingTemplate}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSaveAsTemplate}
                disabled={savingTemplate}
                style={{ background: '#0284c7', borderColor: '#0284c7' }}
              >
                {savingTemplate ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', fontWeight: 'bold' }}>
        <p>Loading Printear Canvas Workspace...</p>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
