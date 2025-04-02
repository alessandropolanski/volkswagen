import { create } from 'zustand';
import { Layout, LayoutElement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { saveLayout, fetchLayouts } from '../services/api';

interface LayoutState {
  // Estado atual
  currentLayout: Layout | null;
  savedLayouts: Layout[];
  isDragging: boolean;
  isEditing: boolean;
  selectedElementId: string | null;
  
  // Ações
  createNewLayout: (name: string, width: number, height: number) => void;
  addElement: (element: Omit<LayoutElement, 'id'>) => void;
  updateElement: (elementId: string, updates: Partial<LayoutElement>) => void;
  removeElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  moveElement: (elementId: string, x: number, y: number) => void;
  resizeElement: (elementId: string, width: number, height: number) => void;
  saveCurrentLayout: () => Promise<boolean>;
  loadLayout: (layoutId: string) => void;
  fetchSavedLayouts: () => Promise<void>;
  setIsDragging: (isDragging: boolean) => void;
  setIsEditing: (isEditing: boolean) => void;
}

// Cria a store usando Zustand
const useLayoutStore = create<LayoutState>((set, get) => ({
  // Estado inicial
  currentLayout: null,
  savedLayouts: [],
  isDragging: false,
  isEditing: false,
  selectedElementId: null,
  
  // Criação de um novo layout
  createNewLayout: (name, width, height) => {
    const newLayout: Layout = {
      id: uuidv4(),
      name,
      elements: [],
      width,
      height,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    set({ currentLayout: newLayout });
  },
  
  // Adicionar um novo elemento ao layout
  addElement: (element) => {
    const { currentLayout } = get();
    if (!currentLayout) return;
    
    const newElement: LayoutElement = {
      id: uuidv4(),
      ...element
    };
    
    set({
      currentLayout: {
        ...currentLayout,
        elements: [...currentLayout.elements, newElement],
        updatedAt: new Date()
      }
    });
  },
  
  // Atualizar um elemento existente
  updateElement: (elementId, updates) => {
    const { currentLayout } = get();
    if (!currentLayout) return;
    
    set({
      currentLayout: {
        ...currentLayout,
        elements: currentLayout.elements.map(element => 
          element.id === elementId 
            ? { ...element, ...updates } 
            : element
        ),
        updatedAt: new Date()
      }
    });
  },
  
  // Remover um elemento
  removeElement: (elementId) => {
    const { currentLayout } = get();
    if (!currentLayout) return;
    
    set({
      currentLayout: {
        ...currentLayout,
        elements: currentLayout.elements.filter(element => element.id !== elementId),
        updatedAt: new Date()
      },
      selectedElementId: null
    });
  },
  
  // Selecionar um elemento para edição
  selectElement: (elementId) => {
    set({ selectedElementId: elementId });
  },
  
  // Mover um elemento
  moveElement: (elementId, x, y) => {
    const { updateElement } = get();
    updateElement(elementId, { x, y });
  },
  
  // Redimensionar um elemento
  resizeElement: (elementId, width, height) => {
    const { updateElement } = get();
    updateElement(elementId, { width, height });
  },
  
  // Salvar o layout atual
  saveCurrentLayout: async () => {
    const { currentLayout } = get();
    if (!currentLayout) return false;
    
    try {
      // Salvar no backend/API
      const response = await saveLayout(currentLayout);
      
      if (response.success) {
        // Atualizar a lista de layouts salvos localmente
        const { savedLayouts } = get();
        const updatedLayouts = savedLayouts.some(layout => layout.id === currentLayout.id)
          ? savedLayouts.map(layout => 
              layout.id === currentLayout.id ? currentLayout : layout
            )
          : [...savedLayouts, currentLayout];
        
        // Salvar no localStorage para persistência local
        localStorage.setItem('vw-layouts', JSON.stringify(updatedLayouts));
        
        // Atualizar o estado
        set({ savedLayouts: updatedLayouts });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao salvar layout:', error);
      return false;
    }
  },
  
  // Carregar um layout salvo
  loadLayout: (layoutId) => {
    const { savedLayouts } = get();
    const layoutToLoad = savedLayouts.find(layout => layout.id === layoutId);
    
    if (layoutToLoad) {
      set({ 
        currentLayout: layoutToLoad,
        selectedElementId: null
      });
    }
  },
  
  // Buscar layouts salvos
  fetchSavedLayouts: async () => {
    try {
      const layouts = await fetchLayouts();
      set({ savedLayouts: layouts });
    } catch (error) {
      console.error('Erro ao buscar layouts salvos:', error);
    }
  },
  
  // Definir estado de arrasto
  setIsDragging: (isDragging) => set({ isDragging }),
  
  // Definir estado de edição
  setIsEditing: (isEditing) => set({ isEditing })
}));

export default useLayoutStore; 