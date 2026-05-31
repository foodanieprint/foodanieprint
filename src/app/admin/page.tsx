'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Shield, BarChart3, ShoppingBag, FolderPlus, Download, 
  RefreshCw, CheckCircle, Truck, Package, ArrowLeft,
  Plus, Trash2, HelpCircle, Palette, Edit, Upload, GripVertical, Settings, ArrowRight, Sliders
} from 'lucide-react';
import { getCanvasDimensions } from '@/lib/canvasUtils';

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  // Navegación mediante tabs en React
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'create-product' | 'options-attributes' | 'create-option' | 'categories' | 'create-category' | 'settings' | 'templates' | 'designer-settings'>('dashboard');

  // Firebase Storage Settings State
  const [firebaseApiKey, setFirebaseApiKey] = useState('');
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState('');
  const [firebaseProjectId, setFirebaseProjectId] = useState('');
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState('');
  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState('');
  const [firebaseAppId, setFirebaseAppId] = useState('');
  const [firebaseMeasurementId, setFirebaseMeasurementId] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Designer Settings State
  const [designerBleed, setDesignerBleed] = useState('0.25');
  const [designerDpi, setDesignerDpi] = useState('300');

  // Admin Templates State
  const [adminTemplates, setAdminTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [selectedProductSlugForTemplate, setSelectedProductSlugForTemplate] = useState('');

  const loadAdminTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setAdminTemplates(data);
      }
    } catch (err) {
      console.error('Error loading admin templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to permanently delete this template?')) return;
    try {
      const res = await fetch(`/api/templates?id=${templateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Template successfully deleted!');
        loadAdminTemplates();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete template');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend API');
    }
  };

  // Datos de Administración
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [globalOptions, setGlobalOptions] = useState<any[]>([]);
  const [loadingGlobalOptions, setLoadingGlobalOptions] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [stats, setStats] = useState({
    totalSales: 0,
    ordersCount: 0,
    customersCount: 2, // Inicializado por seed
    avgOrder: 0
  });

  // Estado del creador de producto
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdThumb, setNewProdThumb] = useState('');
  const [newProdImages, setNewProdImages] = useState<string[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Drag and Drop reordering for product specs
  const [draggedSpecIndex, setDraggedSpecIndex] = useState<number | null>(null);

  const handleUploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      const data = await res.json();
      return data.url;
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error uploading file');
      return null;
    }
  };

  const [newProdWidth, setNewProdWidth] = useState('1000');
  const [newProdHeight, setNewProdHeight] = useState('600');
  const [newProdBleed, setNewProdBleed] = useState('2.0');
  const [newProdCategoryId, setNewProdCategoryId] = useState('');
  const [selectedGlobalOptionIds, setSelectedGlobalOptionIds] = useState<string[]>([]);
  
  // Especificaciones dinámicas en creación de productos
  const [newProdSpecs, setNewProdSpecs] = useState<Array<{ id?: string; group: string; value: string; horizontal?: string; vertical?: string; priceMarkup: string; markupType: string }>>([
    { group: 'Material', value: 'Premium Matte Paper', horizontal: '0', vertical: '0', priceMarkup: '0', markupType: 'FLAT' },
    { group: 'Finish', value: 'Satin Glossy', horizontal: '0', vertical: '0', priceMarkup: '3.50', markupType: 'FLAT' }
  ]);

  // Estado del creador de Global Options & Attributes
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionDesc, setNewOptionDesc] = useState('');
  const [newOptionCategoryId, setNewOptionCategoryId] = useState('');
  const [selectedOptionCategoryIds, setSelectedOptionCategoryIds] = useState<string[]>([]);
  const [newOptionAttributes, setNewOptionAttributes] = useState<Array<{ id?: string; value: string; metric: string; horizontal: string; vertical: string; priceMarkup: string; markupType: string }>>([
    { value: '3.5x2', metric: 'in', horizontal: '3.5', vertical: '2', priceMarkup: '0', markupType: 'FLAT' },
    { value: '4x6', metric: 'in', horizontal: '4', vertical: '6', priceMarkup: '3.50', markupType: 'FLAT' }
  ]);

  // Estado del creador de Categorías
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedProductionItem, setSelectedProductionItem] = useState<any>(null); // Ver plano SVG
  const [dbStatus, setDbStatus] = useState<any>(null);

  // 1. Validar si el usuario es Administrador
  const checkAdminAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user.role === 'ADMIN') {
          setIsAdmin(true);
          loadAdminData();
        } else {
          router.push('/dashboard');
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      router.push('/dashboard');
    } finally {
      setLoadingAdmin(false);
    }
  };

  // 2. Cargar Órdenes, Productos, Global Options y calcular Estadísticas
  const loadAdminData = async () => {
    setLoadingOrders(true);
    try {
      // Cargar Estado de Base de Datos
      try {
        const resDb = await fetch('/api/db-status');
        const dbData = await resDb.json();
        setDbStatus(dbData);
      } catch (dbErr) {
        console.error('Error fetching db status:', dbErr);
        setDbStatus({ status: 'error', error: 'Could not connect to database status API' });
      }

      // Cargar Órdenes
      const resOrders = await fetch('/api/orders');
      if (resOrders.ok) {
        const ordersData = await resOrders.json();
        setOrders(ordersData);

        // Calcular Estadísticas
        let sales = 0;
        ordersData.forEach((ord: any) => {
          if (ord.status !== 'CANCELLED') sales += ord.totalAmount;
        });

        setStats({
          totalSales: sales,
          ordersCount: ordersData.length,
          customersCount: 2,
          avgOrder: ordersData.length > 0 ? (sales / ordersData.length) : 0
        });
      }

      // Cargar Productos
      const resProducts = await fetch('/api/products');
      if (resProducts.ok) {
        const prodData = await resProducts.json();
        setProducts(prodData);
      }

      // Cargar Global Options & Attributes
      loadGlobalOptionsData();

      // Cargar Categorías
      loadCategoriesData();

      // Cargar Configuración de Firebase
      loadSettingsData();

      // Cargar Plantillas de Admin
      loadAdminTemplates();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadSettingsData = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.firebase) {
          setFirebaseApiKey(data.firebase.apiKey || '');
          setFirebaseAuthDomain(data.firebase.authDomain || '');
          setFirebaseProjectId(data.firebase.projectId || '');
          setFirebaseStorageBucket(data.firebase.storageBucket || '');
          setFirebaseMessagingSenderId(data.firebase.messagingSenderId || '');
          setFirebaseAppId(data.firebase.appId || '');
          setFirebaseMeasurementId(data.firebase.measurementId || '');
        }
        if (data.designer) {
          setDesignerBleed(String(data.designer.bleed ?? '0.25'));
          setDesignerDpi(String(data.designer.dpi ?? '300'));
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const loadGlobalOptionsData = async () => {
    setLoadingGlobalOptions(true);
    try {
      const resOptions = await fetch('/api/options');
      if (resOptions.ok) {
        const data = await resOptions.json();
        setGlobalOptions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGlobalOptions(false);
    }
  };

  const loadCategoriesData = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const firebase = {
        apiKey: firebaseApiKey,
        authDomain: firebaseAuthDomain,
        projectId: firebaseProjectId,
        storageBucket: firebaseStorageBucket,
        messagingSenderId: firebaseMessagingSenderId,
        appId: firebaseAppId,
        measurementId: firebaseMeasurementId
      };

      const designer = {
        bleed: parseFloat(designerBleed) || 0.25,
        dpi: parseInt(designerDpi) || 300
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase, designer })
      });

      if (res.ok) {
        alert('General settings successfully updated in the database!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to settings API');
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const isOptionInCategory = (opt: any, catId: string) => {
    if (!catId) return true;
    if (opt.categoryIds) {
      const ids = Array.isArray(opt.categoryIds)
        ? opt.categoryIds
        : typeof opt.categoryIds === 'string'
          ? JSON.parse(opt.categoryIds)
          : [];
      return ids.includes(catId);
    }
    return opt.categoryId === catId;
  };

  // Synchronize newProdSpecs when category changes to prevent display of mismatching options
  useEffect(() => {
    if (globalOptions.length > 0 && newProdCategoryId) {
      const allowedGroups = new Set(
        globalOptions
          .filter((opt: any) => isOptionInCategory(opt, newProdCategoryId))
          .map((opt: any) => opt.name)
      );
      const filtered = newProdSpecs.filter((spec: any) => allowedGroups.has(spec.group));
      if (filtered.length !== newProdSpecs.length) {
        setNewProdSpecs(filtered);
      }
    }
  }, [newProdCategoryId, globalOptions, newProdSpecs]);

  // 3. Cambiar estado de la orden (Imprenta -> Enviado -> Entregado)
  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });

      if (res.ok) {
        // Recargar datos
        loadAdminData();
      } else {
        alert('Error updating order status');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Configurar Specs en fila para base products
  const handleAddSpecRow = () => {
    const filteredOptions = globalOptions.filter((opt: any) => !newProdCategoryId || isOptionInCategory(opt, newProdCategoryId));
    const defaultGroup = filteredOptions[0]?.name || 'Material';
    const selectedOpt = filteredOptions.find((o: any) => o.name === defaultGroup);
    let defaultValue = '';
    let defaultMarkup = '0';
    let defaultMarkupType = 'FLAT';
    let defaultHoriz = '0';
    let defaultVert = '0';
    if (selectedOpt && selectedOpt.attributes && selectedOpt.attributes.length > 0) {
      defaultValue = selectedOpt.attributes[0].value;
      defaultMarkup = String(selectedOpt.attributes[0].priceMarkup);
      defaultMarkupType = selectedOpt.attributes[0].markupType || 'FLAT';
      defaultHoriz = String(selectedOpt.attributes[0].horizontal || '0');
      defaultVert = String(selectedOpt.attributes[0].vertical || '0');
    }
    setNewProdSpecs([...newProdSpecs, { 
      group: defaultGroup, 
      value: defaultValue, 
      priceMarkup: defaultMarkup,
      markupType: defaultMarkupType,
      horizontal: defaultHoriz,
      vertical: defaultVert 
    }]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setNewProdSpecs(newProdSpecs.filter((_, i) => i !== idx));
  };

  const handleSpecRowChange = (idx: number, field: string, val: string) => {
    const updated = newProdSpecs.map((row, i) => {
      if (i === idx) {
        let newRow = { ...row, [field]: val };
        
        // When Option category (group) is changed, automatically pre-fill the first available attribute and markup from template
        if (field === 'group') {
          const selectedOpt = globalOptions.find((o: any) => o.name === val);
          if (selectedOpt && selectedOpt.attributes && selectedOpt.attributes.length > 0) {
            newRow.value = selectedOpt.attributes[0].value;
            newRow.priceMarkup = String(selectedOpt.attributes[0].priceMarkup);
            newRow.markupType = selectedOpt.attributes[0].markupType || 'FLAT';
            newRow.horizontal = String(selectedOpt.attributes[0].horizontal || '0');
            newRow.vertical = String(selectedOpt.attributes[0].vertical || '0');
          } else {
            newRow.value = '';
            newRow.priceMarkup = '0';
            newRow.markupType = 'FLAT';
            newRow.horizontal = '0';
            newRow.vertical = '0';
          }
        }
        return newRow;
      }
      return row;
    });
    setNewProdSpecs(updated);
  };

  // Specification Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSpecIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSpecIndex === null || draggedSpecIndex === index) return;
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSpecIndex === null || draggedSpecIndex === targetIndex) return;

    const list = [...newProdSpecs];
    const draggedItem = list[draggedSpecIndex];
    list.splice(draggedSpecIndex, 1);
    list.splice(targetIndex, 0, draggedItem);
    
    setNewProdSpecs(list);
    setDraggedSpecIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSpecIndex(null);
  };

  // 5. Crear o Editar un producto base
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';
      const bodyData = {
        id: editingProductId,
        name: newProdName,
        description: newProdDesc,
        basePrice: newProdPrice,
        thumbnail: newProdThumb || 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=400',
        images: newProdImages,
        widthPx: newProdWidth,
        heightPx: newProdHeight,
        bleedMm: newProdBleed,
        specs: newProdSpecs.map(spec => ({
          ...spec,
          horizontal: parseFloat(spec.horizontal || '0') || 0,
          vertical: parseFloat(spec.vertical || '0') || 0,
        })),
        globalOptionIds: selectedGlobalOptionIds,
        categoryId: newProdCategoryId || null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (res.ok) {
        if (editingProductId) {
          alert(`Product "${data.name}" successfully updated in the catalog!`);
        } else {
          alert(`Product "${data.name}" successfully created in the catalog!`);
        }
        
        // Reset campos
        setNewProdName('');
        setNewProdDesc('');
        setNewProdPrice('');
        setNewProdThumb('');
        setNewProdImages([]);
        setNewProdCategoryId('');
        setSelectedGlobalOptionIds([]);
        setNewProdSpecs([
          { group: 'Material', value: 'Premium Matte Paper', horizontal: '0', vertical: '0', priceMarkup: '0', markupType: 'FLAT' },
          { group: 'Finish', value: 'Satin Glossy', horizontal: '0', vertical: '0', priceMarkup: '3.50', markupType: 'FLAT' }
        ]);
        setEditingProductId(null);
        setActiveTab('products'); // Volver a listado

        loadAdminData(); // Recargar productos catálogo
      } else {
        alert(data.error || 'Error saving product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Activar edición de producto base
  const handleEditProductClick = (product: any) => {
    setNewProdName(product.name);
    setNewProdDesc(product.description);
    setNewProdPrice(product.basePrice.toString());
    setNewProdThumb(product.thumbnail);
    
    // Parse images safely
    const gallery = Array.isArray(product.images)
      ? product.images
      : typeof product.images === 'string'
        ? JSON.parse(product.images || '[]')
        : [];
    setNewProdImages(gallery);

    setNewProdWidth(product.widthPx.toString());
    setNewProdHeight(product.heightPx.toString());
    setNewProdBleed(product.bleedMm.toString());
    setNewProdCategoryId(product.categoryId || '');
    setSelectedGlobalOptionIds(product.globalOptionIds || []);
    
    const mappedSpecs = (product.specs || []).map((spec: any) => ({
      id: spec.id,
      group: spec.group,
      value: spec.value,
      horizontal: (spec.horizontal || 0).toString(),
      vertical: (spec.vertical || 0).toString(),
      priceMarkup: spec.priceMarkup.toString(),
      markupType: spec.markupType || 'FLAT'
    }));
    setNewProdSpecs(mappedSpecs);
    
    setEditingProductId(product.id);
    setActiveTab('create-product');
  };

  // 7. Preparar creación base product
  const handleOpenCreateClick = () => {
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice('');
    setNewProdThumb('');
    setNewProdImages([]);
    setNewProdWidth('1000');
    setNewProdHeight('600');
    setNewProdBleed('2.0');
    setNewProdCategoryId('');
    setSelectedGlobalOptionIds([]);
    setNewProdSpecs([
      { group: 'Material', value: 'Premium Matte Paper', horizontal: '0', vertical: '0', priceMarkup: '0', markupType: 'FLAT' },
      { group: 'Finish', value: 'Satin Glossy', horizontal: '0', vertical: '0', priceMarkup: '3.50', markupType: 'FLAT' }
    ]);
    setEditingProductId(null);
    setActiveTab('create-product');
  };

  // 8. Eliminar producto base
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to permanently delete this base product? All related customized client items will also be affected.')) return;
    try {
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Product successfully deleted!');
        loadAdminData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error deleting product');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with catalog database');
    }
  };

  // 9. Configurar Attributes en fila (Global Options)
  const handleAddAttributeRow = () => {
    setNewOptionAttributes([...newOptionAttributes, { value: '', metric: 'none', horizontal: '0', vertical: '0', priceMarkup: '0', markupType: 'FLAT' }]);
  };

  const handleRemoveAttributeRow = (idx: number) => {
    setNewOptionAttributes(newOptionAttributes.filter((_, i) => i !== idx));
  };

  const handleAttributeRowChange = (idx: number, field: string, val: string) => {
    const updated = newOptionAttributes.map((row, i) => {
      if (i === idx) return { ...row, [field]: val };
      return row;
    });
    setNewOptionAttributes(updated);
  };

  // 10. Crear o Editar Global Option & Attributes
  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/options';
      const method = editingOptionId ? 'PUT' : 'POST';
      const bodyData = {
        id: editingOptionId,
        name: newOptionName,
        description: newOptionDesc,
        attributes: newOptionAttributes.map(attr => ({
          ...attr,
          horizontal: parseFloat(attr.horizontal) || 0,
          vertical: parseFloat(attr.vertical) || 0,
        })),
        categoryId: selectedOptionCategoryIds[0] || null,
        categoryIds: selectedOptionCategoryIds
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (res.ok) {
        if (editingOptionId) {
          alert(`Option "${data.name}" successfully updated!`);
        } else {
          alert(`Option "${data.name}" successfully created!`);
        }
        
        // Reset campos
        setNewOptionName('');
        setNewOptionDesc('');
        setNewOptionCategoryId('');
        setSelectedOptionCategoryIds([]);
        setNewOptionAttributes([
          { value: '3.5x2', metric: 'in', horizontal: '3.5', vertical: '2', priceMarkup: '0', markupType: 'FLAT' },
          { value: '4x6', metric: 'in', horizontal: '4', vertical: '6', priceMarkup: '3.50', markupType: 'FLAT' }
        ]);
        setEditingOptionId(null);
        setActiveTab('options-attributes');

        loadGlobalOptionsData(); // Recargar datos
      } else {
        alert(data.error || 'Error saving option');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with backend catalog');
    }
  };

  // 11. Activar edición de Global Option
  const handleEditOptionClick = (option: any) => {
    setNewOptionName(option.name);
    setNewOptionDesc(option.description);
    setNewOptionCategoryId(option.categoryId || '');
    
    let catIds: string[] = [];
    if (option.categoryIds) {
      catIds = Array.isArray(option.categoryIds)
        ? option.categoryIds
        : typeof option.categoryIds === 'string'
          ? JSON.parse(option.categoryIds)
          : [];
    } else if (option.categoryId) {
      catIds = [option.categoryId];
    }
    setSelectedOptionCategoryIds(catIds);
    
    const mappedAttrs = (option.attributes || []).map((attr: any) => ({
      id: attr.id,
      value: attr.value,
      metric: attr.metric,
      horizontal: (attr.horizontal || 0).toString(),
      vertical: (attr.vertical || 0).toString(),
      priceMarkup: attr.priceMarkup.toString(),
      markupType: attr.markupType || 'FLAT'
    }));
    setNewOptionAttributes(mappedAttrs);
    
    setEditingOptionId(option.id);
    setActiveTab('create-option');
  };

  // 12. Preparar creación Global Option
  const handleOpenCreateOptionClick = () => {
    setNewOptionName('');
    setNewOptionDesc('');
    setNewOptionCategoryId('');
    setSelectedOptionCategoryIds([]);
    setNewOptionAttributes([
      { value: '3.5x2', metric: 'in', horizontal: '3.5', vertical: '2', priceMarkup: '0', markupType: 'FLAT' },
      { value: '4x6', metric: 'in', horizontal: '4', vertical: '6', priceMarkup: '3.50', markupType: 'FLAT' },
      { value: '5x7', metric: 'in', horizontal: '5', vertical: '7', priceMarkup: '5.00', markupType: 'FLAT' }
    ]);
    setEditingOptionId(null);
    setActiveTab('create-option');
  };

  // 13. Eliminar Global Option
  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this option and all its dynamic attributes?')) return;
    try {
      const res = await fetch(`/api/options?id=${optionId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Option successfully deleted!');
        loadGlobalOptionsData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error deleting option');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with catalog database');
    }
  };

  // 13b. Gestión de Categorías CRUD
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = '/api/categories';
      const method = editingCategoryId ? 'PUT' : 'POST';
      const bodyData = {
        id: editingCategoryId,
        name: newCatName,
        description: newCatDesc
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Category "${data.name}" successfully ${editingCategoryId ? 'updated' : 'created'}!`);
        setNewCatName('');
        setNewCatDesc('');
        setEditingCategoryId(null);
        setActiveTab('categories');
        loadCategoriesData();
      } else {
        alert(data.error || 'Error saving category');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with categories backend');
    }
  };

  const handleEditCategoryClick = (cat: any) => {
    setNewCatName(cat.name);
    setNewCatDesc(cat.description || '');
    setEditingCategoryId(cat.id);
    setActiveTab('create-category');
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to permanently delete this category? Linked products/options will be unlinked.')) return;
    try {
      const res = await fetch(`/api/categories?id=${catId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Category successfully deleted!');
        loadCategoriesData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error deleting category');
      }
    } catch (err) {
      console.error(err);
      alert('Error communicating with database');
    }
  };

  // 14. Descargar Plano SVG Vectorial para Producción
  const downloadProductionSVG = (item: any) => {
    if (!item.customDesign) return;
    const parsed = typeof item.customDesign.canvasData === 'string' 
      ? JSON.parse(item.customDesign.canvasData) 
      : item.customDesign.canvasData;

    const specs = typeof item.selectedSpecs === 'string' 
      ? JSON.parse(item.selectedSpecs) 
      : item.selectedSpecs || {};

    const bleed = parseFloat(designerBleed) || 0.25;
    const dpi = parseInt(designerDpi) || 300;
    const { width, height } = getCanvasDimensions(item.product, specs, bleed, dpi);

    const downloadSide = (elements: any[], suffix: string) => {
      let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background:#ffffff;">`;
      elements.forEach((el: any) => {
        if (el.type === 'text') {
          svgContent += `<text x="${el.x}" y="${el.y + el.height - 10}" font-family="${el.fontFamily || 'sans-serif'}" font-size="${el.fontSize || 16}px" fill="${el.color || '#000000'}" font-weight="${el.fontFamily === 'Outfit' ? 'bold' : 'normal'}">${el.text}</text>`;
        } else if (el.type === 'shape') {
          if (el.shapeType === 'rect') {
            svgContent += `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.color || '#000000'}" />`;
          } else if (el.shapeType === 'circle') {
            const r = el.width / 2;
            svgContent += `<circle cx="${el.x + r}" cy="${el.y + r}" r="${r}" fill="${el.color || '#000000'}" />`;
          } else if (el.shapeType === 'line') {
            svgContent += `<line x1="${el.x}" y1="${el.y}" x2="${el.x + el.width}" y2="${el.y}" stroke="${el.color || '#000000'}" stroke-width="${el.height}" />`;
          }
        } else if (el.type === 'image' && el.src) {
          svgContent += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" />`;
        }
      });
      svgContent += `</svg>`;

      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imprenta_${item.customDesign.name.replace(/\s+/g, '_')}${suffix}_plano.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    if (parsed && (parsed.front || parsed.back)) {
      if (parsed.front && parsed.front.length > 0) {
        downloadSide(parsed.front, '_front');
      }
      if (parsed.back && parsed.back.length > 0) {
        downloadSide(parsed.back, '_back');
      }
    } else if (Array.isArray(parsed)) {
      downloadSide(parsed, '');
    }
  };

  if (loadingAdmin) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-title)', fontWeight: 'bold' }}>
        <p>Loading Administration Control Panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR ADMINISTRADOR */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <Shield size={24} style={{ color: 'var(--accent-primary)' }} />
          <span>PRINTEAR ADMIN</span>
        </div>

        <ul className="admin-sidebar-menu">
          <li className={`admin-sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
              <BarChart3 size={18} /> General Overview
            </a>
          </li>
          <li className={`admin-sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('orders'); }}>
              <ShoppingBag size={18} /> Print Prep Queue
            </a>
          </li>
          <li className={`admin-sidebar-item ${activeTab === 'products' || activeTab === 'create-product' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('products'); }}>
              <Package size={18} /> Products Manager
            </a>
          </li>
          
          <li className={`admin-sidebar-item ${activeTab === 'categories' || activeTab === 'create-category' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('categories'); }}>
              <FolderPlus size={18} style={{ color: 'var(--accent-primary)' }} /> Categories Manager
            </a>
          </li>
          
          {/* Sub-opción para Atributos y Opciones */}
          <li className="mobile-hide" style={{ paddingLeft: '20px', marginTop: '16px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Specifications</span>
          </li>
          <li className={`admin-sidebar-item ${activeTab === 'options-attributes' || activeTab === 'create-option' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('options-attributes'); }}>
              <Palette size={18} style={{ color: 'var(--accent-primary)' }} /> Options & Attributes
            </a>
          </li>
          <li className={`admin-sidebar-item ${activeTab === 'templates' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('templates'); }}>
              <Palette size={18} style={{ color: 'var(--accent-primary)' }} /> Templates Manager
            </a>
          </li>

          {/* Sub-opción para Configuración General */}
          <li className="mobile-hide" style={{ paddingLeft: '20px', marginTop: '16px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>General Settings</span>
          </li>
          <li className={`admin-sidebar-item ${activeTab === 'settings' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('settings'); }}>
              <Settings size={18} style={{ color: 'var(--accent-primary)' }} /> Storage Settings
            </a>
          </li>
          <li className={`admin-sidebar-item ${activeTab === 'designer-settings' ? 'active' : ''}`}>
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('designer-settings'); }}>
              <Sliders size={18} style={{ color: 'var(--accent-primary)' }} /> Designer Settings
            </a>
          </li>
        </ul>

        <Link href="/" className="btn btn-secondary btn-sm" style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
          <ArrowLeft size={14} /> Back to Storefront
        </Link>
      </aside>

      {/* CONTENIDO DE ADMINISTRACIÓN */}
      <main className="admin-content" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        
        {/* Encabezado Principal */}
        <div className="admin-header">
          <div>
            <h1 style={{ fontSize: 'var(--h1-size)', fontFamily: 'var(--font-title)' }}>Global Administration Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Real-time management & transactional printing queue controller.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadAdminData} style={{ display: 'flex', gap: '8px' }}>
            <RefreshCw size={14} /> Sync Database State
          </button>
        </div>

        {dbStatus && dbStatus.status === 'error' && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            color: '#ef4444',
            fontSize: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.04)',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <span style={{ fontSize: '18px' }}>⚠️</span>
              <span>PostgreSQL Connection Offline (Fallback Active)</span>
            </div>
            <p style={{ margin: 0, opacity: 0.9 }}>
              The application could not establish a connection to your PostgreSQL database service. You are currently viewing <strong>local mock fallback data</strong>. Any modifications made here will only exist temporarily in local memory and will be reset upon redeploying.
            </p>
            <div style={{ fontSize: '12px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '4px', color: '#f3f4f6' }}>
              <strong>Prisma Connection Error:</strong> {dbStatus.error}
              <br />
              <strong>Target URL:</strong> {dbStatus.maskedUrl}
            </div>
          </div>
        )}

        {dbStatus && dbStatus.status === 'connected' && (
          <div style={{
            background: 'rgba(91, 147, 23, 0.08)',
            border: '1px solid rgba(91, 147, 23, 0.2)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            color: '#76b81d',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(91, 147, 23, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#76b81d', display: 'inline-block', boxShadow: '0 0 8px #76b81d' }}></span>
              <span>Connected to Live PostgreSQL Database</span>
            </div>
            <div style={{ opacity: 0.8, fontSize: '11px' }}>
              URL: {dbStatus.maskedUrl} | Products: {dbStatus.counts.products} | Users: {dbStatus.counts.users} | Options: {dbStatus.counts.options}
            </div>
          </div>
        )}

        {/* METRICAS DE VENTAS (Solo se ven en Overview) */}
        {activeTab === 'dashboard' && (
          <>
            <section className="admin-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Gross Revenue</span>
                <div className="stat-value" style={{ color: 'var(--success)' }}>${stats.totalSales.toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Orders</span>
                <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>{stats.ordersCount}</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Average Order Value</span>
                <div className="stat-value">${stats.avgOrder.toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Active Client Base</span>
                <div className="stat-value">{stats.customersCount}</div>
              </div>
            </section>

            {/* Quick Summary Section */}
            <div className="glass-card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', marginBottom: '12px' }}>Administrative Summary</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Welcome to the administration back-office console. Access active client transactions, review production SVG vectors, or configure the product catalogs using the left-hand navigation sidebar drawer panels.
              </p>
            </div>
          </>
        )}

        {/* SECCIÓN COLA DE IMPRENTA Y PEDIDOS */}
        {activeTab === 'orders' && (
          <section id="orders">
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-title)', marginBottom: '20px' }}>Prepress Printing Queue</h2>
            
            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Loading production queue...</div>
            ) : orders.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>There are currently no print orders submitted in the queue.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>Customer</th>
                      <th>Shipping Destination</th>
                      <th>Subtotal</th>
                      <th>Preflight Status</th>
                      <th>Queue Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <React.Fragment key={order.id}>
                        {/* Fila Encabezado Pedido */}
                        <tr>
                          <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{order.id.toUpperCase().substring(0, 8)}</td>
                          <td>{order.shippingName} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({order.user?.email || 'Guest'})</span></td>
                          <td>{order.shippingAddress}, {order.shippingCity}</td>
                          <td style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>${order.totalAmount.toFixed(2)}</td>
                          <td>
                            <span className={`badge badge-${order.status.toLowerCase()}`}>
                              {order.status === 'PAID' ? 'PAID' : order.status === 'PRINTING' ? 'PRINT PREPRESS' : order.status === 'SHIPPED' ? 'DISPATCHED' : order.status === 'DELIVERED' ? 'DELIVERED' : order.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {order.status === 'PAID' && (
                                <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleUpdateStatus(order.id, 'PRINTING')}>
                                  <Package size={12} /> Submit to Prepress
                                </button>
                              )}
                              {order.status === 'PRINTING' && (
                                <button className="btn btn-primary btn-sm" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}>
                                  <Truck size={12} /> Ship Printed Order
                                </button>
                              )}
                              {order.status === 'SHIPPED' && (
                                <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '11px', borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}>
                                  <CheckCircle size={12} /> Mark as Delivered
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Fila Desglose Ítems / Vector SVG Visualizador */}
                        <tr>
                          <td colSpan={6} style={{ background: 'var(--bg-primary)', padding: '12px 24px', borderBottom: '2px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <strong style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>CONFIGURED PRODUCTION ITEMS & SPECIFICATIONS:</strong>
                              {order.items.map((item: any) => {
                                const parsedSpecs = typeof item.selectedSpecs === 'string' ? JSON.parse(item.selectedSpecs) : item.selectedSpecs;
                                return (
                                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                                    <div>
                                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{item.quantity} packs - {item.customDesign?.name || item.product.name}</span>
                                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                                        {Object.entries(parsedSpecs).map(([k, v]: [string, any]) => (
                                          <span key={k} style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{k}: {v} |</span>
                                        ))}
                                      </div>
                                    </div>

                                    {item.customDesign && (
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                          className="btn btn-secondary btn-sm" 
                                          style={{ fontSize: '11px', padding: '6px 10px' }}
                                          onClick={() => setSelectedProductionItem(selectedProductionItem?.id === item.id ? null : item)}
                                        >
                                          <Palette size={12} /> {selectedProductionItem?.id === item.id ? 'Hide Visual Preflight' : 'Preflight Visual Inspector'}
                                        </button>
                                        <button 
                                          className="btn btn-primary btn-sm" 
                                          style={{ fontSize: '11px', padding: '6px 10px' }}
                                          onClick={() => downloadProductionSVG(item)}
                                        >
                                          <Download size={12} /> Download Production SVG
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* VISOR VECTORIAL SVG EN DIRECTO */}
                              {selectedProductionItem && selectedProductionItem.orderId === order.id && (
                                <div className="glass-card" style={{ padding: '24px', background: 'var(--bg-secondary)', marginTop: '12px', border: '1px solid var(--accent-primary)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '700' }}>ORIGINAL CUSTOM BLUEPRINT VECTOR (SVG) - Preflight Preview</h4>
                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: '10px' }} onClick={() => downloadProductionSVG(selectedProductionItem)}><Download size={10} /> Download Full Scale Blueprint</button>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', background: '#e5e7eb', borderRadius: 'var(--radius-sm)', overflow: 'auto' }}>
                                    {/* RENDER DYNAMIC SVG PREVIEW */}
                                    {(() => {
                                      const specs = typeof selectedProductionItem.selectedSpecs === 'string' 
                                        ? JSON.parse(selectedProductionItem.selectedSpecs) 
                                        : selectedProductionItem.selectedSpecs || {};
                                      const bleed = parseFloat(designerBleed) || 0.25;
                                      const dpi = parseInt(designerDpi) || 300;
                                      const { width: dynW, height: dynH } = getCanvasDimensions(selectedProductionItem.product, specs, bleed, dpi);
                                      
                                      const parsedCanvas = typeof selectedProductionItem.customDesign.canvasData === 'string' 
                                        ? JSON.parse(selectedProductionItem.customDesign.canvasData) 
                                        : selectedProductionItem.customDesign.canvasData;
                                      
                                      const elementsToRender = Array.isArray(parsedCanvas) 
                                        ? parsedCanvas 
                                        : (parsedCanvas?.front || parsedCanvas?.back || []);

                                      return (
                                        <svg 
                                          width={Math.min(500, dynW)} 
                                          height={Math.min(300, dynH)} 
                                          viewBox={`0 0 ${dynW} ${dynH}`}
                                          style={{ background: '#ffffff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                                        >
                                          {elementsToRender.map((el: any) => (
                                            <React.Fragment key={el.id}>
                                              {el.type === 'text' && (
                                                <text 
                                                  x={el.x} 
                                                  y={el.y + el.height - 10} 
                                                  fontFamily={el.fontFamily || 'sans-serif'} 
                                                  fontSize={`${el.fontSize || 16}px`} 
                                                  fill={el.color || '#000000'}
                                                  fontWeight={el.fontFamily === 'Outfit' ? 'bold' : 'normal'}
                                                >
                                                  {el.text}
                                                </text>
                                              )}
                                              {el.type === 'shape' && el.shapeType === 'rect' && (
                                                <rect x={el.x} y={el.y} width={el.width} height={el.height} fill={el.color || '#000000'} />
                                              )}
                                              {el.type === 'shape' && el.shapeType === 'circle' && (
                                                <circle cx={el.x + (el.width/2)} cy={el.y + (el.width/2)} r={el.width/2} fill={el.color || '#000000'} />
                                              )}
                                              {el.type === 'shape' && el.shapeType === 'line' && (
                                                <line x1={el.x} y1={el.y} x2={el.x + el.width} y2={el.y} stroke={el.color || '#000000'} strokeWidth={el.height} />
                                              )}
                                              {el.type === 'image' && el.src && (
                                                <image href={el.src} x={el.x} y={el.y} width={el.width} height={el.height} />
                                              )}
                                            </React.Fragment>
                                          ))}
                                        </svg>
                                      );
                                    })()}
                                  </div>
                                </div>
                              )}

                            </div>
                          </td>
                        </tr>

                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN PRODUCTS MANAGER (Catálogo de Productos) */}
        {activeTab === 'products' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-title)', marginBottom: '4px' }}>Base Products Catalog</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Create, update, or remove base products for customers to customize in their editor workspace.</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenCreateClick} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Plus size={16} /> Create New Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No base products currently configured in your database.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {products.map((product) => (
                  <div key={product.id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Thumbnail */}
                    <div style={{ height: '160px', width: '100%', position: 'relative', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                      <img 
                        src={product.thumbnail} 
                        alt={product.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--accent-primary)', color: '#ffffff', fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                        ${product.basePrice.toFixed(2)}
                      </span>
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h4 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
                        {product.name}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px', flex: 1 }}>
                        {product.description.length > 95 ? `${product.description.substring(0, 95)}...` : product.description}
                      </p>

                      {/* Workspace Specifications */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px', background: 'var(--bg-primary)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '11px' }}>
                        <span style={{ color: 'var(--text-muted)' }}><strong>Canvas:</strong> {product.widthPx}x{product.heightPx}px</span>
                        <span style={{ color: 'var(--text-muted)' }}><strong>Bleed:</strong> {product.bleedMm}mm</span>
                        <span style={{ color: 'var(--text-muted)' }}><strong>Specs:</strong> {product.specs?.length || 0} options</span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ flex: 1, padding: '8px 12px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}
                          onClick={() => handleEditProductClick(product)}
                        >
                          <Edit size={12} /> Edit Details
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '8px' }}
                          onClick={() => handleDeleteProduct(product.id)}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN CREAR / EDITAR PRODUCTO */}
        {activeTab === 'create-product' && (
          <section className="glass-card responsive-card-padding">
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={22} style={{ color: 'var(--accent-primary)' }} />
              {editingProductId ? `Edit Base Product Details` : `Add New Configurable Base Products`}
            </h2>

            <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Product Display Name</label>
                  <input type="text" required className="input-field" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="e.g. Corporate Business Flyers" />
                </div>
                <div className="form-group">
                  <label className="form-label">Catalog Base Price ($)</label>
                  <input type="number" required step="0.01" className="input-field" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="e.g. 19.99" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Product Specifications & Features</label>
                <textarea 
                  required 
                  className="input-field" 
                  style={{ height: '80px', resize: 'vertical' }}
                  value={newProdDesc} 
                  onChange={(e) => setNewProdDesc(e.target.value)} 
                  placeholder="Explain the paper density, texture options, color fidelity, prepress guides, and coating finishes..."
                />
              </div>

              {/* IMAGE MANAGEMENT SECTION */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700', marginBottom: '4px' }}>Product Images & Gallery</h4>
                
                <div className="form-grid-2">
                  {/* Main Image Thumbnail */}
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Main Display Image (Thumbnail URL or Upload)</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={newProdThumb} 
                        onChange={(e) => setNewProdThumb(e.target.value)} 
                        placeholder="https://images.unsplash.com/photo-... or upload file" 
                      />
                      
                      <input 
                        type="file" 
                        id="main-image-upload" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingMain(true);
                            const url = await handleUploadFile(file);
                            if (url) {
                              setNewProdThumb(url);
                            }
                            setUploadingMain(false);
                          }
                        }} 
                      />
                      
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        disabled={uploadingMain}
                        onClick={() => document.getElementById('main-image-upload')?.click()}
                      >
                        {uploadingMain ? 'Uploading...' : <><Upload size={14} /> Upload</>}
                      </button>

                      {newProdThumb && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '10px 14px', flexShrink: 0 }}
                          onClick={() => {
                            if (!newProdImages.includes(newProdThumb)) {
                              setNewProdImages([...newProdImages, newProdThumb]);
                            } else {
                              alert('Image is already in the gallery!');
                            }
                          }}
                          title="Add this main image to the thumbnail gallery carousel below"
                        >
                          + Add to Gallery
                        </button>
                      )}
                    </div>
                    {newProdThumb && ( 
                      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={newProdThumb} alt="Main Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Main catalog display preview</span>
                      </div>
                    )}
                  </div>

                  {/* Add New Gallery Image URL */}
                  <div className="form-group" style={{ marginBottom: '0' }}>
                    <label className="form-label">Add Gallery Image to Carousel</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        id="new-gallery-url"
                        className="input-field" 
                        placeholder="Paste image URL or upload..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = document.getElementById('new-gallery-url') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const val = input.value.trim();
                              if (!newProdImages.includes(val)) {
                                setNewProdImages([...newProdImages, val]);
                                input.value = '';
                              } else {
                                alert('Image is already in the gallery!');
                              }
                            }
                          }
                        }}
                      />

                      <input 
                        type="file" 
                        id="gallery-image-upload" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadingGallery(true);
                            const url = await handleUploadFile(file);
                            if (url) {
                              if (!newProdImages.includes(url)) {
                                setNewProdImages([...newProdImages, url]);
                              } else {
                                alert('Image is already in the gallery!');
                              }
                            }
                            setUploadingGallery(false);
                          }
                        }} 
                      />

                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
                        disabled={uploadingGallery}
                        onClick={() => document.getElementById('gallery-image-upload')?.click()}
                      >
                        {uploadingGallery ? 'Uploading...' : <><Upload size={14} /> Upload</>}
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '10px 18px', flexShrink: 0 }}
                        onClick={() => {
                          const input = document.getElementById('new-gallery-url') as HTMLInputElement;
                          if (input && input.value.trim()) {
                            const val = input.value.trim();
                            if (!newProdImages.includes(val)) {
                              setNewProdImages([...newProdImages, val]);
                              input.value = '';
                            } else { 
                              alert('Image is already in the gallery!');
                            }
                          } else {
                            alert('Please paste an image URL or upload a file first.');
                          }
                        }}
                      >
                        + Add
                      </button>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Press Enter/click Add to paste a URL, or click Upload to choose a local image file.
                    </span>
                  </div>
                </div>

                {/* Gallery Carousel List */}
                <div>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Active Thumbnail Carousel Gallery ({newProdImages.length} images)</label>
                  {newProdImages.length === 0 ? (
                    <div style={{ 
                      padding: '24px', 
                      background: 'var(--bg-primary)', 
                      borderRadius: '12px', 
                      textAlign: 'center', 
                      border: '2px dashed var(--border-color)', 
                      fontSize: '13px', 
                      color: 'var(--text-muted)' 
                    }}>
                      No carousel images added yet. The product page will fall back to using the Main Display Image.
                    </div>
                  ) : (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                      gap: '16px',
                      background: 'var(--bg-primary)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {newProdImages.map((url, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            position: 'relative', 
                            height: '90px', 
                            borderRadius: '8px', 
                            overflow: 'hidden', 
                            border: '1px solid var(--border-color)',
                            background: '#ffffff',
                            boxShadow: 'var(--shadow-sm)'
                          }}
                        >
                          <img src={url} alt={`Gallery index ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {/* Image Number Label */}
                          <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                            #{idx + 1}
                          </div>
                          {/* Quick Set As Thumbnail Button */}
                          {newProdThumb !== url && (
                            <button
                              type="button"
                              onClick={() => setNewProdThumb(url)}
                              style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '4px',
                                background: 'rgba(0,111,66,0.9)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '9px',
                                padding: '2px 4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                              }}
                              title="Set this image as the main catalog thumbnail display"
                            >
                              Set Main
                            </button>
                          )}
                          {newProdThumb === url && (
                            <div style={{ position: 'absolute', top: '4px', left: '4px', background: 'var(--accent-primary)', color: '#fff', fontSize: '8px', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              Main
                            </div>
                          )}
                          {/* Delete from Gallery Button */}
                          <button
                            type="button"
                            onClick={() => setNewProdImages(newProdImages.filter((_, i) => i !== idx))}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(217, 83, 79, 0.9)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center', 
                              justifyContent: 'center',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Remove image from carousel gallery"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Category</label>
                <select 
                  className="input-field" 
                  value={newProdCategoryId} 
                  onChange={(e) => setNewProdCategoryId(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '12px' }}
                >
                  <option value="">-- No Category (Unlinked) --</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Canvas y Margen */}
              <div className="form-grid-3" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Recommended Workspace Width (px)</label>
                  <input type="number" required className="input-field" value={newProdWidth} onChange={(e) => setNewProdWidth(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Recommended Workspace Height (px)</label>
                  <input type="number" required className="input-field" value={newProdHeight} onChange={(e) => setNewProdHeight(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Mechanical Bleed Line Margin (mm)</label>
                  <input type="number" step="0.1" required className="input-field" value={newProdBleed} onChange={(e) => setNewProdBleed(e.target.value)} />
                </div>
              </div>

              {/* Configurar Variantes / Specs */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>Configurable Dynamic Attributes & Options</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddSpecRow} style={{ padding: '6px 12px' }}>
                    <Plus size={12} /> Add Specification Choice
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {newProdSpecs.map((row, idx) => (
                    <div 
                      key={idx} 
                      className="spec-drag-row"
                      draggable
                      onDragStart={(e) => handleDragStart(e, idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={(e) => handleDrop(e, idx)}
                      onDragEnd={handleDragEnd}
                      style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'center',
                        opacity: draggedSpecIndex === idx ? 0.5 : 1,
                        border: draggedSpecIndex === idx ? '1px dashed var(--accent-primary)' : '1px solid transparent',
                        backgroundColor: draggedSpecIndex === idx ? 'var(--bg-primary)' : 'transparent',
                      }}
                    >
                      {/* Drag Handle */}
                      <div 
                        className="spec-drag-handle"
                        title="Drag to reorder attribute position"
                      >
                        <GripVertical size={16} />
                      </div>
                      <select 
                        className="input-field" 
                        style={{ flex: 1, padding: '8px' }} 
                        value={row.group} 
                        onChange={(e) => handleSpecRowChange(idx, 'group', e.target.value)}
                      >
                        {/* Dynamic Global Options mapping filtered by product category */}
                        {globalOptions
                          .filter((opt: any) => !newProdCategoryId || isOptionInCategory(opt, newProdCategoryId))
                          .map((opt: any) => (
                            <option key={opt.id} value={opt.name}>{opt.name}</option>
                          ))}
                        
                        {/* Fallback items if no custom global options exist yet */}
                        {globalOptions.length === 0 && (
                          <>
                            <option value="Material">Material Density (e.g. Paper / Fabric)</option>
                            <option value="Finish">Finish Coating (e.g. Glossy / Spot UV)</option>
                            <option value="Size">Size Option (e.g. Small / Large)</option>
                            <option value="Color">Base Ink Color</option>
                            <option value="Quantity">Package Quantity Tier</option>
                          </>
                        )}
                      </select>

                      {(() => {
                        const selectedOpt = globalOptions.find((o: any) => o.name === row.group);
                        const hasAttributes = selectedOpt && selectedOpt.attributes && selectedOpt.attributes.length > 0;
                        
                        if (hasAttributes) {
                          return (
                            <select 
                              className="input-field" 
                              style={{ flex: 1.5, padding: '8px' }} 
                              value={row.value} 
                              onChange={(e) => {
                                const val = e.target.value;
                                const matchedAttr = selectedOpt.attributes.find((a: any) => a.value === val);
                                const markup = matchedAttr ? String(matchedAttr.priceMarkup) : '0';
                                const horiz = matchedAttr ? String(matchedAttr.horizontal || '0') : '0';
                                const vert = matchedAttr ? String(matchedAttr.vertical || '0') : '0';
                                
                                const updated = newProdSpecs.map((r, i) => {
                                  if (i === idx) return { 
                                    ...r, 
                                    value: val, 
                                    priceMarkup: markup,
                                    horizontal: horiz,
                                    vertical: vert 
                                  };
                                  return r;
                                });
                                setNewProdSpecs(updated);
                              }}
                            >
                              <option value="">-- Select Attribute Template --</option>
                              {selectedOpt.attributes.map((attr: any) => (
                                <option key={attr.id} value={attr.value}>
                                  {attr.value} {attr.metric ? `(${attr.metric})` : ''}
                                </option>
                              ))}
                              
                              {/* Fallback for pre-saved custom or deleted options to ensure data is never lost */}
                              {row.value && !selectedOpt.attributes.some((a: any) => a.value === row.value) && (
                                <option value={row.value}>{row.value} (Custom Overridden Value)</option>
                              )}
                            </select>
                          );
                        } else {
                          return (
                            <input 
                              type="text" 
                              required 
                              className="input-field" 
                              style={{ flex: 1.5, padding: '8px' }} 
                              value={row.value} 
                              onChange={(e) => handleSpecRowChange(idx, 'value', e.target.value)} 
                              placeholder="e.g. Premium Linen 350gsm, 100 Packs, Spot UV..."
                            />
                          );
                        }
                      })()}

                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        className="input-field" 
                        style={{ flex: 0.8, padding: '8px' }} 
                        value={row.priceMarkup} 
                        onChange={(e) => handleSpecRowChange(idx, 'priceMarkup', e.target.value)} 
                        placeholder="Markup"
                      />

                      <select
                        className="input-field"
                        style={{ flex: 0.8, padding: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                        value={row.markupType || 'FLAT'}
                        onChange={(e) => handleSpecRowChange(idx, 'markupType', e.target.value)}
                      >
                        <option value="FLAT">Flat ($)</option>
                        <option value="PERCENTAGE">Percent (%)</option>
                      </select>

                      <button 
                        type="button" 
                        onClick={() => handleRemoveSpecRow(idx)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', padding: '8px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>



              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => setActiveTab('products')}>
                  Cancel & Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px' }}>
                  {editingProductId ? 'Save & Update Product' : 'Publish New Product to Catalog'}
                </button>
              </div>

            </form>
          </section>
        )}

        {/* SECCIÓN GLOBAL OPTIONS & ATTRIBUTES */}
        {activeTab === 'options-attributes' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-title)', marginBottom: '4px' }}>Global Options & Attributes</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Define reusable dimensions, cardstock densities, ink counts, or finishing types for catalog configurations.</p>
              </div>
              <button className="btn btn-primary" onClick={handleOpenCreateOptionClick} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Plus size={16} /> Create Custom Option
              </button>
            </div>

            {loadingGlobalOptions ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Syncing attribute tables...</div>
            ) : globalOptions.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No global customizable specifications currently defined.</p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={handleOpenCreateOptionClick}>Create First Option</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {globalOptions.map((option) => (
                  <div key={option.id} className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-title)', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Palette size={18} style={{ color: 'var(--accent-primary)' }} />
                          {option.name}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{option.description}</p>
                        
                        {/* Display linked category names */}
                        {(() => {
                          let optionCatIds: string[] = [];
                          if (option.categoryIds) {
                            optionCatIds = Array.isArray(option.categoryIds)
                              ? option.categoryIds
                              : typeof option.categoryIds === 'string'
                                ? JSON.parse(option.categoryIds)
                                : [];
                          } else if (option.categoryId) {
                            optionCatIds = [option.categoryId];
                          }

                          if (optionCatIds.length > 0) {
                            const linkedCatNames = optionCatIds
                              .map(id => categories.find(c => c.id === id)?.name)
                              .filter(Boolean);
                            
                            if (linkedCatNames.length > 0) {
                              return (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                                  {linkedCatNames.map((name, cIdx) => (
                                    <span 
                                      key={cIdx} 
                                      style={{ 
                                        fontSize: '11px', 
                                        fontWeight: '600', 
                                        color: 'var(--accent-primary)', 
                                        background: 'rgba(0, 150, 136, 0.08)', 
                                        border: '1px solid rgba(0, 150, 136, 0.2)', 
                                        padding: '2px 8px', 
                                        borderRadius: 'var(--radius-full)' 
                                      }}
                                    >
                                      {name}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                          }
                          return (
                            <div style={{ marginTop: '10px' }}>
                              <span 
                                style={{ 
                                  fontSize: '11px', 
                                  fontWeight: '600', 
                                  color: 'var(--text-muted)', 
                                  background: 'var(--bg-secondary)', 
                                  border: '1px solid var(--border-color)', 
                                  padding: '2px 8px', 
                                  borderRadius: 'var(--radius-full)' 
                                }}
                              >
                                Universal Option
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }} onClick={() => handleEditOptionClick(option)}>
                          <Edit size={12} /> Edit Config
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '6px 12px' }} onClick={() => handleDeleteOption(option.id)}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>

                    {/* Attributes Grid List */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                      {option.attributes?.length === 0 ? (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No dynamic attributes assigned.</span>
                      ) : (
                        option.attributes?.map((attr: any) => (
                          <div key={attr.id} style={{ padding: '14px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{attr.value}</span>
                            {attr.horizontal > 0 && attr.vertical > 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                Dimensions: {attr.horizontal} &times; {attr.vertical} {attr.metric}
                              </span>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px' }}>
                              <span style={{ color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', textTransform: 'lowercase' }}>{attr.metric || 'unit'}</span>
                              <span style={{ fontWeight: 'bold', color: attr.priceMarkup > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                                {attr.priceMarkup > 0 
                                  ? (attr.markupType === 'PERCENTAGE' 
                                      ? `+${attr.priceMarkup}%` 
                                      : `+$${attr.priceMarkup.toFixed(2)}`) 
                                  : 'Base Price'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN CREAR / EDITAR GLOBAL OPTION */}
        {activeTab === 'create-option' && (
          <section className="glass-card responsive-card-padding">
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Palette size={22} style={{ color: 'var(--accent-primary)' }} />
              {editingOptionId ? `Edit Option Configuration` : `Create Reusable Global Option`}
            </h2>

            <form onSubmit={handleCreateOption} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Option Name (e.g. Size, Cardstock)</label>
                  <input type="text" required className="input-field" value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)} placeholder="e.g. Size" />
                </div>
                <div className="form-group">
                  <label className="form-label">Brief Description / Customer Tooltip</label>
                  <input type="text" required className="input-field" value={newOptionDesc} onChange={(e) => setNewOptionDesc(e.target.value)} placeholder="Explain the dynamic choices or finishing attributes to the client..." />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 1' }}>
                  <label className="form-label">Category Filter (Optional - Select Multiple)</label>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '10px', 
                    padding: '12px', 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: 'var(--radius-sm)',
                    maxHeight: '120px',
                    overflowY: 'auto'
                  }}>
                    {categories.map((cat: any) => {
                      const isChecked = selectedOptionCategoryIds.includes(cat.id);
                      return (
                        <label 
                          key={cat.id} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px', 
                            fontSize: '13px', 
                            color: 'var(--text-primary)', 
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOptionCategoryIds([...selectedOptionCategoryIds, cat.id]);
                              } else {
                                setSelectedOptionCategoryIds(selectedOptionCategoryIds.filter(id => id !== cat.id));
                              }
                            }}
                            style={{ 
                              accentColor: 'var(--accent-primary)',
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer'
                            }}
                          />
                          <span>{cat.name}</span>
                        </label>
                      );
                    })}
                    {categories.length === 0 && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No categories registered.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Configurar Dynamic Attributes List */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '700' }}>Dynamic Option Attributes Matrix</h4>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddAttributeRow} style={{ padding: '6px 12px' }}>
                    <Plus size={12} /> Add Attribute Value
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '12px', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    <div style={{ flex: 1.5 }}>Label</div>
                    <div style={{ flex: 1 }}>Unit of Measurement</div>
                    <div style={{ flex: 0.8 }}>Horizontal</div>
                    <div style={{ flex: 0.8 }}>Vertical</div>
                    <div style={{ flex: 0.8 }}>Price Markup</div>
                    <div style={{ width: '32px' }}></div>
                  </div>
                  {newOptionAttributes.map((row, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ flex: 1.5 }}>
                        <input 
                          type="text" 
                          required 
                          className="input-field" 
                          style={{ padding: '8px' }} 
                          value={row.value} 
                          onChange={(e) => handleAttributeRowChange(idx, 'value', e.target.value)} 
                          placeholder="Label (e.g. 2x2, Matte)"
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <select 
                          className="input-field" 
                          style={{ padding: '8px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }} 
                          value={row.metric} 
                          onChange={(e) => handleAttributeRowChange(idx, 'metric', e.target.value)}
                        >
                          <option value="none">None</option>
                          <option value="in">in</option>
                          <option value="cm">cm</option>
                          <option value="px">px</option>
                        </select>
                      </div>

                      <div style={{ flex: 0.8 }}>
                        <input 
                          type="number" 
                          step="0.01" 
                          required 
                          className="input-field" 
                          style={{ padding: '8px' }} 
                          value={row.horizontal} 
                          onChange={(e) => handleAttributeRowChange(idx, 'horizontal', e.target.value)} 
                          placeholder="Horiz."
                        />
                      </div>

                      <div style={{ flex: 0.8 }}>
                        <input 
                          type="number" 
                          step="0.01" 
                          required 
                          className="input-field" 
                          style={{ padding: '8px' }} 
                          value={row.vertical} 
                          onChange={(e) => handleAttributeRowChange(idx, 'vertical', e.target.value)} 
                          placeholder="Vert."
                        />
                      </div>

                      <div style={{ flex: 0.8 }}>
                        <input 
                          type="number" 
                          step="0.01" 
                          required 
                          className="input-field" 
                          style={{ padding: '8px' }} 
                          value={row.priceMarkup} 
                          onChange={(e) => handleAttributeRowChange(idx, 'priceMarkup', e.target.value)} 
                          placeholder="Markup"
                        />
                      </div>

                      <div style={{ flex: 0.8 }}>
                        <select
                          className="input-field"
                          style={{ padding: '8px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
                          value={row.markupType || 'FLAT'}
                          onChange={(e) => handleAttributeRowChange(idx, 'markupType', e.target.value)}
                        >
                          <option value="FLAT">Flat ($)</option>
                          <option value="PERCENTAGE">Percent (%)</option>
                        </select>
                      </div>

                      <button 
                        type="button" 
                        onClick={() => handleRemoveAttributeRow(idx)}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', padding: '8px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => setActiveTab('options-attributes')}>
                  Cancel & Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px' }}>
                  {editingOptionId ? 'Save & Update Option' : 'Publish Reusable Option'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SECCIÓN CATEGORIES MANAGER */}
        {activeTab === 'categories' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontFamily: 'var(--font-title)', marginBottom: '4px' }}>Categories Manager</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Manage product types and categorize global options for automatic inheritance.</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setNewCatName(''); setNewCatDesc(''); setEditingCategoryId(null); setActiveTab('create-category'); }} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Plus size={16} /> Create New Category
              </button>
            </div>

            {loadingCategories ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No categories configured yet.</p>
                <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => { setNewCatName(''); setNewCatDesc(''); setEditingCategoryId(null); setActiveTab('create-category'); }}>Create First Category</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {categories.map((cat) => (
                  <div key={cat.id} className="glass-card" style={{ padding: '24px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
                      <div>
                        <h4 style={{ fontSize: '16px', fontFamily: 'var(--font-title)', fontWeight: 'bold', color: 'var(--text-primary)' }}>{cat.name}</h4>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>/{cat.slug}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px' }} onClick={() => handleEditCategoryClick(cat)} title="Edit Category">
                          <Edit size={12} />
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ padding: '6px', borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }} onClick={() => handleDeleteCategory(cat.id)} title="Delete Category">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', flex: 1 }}>{cat.description || 'No description provided.'}</p>
                    
                    {/* Stats or linked items info */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', background: 'var(--bg-primary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: '11px', border: '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <strong>Products:</strong> {products.filter(p => p.categoryId === cat.id).length} linked
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>|</span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        <strong>Options:</strong> {globalOptions.filter(o => o.categoryId === cat.id).length} active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECCIÓN CREAR / EDITAR CATEGORÍA */}
        {activeTab === 'create-category' && (
          <section className="glass-card responsive-card-padding">
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={22} style={{ color: 'var(--accent-primary)' }} />
              {editingCategoryId ? 'Edit Category Specifications' : 'Create New Category'}
            </h2>

            <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input type="text" required className="input-field" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="e.g. Business Cards" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="input-field" 
                  style={{ height: '80px', resize: 'vertical' }}
                  value={newCatDesc} 
                  onChange={(e) => setNewCatDesc(e.target.value)} 
                  placeholder="Explain the type of products in this category..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => setActiveTab('categories')}>
                  Cancel & Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px' }}>
                  {editingCategoryId ? 'Update Category' : 'Publish Category'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SECCIÓN STORAGE SETTINGS */}
        {activeTab === 'settings' && (
          <section className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={22} style={{ color: 'var(--accent-primary)' }} />
              Storage Configuration Settings
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              Enter your Firebase storage credentials below to enable permanent, secure file uploads. These credentials will be stored securely in the database and loaded dynamically by the upload engine, bypassing the need for local .env files.
            </p>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">Firebase API Key (apiKey)</label>
                <input 
                  type="password" 
                  required 
                  className="input-field" 
                  value={firebaseApiKey} 
                  onChange={(e) => setFirebaseApiKey(e.target.value)} 
                  placeholder="AIzaSy..." 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Auth Domain (authDomain)</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    value={firebaseAuthDomain} 
                    onChange={(e) => setFirebaseAuthDomain(e.target.value)} 
                    placeholder="project-id.firebaseapp.com" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Project ID (projectId)</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    value={firebaseProjectId} 
                    onChange={(e) => setFirebaseProjectId(e.target.value)} 
                    placeholder="project-id" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Storage Bucket (storageBucket)</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    value={firebaseStorageBucket} 
                    onChange={(e) => setFirebaseStorageBucket(e.target.value)} 
                    placeholder="project-id.appspot.com" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Messaging Sender ID</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    value={firebaseMessagingSenderId} 
                    onChange={(e) => setFirebaseMessagingSenderId(e.target.value)} 
                    placeholder="e.g. 123456789012" 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '8px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Application ID (appId)</label>
                  <input 
                    type="text" 
                    required 
                    className="input-field" 
                    value={firebaseAppId} 
                    onChange={(e) => setFirebaseAppId(e.target.value)} 
                    placeholder="1:123456789012:web:abcd1234efgh" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Measurement ID (measurementId - Optional)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={firebaseMeasurementId} 
                    onChange={(e) => setFirebaseMeasurementId(e.target.value)} 
                    placeholder="G-XXXXXXXXXX" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => setActiveTab('dashboard')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px' }} disabled={savingSettings}>
                  {savingSettings ? 'Saving Configuration...' : 'Save Storage Configuration'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SECCIÓN DESIGNER SETTINGS */}
        {activeTab === 'designer-settings' && (
          <section className="glass-card" style={{ padding: '32px' }}>
            <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-title)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={22} style={{ color: 'var(--accent-primary)' }} />
              Designer Configuration Settings
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
              Configure editor workspace settings. Define the bleed margins (in inches) to expand the interactive designer canvas and final high-resolution export dimensions. Set the DPI resolution for calculations.
            </p>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Canvas Bleed Margin (inches)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="input-field" 
                    value={designerBleed} 
                    onChange={(e) => setDesignerBleed(e.target.value)} 
                    placeholder="e.g. 0.25" 
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0' }}>
                  <label className="form-label">Export Resolution DPI</label>
                  <input 
                    type="number" 
                    required 
                    className="input-field" 
                    value={designerDpi} 
                    onChange={(e) => setDesignerDpi(e.target.value)} 
                    placeholder="e.g. 300" 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '14px' }} onClick={() => setActiveTab('dashboard')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '14px' }} disabled={savingSettings}>
                  {savingSettings ? 'Saving Configuration...' : 'Save Designer Settings'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SECCIÓN TEMPLATES MANAGER */}
        {activeTab === 'templates' && (
          <section className="glass-card" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '22px', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Palette size={22} style={{ color: 'var(--accent-primary)' }} />
                  Templates Manager
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>View and delete design templates created by administrators for customized product configurations.</p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (products.length > 0) {
                    setSelectedProductSlugForTemplate(products[0].slug);
                  }
                  setShowCreateTemplateModal(true);
                }} 
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <Plus size={16} /> Create Template
              </button>
            </div>

            {loadingTemplates ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>Loading templates...</div>
            ) : adminTemplates.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>No custom templates saved yet. Design templates inside the Canvas Editor and click "Save as Admin Template" to see them here.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Template Name</th>
                      <th>Product Base</th>
                      <th>Created At</th>
                      <th>Preview</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminTemplates.map((template) => (
                      <tr key={template.id}>
                        <td style={{ fontWeight: 'bold' }}>
                          <div>{template.name}</div>
                          {template.targetSpecs && (
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 'normal', marginTop: '4px' }}>
                              {Object.entries(
                                typeof template.targetSpecs === 'string' ? JSON.parse(template.targetSpecs) : template.targetSpecs
                              ).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </div>
                          )}
                        </td>
                        <td>{template.product?.name || 'Unknown Product'} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({template.product?.slug})</span></td>
                        <td>{new Date(template.createdAt).toLocaleDateString()}</td>
                        <td>
                          {template.previewUrl ? (
                            <img src={template.previewUrl} alt={template.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No Preview</span>
                          )}
                        </td>
                        <td style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <a 
                            href={`/editor?product=${template.product?.slug || ''}&template=${template.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', background: 'rgba(0, 102, 204, 0.05)', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                          >
                            <Edit size={12} style={{ marginRight: '4px' }} /> Edit
                          </a>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)', padding: '6px 12px', cursor: 'pointer' }} 
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 size={12} style={{ marginRight: '4px', display: 'inline' }} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* MODAL CREAR TEMPLATE (SELECCIÓN DE PRODUCTO BASE) */}
            {showCreateTemplateModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                <div className="glass-card" style={{ background: '#ffffff', padding: '32px', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-title)', fontWeight: 'bold', margin: '0 0 12px 0', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Palette size={20} style={{ color: 'var(--accent-primary)' }} /> Create New Template
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px 0', lineHeight: '1.5' }}>
                    Design templates visually using the Canvas Editor. Choose a base product catalog entry to launch the designer in a new workspace window.
                  </p>
                  
                  <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label" style={{ fontWeight: 'bold', color: '#374151', fontSize: '12px' }}>Select Base Product</label>
                    <select
                      className="input-field"
                      style={{ padding: '12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', fontSize: '14px' }}
                      value={selectedProductSlugForTemplate}
                      onChange={(e) => setSelectedProductSlugForTemplate(e.target.value)}
                    >
                      {products.map((prod) => (
                        <option key={prod.id} value={prod.slug}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      style={{ padding: '10px 18px', cursor: 'pointer' }}
                      onClick={() => setShowCreateTemplateModal(false)}
                    >
                      Cancel
                    </button>
                    <a 
                      href={`/editor?product=${selectedProductSlugForTemplate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', cursor: 'pointer' }}
                      onClick={() => setShowCreateTemplateModal(false)}
                    >
                      Launch Designer <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

      </main>
    </div>
  );
}
