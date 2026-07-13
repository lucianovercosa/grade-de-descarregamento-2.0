export interface VehicleItem {
  code: string;
  description: string;
  location: string;
  volume: number;
}

export interface Vehicle {
  id?: string;
  daily_sequence: number;
  plate: string;
  driver: string;
  driver_phone: string;
  transporter: string;
  supplier: string;
  invoice_number: string;
  items: VehicleItem[];
  attachments?: { name: string; url: string; type: string }[];
  forklift_user_id: string;
  forklift_name: string;
  notes: string;
  public_token: string;
  progress_status: string;
  progress_percent: number;
  started_at: string;
  analysis_started_at?: string;
  analysis_finished_at?: string;
  unload_started_at?: string;
  finished_at: string;
  created_at: string;
  updated_at: string;
  // Kept for backward compatibility, though may be unused now:
  product_code?: string;
  product_description?: string;
  dock?: string;
  volume?: number;
}

export interface Product {
  id?: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressEvent {
  id?: string;
  vehicle_id: string;
  plate: string;
  old_progress: string;
  new_progress: string;
  created_at: string;
}

export interface Role {
  id?: string;
  name: string;
  permissions: string[];
  created_at: string;
}

export interface AppUser {
  id?: string;
  username: string;
  name: string;
  role: 'admin' | 'empilhador' | 'mro' | 'tv' | string;
  active: boolean;
  created_at: string;
}

export const PROGRESS_OPTIONS = ["TRIAGEM", "SEM ESPAÇO", "VEÍCULO RETORNOU", "EM ANALISE", "ANALISE CONCLUIDO", "AGUARDO DESCARGA", "EM DESCARREGO", "RECEBIDO"];

export const PROGRESS_PERCENT: Record<string, number> = {
    "TRIAGEM": 10,
    "SEM ESPAÇO": 20,
    "VEÍCULO RETORNOU": 30,
    "EM ANALISE": 40,
    "ANALISE CONCLUIDO": 55,
    "AGUARDO DESCARGA": 70,
    "EM DESCARREGO": 85,
    "RECEBIDO": 100,
};

export interface ChatMessage {
  id?: string;
  text: string;
  user_id: string;
  user_name: string;
  target_user_id?: string;
  target_user_name?: string;
  created_at: string;
}
