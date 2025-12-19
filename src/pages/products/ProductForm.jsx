// src/pages/products/ProductForm.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Save,
  X,
  Upload,
  Barcode,
  Tag,
  DollarSign,
  Package,
  Ruler,
  Weight,
  AlertCircle,
  Image as ImageIcon,
  Trash2,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useCurrentBranch } from '../../store/slices/authSlice';
import * as productsApi from '../../services/api/products.api';
import * as advancedApi from '../../services/api/products.advanced.api';

const UNITS = [
  { value: 'un', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'l', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'm', label: 'Metro' },
  { value: 'pack', label: 'Paquete' },
  { value: 'caja', label: 'Caja' },
];

const IVA_RATES = [
  { value: 0, label: '0% - Exento' },
  { value: 10.5, label: '10.5%' },
  { value: 21, label: '21% (General)' },
  { value: 27, label: '27%' },
];

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const currentBranch = useCurrentBranch();
  const isEditing = !!id;

  // Estados
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'pricing', 'stock', 'dimensions', 'images'

  // Formulario
  const [formData, setFormData] = useState({
    // Identificación
    code: '',
    barcode: '',
    name: '',
    description: '',
    
    // Clasificación
    category_id: '',
    brand_id: '',
    supplier_id: '',
    subfamily: '',
    type: '',
    
    // Precios
    price: '',
    cost: '',
    iva_rate: 21,
    unit: 'un',
    
    // Stock
    stock: 0,
    min_stock: 10,
    max_stock: '',
    reorder_point: 10,
    optimal_stock: '',
    
    // Dimensiones
    weight: '',
    height: '',
    width: '',
    depth: '',
    
    // Características
    is_service: false,
    discounts_stock: true,
    is_giftcard: false,
    is_active: true,
    
    // Imágenes
    image_url: '',
    images: [],
    thumbnail_url: '',
    
    // Otros
    tags: [],
    notes: '',
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadCategories();
    loadBrands();
    loadSuppliers();
    
    if (isEditing) {
      loadProduct();
    } else {
      generateCode();
    }
  }, [id]);

  const loadCategories = async () => {
    const result = await advancedApi.getCategories();
    if (result.success) {
      setCategories(result.data);
    }
  };

  const loadBrands = async () => {
    const result = await advancedApi.getBrands();
    if (result.success) {
      setBrands(result.data);
    }
  };

  const loadSuppliers = async () => {
    const result = await advancedApi.getSuppliers();
    if (result.success) {
      setSuppliers(result.data);
    }
  };

  const loadProduct = async () => {
    setLoading(true);
    const result = await productsApi.getProductById(id);
    if (result.success) {
      setFormData({
        ...formData,
        ...result.data,
        tags: result.data.tags || [],
        images: result.data.images || [],
      });
    } else {
      toast.error('Error cargando producto');
      navigate('/dashboard/products');
    }
    setLoading(false);
  };

  const generateCode = () => {
    const code = 'PROD-' + Date.now().toString().slice(-8);
    setFormData(prev => ({ ...prev, code }));
  };

  const handleGenerateBarcode = async () => {
    const result = await advancedApi.generateBarcode();
    if (result.success) {
      setFormData(prev => ({ ...prev, barcode: result.data }));
      toast.success('Código de barras generado');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // TODO: Implementar subida real a servidor/storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image_url: reader.result,
          thumbnail_url: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      toast.success('Imagen cargada (implementar subida real)');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'El código es requerido';
    }

    if (!formData.price || parseFloat(formData.price) < 0) {
      newErrors.price = 'El precio debe ser mayor o igual a 0';
    }

    if (formData.cost && parseFloat(formData.cost) < 0) {
      newErrors.cost = 'El costo no puede ser negativo';
    }

    if (formData.discounts_stock && formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrige los errores');
      return;
    }

    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        iva_rate: parseFloat(formData.iva_rate),
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        max_stock: formData.max_stock ? parseInt(formData.max_stock) : null,
        reorder_point: parseInt(formData.reorder_point) || 0,
        optimal_stock: formData.optimal_stock ? parseInt(formData.optimal_stock) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        width: formData.width ? parseFloat(formData.width) : null,
        depth: formData.depth ? parseFloat(formData.depth) : null,
      };

      let result;
      if (isEditing) {
        result = await productsApi.updateProduct(id, productData);
      } else {
        result = await productsApi.createProduct(productData);
      }

      if (result.success) {
        toast.success(isEditing ? 'Producto actualizado' : 'Producto creado');
        navigate('/dashboard/products');
      } else {
        toast.error(result.error || 'Error al guardar producto');
      }
    } catch (error) {
      toast.error('Error al guardar producto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Información Básica', icon: Tag },
    { id: 'pricing', label: 'Precios', icon: DollarSign },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'dimensions', label: 'Dimensiones', icon: Ruler },
    { id: 'images', label: 'Imágenes', icon: ImageIcon },
  ];

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isEditing ? `Código: ${formData.code}` : 'Completa la información del producto'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/products')}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={Save}
              onClick={handleSubmit}
              loading={loading}
              disabled={loading}
            >
              {isEditing ? 'Actualizar' : 'Crear Producto'}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-4 border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 font-medium'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            
            {/* TAB: Información Básica */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Código interno"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    error={errors.code}
                    required
                    disabled={isEditing}
                    icon={Tag}
                  />

                  <div className="relative">
                    <Input
                      label="Código de barras"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleChange}
                      icon={Barcode}
                      placeholder="Escanear o generar"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="absolute right-2 top-9 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Generar
                    </button>
                  </div>
                </div>

                <Input
                  label="Nombre del producto"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder="Descripción detallada del producto..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Categoría
                    </label>
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Sin categoría</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Marca
                    </label>
                    <select
                      name="brand_id"
                      value={formData.brand_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Sin marca</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Proveedor
                    </label>
                    <select
                      name="supplier_id"
                      value={formData.supplier_id}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Sin proveedor</option>
                      {suppliers.map(sup => (
                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Subfamilia"
                    name="subfamily"
                    value={formData.subfamily}
                    onChange={handleChange}
                    placeholder="Ej: Bebidas gaseosas"
                  />

                  <Input
                    label="Tipo"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    placeholder="Ej: Envasado, a granel"
                  />
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_service"
                      checked={formData.is_service}
                      onChange={handleChange}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Es un servicio (no descuenta stock)
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="discounts_stock"
                      checked={formData.discounts_stock}
                      onChange={handleChange}
                      disabled={formData.is_service}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Descuenta stock al vender
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_giftcard"
                      checked={formData.is_giftcard}
                      onChange={handleChange}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Es una Gift Card
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Producto activo
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* TAB: Precios */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Precio de venta"
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    error={errors.price}
                    required
                    icon={DollarSign}
                  />

                  <Input
                    label="Costo"
                    name="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={handleChange}
                    error={errors.cost}
                    icon={DollarSign}
                    helperText="Opcional"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Alícuota de IVA
                    </label>
                    <select
                      name="iva_rate"
                      value={formData.iva_rate}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      {IVA_RATES.map(rate => (
                        <option key={rate.value} value={rate.value}>{rate.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Unidad de medida
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      {UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cálculo de margen */}
                {formData.price && formData.cost && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Análisis de Rentabilidad</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700">Margen Bruto</p>
                        <p className="text-lg font-bold text-blue-900">
                          ${(parseFloat(formData.price) - parseFloat(formData.cost)).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Margen %</p>
                        <p className="text-lg font-bold text-blue-900">
                          {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.price)) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-blue-700">Markup</p>
                        <p className="text-lg font-bold text-blue-900">
                          {(((parseFloat(formData.price) - parseFloat(formData.cost)) / parseFloat(formData.cost)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Stock */}
            {activeTab === 'stock' && (
              <div className="space-y-6">
                {formData.is_service ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Este producto está marcado como servicio y no gestiona stock.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Stock inicial"
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleChange}
                        error={errors.stock}
                        disabled={!formData.discounts_stock}
                        icon={Package}
                      />

                      <Input
                        label="Stock mínimo"
                        name="min_stock"
                        type="number"
                        value={formData.min_stock}
                        onChange={handleChange}
                        helperText="Punto de alerta"
                        icon={AlertCircle}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Stock máximo"
                        name="max_stock"
                        type="number"
                        value={formData.max_stock}
                        onChange={handleChange}
                        helperText="Opcional"
                      />

                      <Input
                        label="Stock óptimo"
                        name="optimal_stock"
                        type="number"
                        value={formData.optimal_stock}
                        onChange={handleChange}
                        helperText="Nivel ideal de stock"
                      />
                    </div>

                    <Input
                      label="Punto de reorden"
                      name="reorder_point"
                      type="number"
                      value={formData.reorder_point}
                      onChange={handleChange}
                      helperText="Cuando generar orden de compra"
                    />
                  </>
                )}
              </div>
            )}

            {/* TAB: Dimensiones */}
            {activeTab === 'dimensions' && (
              <div className="space-y-6">
                <p className="text-sm text-slate-600">
                  Información opcional para logística y envíos
                </p>

                <Input
                  label="Peso (kg)"
                  name="weight"
                  type="number"
                  step="0.001"
                  value={formData.weight}
                  onChange={handleChange}
                  icon={Weight}
                />

                <div className="grid grid-cols-3 gap-4">
                  <Input
                    label="Alto (cm)"
                    name="height"
                    type="number"
                    step="0.01"
                    value={formData.height}
                    onChange={handleChange}
                    icon={Ruler}
                  />

                  <Input
                    label="Ancho (cm)"
                    name="width"
                    type="number"
                    step="0.01"
                    value={formData.width}
                    onChange={handleChange}
                    icon={Ruler}
                  />

                  <Input
                    label="Profundidad (cm)"
                    name="depth"
                    type="number"
                    step="0.01"
                    value={formData.depth}
                    onChange={handleChange}
                    icon={Ruler}
                  />
                </div>

                {/* Cálculo de volumen */}
                {formData.height && formData.width && formData.depth && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Volumen calculado</p>
                    <p className="text-2xl font-bold text-green-900">
                      {(parseFloat(formData.height) * parseFloat(formData.width) * parseFloat(formData.depth)).toFixed(2)} cm³
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Imágenes */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Imagen principal
                  </label>
                  
                  {formData.image_url ? (
                    <div className="relative inline-block">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '', thumbnail_url: '' }))}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-purple-500 transition">
                      <Upload className="w-12 h-12 text-slate-400 mb-2" />
                      <p className="text-sm text-slate-600">Click para subir imagen</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG hasta 5MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    💡 <strong>Tip:</strong> Las imágenes se mostrarán como miniaturas en el facturador para identificación rápida del producto.
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Botones al final */}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/products')}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Save}
              loading={loading}
              disabled={loading}
            >
              {isEditing ? 'Actualizar Producto' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}