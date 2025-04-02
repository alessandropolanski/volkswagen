import axios from 'axios';
import { ApiResponse, Layout, VariableData } from '../types';

// URL base da API - em produção, seria substituída pelo endereço real
const API_BASE_URL = 'https://api.example.com/v1';

// Cliente Axios configurado
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Função simulada para buscar dados de variáveis
export const fetchVariableData = async (variableKey: string): Promise<VariableData> => {
  // Em um ambiente real, isso chamaria a API
  // Para desenvolvimento, vamos simular uma resposta
  
  // Simulação de atraso para simular chamada de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Dados de exemplo baseados na variableKey
  const mockData: Record<string, VariableData> = {
    'modelo': {
      value: 'Golf GTI',
      codigo: 'GTI-2025',
      imagem: { url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=300' }
    },
    'motor': {
      value: '2.0 TSI',
      potencia: '245cv',
      torque: '370Nm',
      imagem: { url: 'https://images.unsplash.com/photo-1626061877583-2f16346e4888?q=80&w=300' }
    },
    'transmissao': {
      value: 'DSG 7 velocidades',
      tipo: 'Automática de dupla embreagem',
      imagem: { url: 'https://images.unsplash.com/photo-1537140141010-33f167c6274a?q=80&w=300' }
    },
    'producao': {
      value: 'Fábrica Anchieta',
      data: '23/03/2025',
      lote: 'A2025-0342',
      status: 'Concluído'
    }
  };

  // Retorna os dados simulados ou um objeto vazio se a chave não existir
  return mockData[variableKey] || {};
};

// Função para salvar um layout
export const saveLayout = async (layout: Layout): Promise<ApiResponse> => {
  try {
    // Em produção, isso enviaria para a API real
    // Para desenvolvimento, simulamos uma resposta bem-sucedida
    
    // Simular atraso
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulação de salvamento bem-sucedido
    return {
      success: true,
      data: { layoutId: layout.id }
    };
  } catch (error) {
    console.error('Erro ao salvar layout:', error);
    return {
      success: false,
      error: 'Falha ao salvar layout. Tente novamente mais tarde.'
    };
  }
};

// Função para carregar layouts salvos
export const fetchLayouts = async (): Promise<Layout[]> => {
  // Em produção, isso buscaria da API
  // Para desenvolvimento, retornamos dados simulados do localStorage
  
  try {
    const savedLayouts = localStorage.getItem('vw-layouts');
    if (savedLayouts) {
      return JSON.parse(savedLayouts);
    }
    return [];
  } catch (error) {
    console.error('Erro ao carregar layouts:', error);
    return [];
  }
}; 