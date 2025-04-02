// Tipos para os elementos do layout
export interface LayoutElement {
  id: string;
  type: 'text' | 'image' | 'dropdown' | 'variable';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    variableKey?: string; // Chave para buscar dados da API
    options?: string[]; // Opções para dropdown
  };
}

// Interface para o layout completo
export interface Layout {
  id: string;
  name: string;
  description?: string;
  elements: LayoutElement[];
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para dados variáveis retornados pela API
export interface VariableData {
  [key: string]: string | number | boolean | { url: string } | null;
}

// Interface para resposta da API
export interface ApiResponse {
  success: boolean;
  data?: VariableData;
  error?: string;
} 