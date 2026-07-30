export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
  timestamp: string;
}

export interface Collection {
  id: string;
  name: string;
  category: 'Marble Look' | 'Stone Look' | 'Concrete Look' | 'Metal Look' | 'Wood Look';
  finish: 'Polished' | 'Matte' | 'Textured' | 'Silk' | 'Satin';
  formats: string[];
  specs: string;
  description: string;
  veiningStyle?: string;
  backgroundGradient: string; // CSS gradient representation
  origin: string;
  colors: string[];
  applications: string[];
  // Enriched fields for high-density spec sheet layout
  finishAndFeel?: string;
  colorGroup?: string;
  sizeAndFormat?: string;
  thickness?: string;
  visualLook?: string;
  specificMaterialStyle?: string;
  productPhotoUrl?: string;
  thumbnailUrl?: string;
  brand?: string;
  collection?: string;
  unit?: string;
  sqFtPerUnit?: number | null;
  sqFtPerBox?: number | null;
  stockQuantities?: string | null;
  inStock?: boolean;
  price?: string | null;
  airtableId?: string;
}

export interface Booking {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  projectType: string;
  notes?: string;
}

export interface PreSelectedItem {
  collection: Collection;
  quantity: number;
  quantityType: 'Slabs' | 'Sq Ft' | 'Boxes';
}
