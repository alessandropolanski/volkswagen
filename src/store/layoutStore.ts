import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ElementType = 'text' | 'image';
export type DynamicType = 'text' | 'image' | 'qrcode';

export interface LayoutElement {
  id: string;
  type: ElementType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  variableName?: string;
  isDynamic: boolean;
  dynamicType?: DynamicType;
  style?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontWeight?: string;
    textAlign?: string;
    borderRadius?: string;
    padding?: string;
  };
}

export interface Layout {
  id: string;
  name: string;
  width: number;
  height: number;
  elements: LayoutElement[];
  createdAt?: string;
  updatedAt?: string;
}

interface LayoutState {
  layouts: Layout[];
  activeLayoutId: string | null;
  selectedElementId: string | null;
  
  // Ações para layouts
  createLayout: (name: string, width: number, height: number) => void;
  saveLayout: () => void;
  loadLayout: (id: string) => void;
  renameLayout: (id: string, name: string) => void;
  deleteLayout: (id: string) => void;
  updateLayout: (id: string, updates: Partial<Layout>) => void;
  setLayouts: (layouts: Layout[]) => void;
  selectLayout: (id: string) => void;
  
  // Ações para elementos
  addElement: (type: ElementType, x?: number, y?: number) => void;
  updateElement: (id: string, updates: Partial<LayoutElement>) => void;
  moveElement: (id: string, deltaX: number, deltaY: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  
  // Getters
  getActiveLayout: () => Layout | null;
  getSelectedElement: () => LayoutElement | null;
}

export const useLayoutStore = create<LayoutState>((set, get) => ({
  layouts: [],
  activeLayoutId: null,
  selectedElementId: null,
  
  createLayout: (name, width, height) => {
    const id = uuidv4();
    const newLayout: Layout = {
      id,
      name,
      width,
      height,
      elements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    set(state => ({
      layouts: [...state.layouts, newLayout],
      activeLayoutId: id,
      selectedElementId: null
    }));
  },
  
  saveLayout: () => {
    // Na implementação real, aqui faria uma chamada API para salvar no backend
    const activeLayout = get().getActiveLayout();
    console.log('Layout salvo:', activeLayout);
    
    set(state => {
      const updatedLayouts = state.layouts.map(layout => {
        if (layout.id === state.activeLayoutId) {
          return {
            ...layout,
            updatedAt: new Date().toISOString()
          };
        }
        return layout;
      });
      
      // Por enquanto, vamos salvar no localStorage
      localStorage.setItem('vw-layouts', JSON.stringify(updatedLayouts));
      
      return { layouts: updatedLayouts };
    });
  },
  
  loadLayout: (id) => {
    set({
      activeLayoutId: id,
      selectedElementId: null
    });
  },
  
  renameLayout: (id, name) => {
    set(state => ({
      layouts: state.layouts.map(layout => 
        layout.id === id ? {...layout, name, updatedAt: new Date().toISOString()} : layout
      )
    }));
  },
  
  updateLayout: (id, updates) => {
    set(state => ({
      layouts: state.layouts.map(layout => 
        layout.id === id ? {
          ...layout, 
          ...updates,
          updatedAt: new Date().toISOString()
        } : layout
      )
    }));
  },
  
  deleteLayout: (id) => {
    set(state => {
      const filteredLayouts = state.layouts.filter(layout => layout.id !== id);
      
      // Atualizar localStorage
      localStorage.setItem('vw-layouts', JSON.stringify(filteredLayouts));
      
      return {
        layouts: filteredLayouts,
        activeLayoutId: filteredLayouts.length > 0 ? filteredLayouts[0].id : null,
        selectedElementId: null
      };
    });
  },
  
  addElement: (type: ElementType, x = 50, y = 50) => {
    const element: LayoutElement = {
      id: uuidv4(),
      type,
      content: type === 'text' ? 'Texto de exemplo' : 'https://via.placeholder.com/150',
      x,
      y,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 150,
      isDynamic: false, // Nenhum elemento começa como dinâmico por padrão
      dynamicType: type === 'text' ? 'text' : 'image', // Define um tipo dinâmico padrão baseado no tipo do elemento
      style: {
        color: '#333333',
        backgroundColor: '#ffffff',
        fontSize: '16px',
        textAlign: 'left'
      }
    };
    
    set(state => {
      const updatedLayouts = state.layouts.map(layout => {
        if (layout.id === state.activeLayoutId) {
          return {
            ...layout,
            elements: [...layout.elements, element],
            updatedAt: new Date().toISOString()
          };
        }
        return layout;
      });
      
      return {
        layouts: updatedLayouts,
        selectedElementId: element.id
      };
    });
  },
  
  updateElement: (id, updates) => {
    set(state => {
      const updatedLayouts = state.layouts.map(layout => {
        if (layout.id === state.activeLayoutId) {
          return {
            ...layout,
            elements: layout.elements.map(element => 
              element.id === id ? {...element, ...updates} : element
            ),
            updatedAt: new Date().toISOString()
          };
        }
        return layout;
      });
      
      return { layouts: updatedLayouts };
    });
  },
  
  moveElement: (id, deltaX, deltaY) => {
    const element = get().getSelectedElement();
    if (!element) return;
    
    get().updateElement(id, { 
      x: element.x + deltaX,
      y: element.y + deltaY
    });
  },
  
  resizeElement: (id, width, height) => {
    get().updateElement(id, { width, height });
  },
  
  deleteElement: (id) => {
    set(state => {
      const updatedLayouts = state.layouts.map(layout => {
        if (layout.id === state.activeLayoutId) {
          return {
            ...layout,
            elements: layout.elements.filter(element => element.id !== id),
            updatedAt: new Date().toISOString()
          };
        }
        return layout;
      });
      
      return {
        layouts: updatedLayouts,
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId
      };
    });
  },
  
  selectElement: (id) => {
    set({ selectedElementId: id });
  },
  
  getActiveLayout: () => {
    const { layouts, activeLayoutId } = get();
    return layouts.find(layout => layout.id === activeLayoutId) || null;
  },
  
  getSelectedElement: () => {
    const activeLayout = get().getActiveLayout();
    const selectedElementId = get().selectedElementId;
    
    if (!activeLayout || !selectedElementId) return null;
    
    return activeLayout.elements.find(element => element.id === selectedElementId) || null;
  },
  
  setLayouts: (layouts) => {
    // Definir os layouts e ativar o primeiro, se existir
    set({
      layouts,
      activeLayoutId: layouts.length > 0 ? layouts[0].id : null,
      selectedElementId: null
    });
  },
  
  selectLayout: (id) => {
    set({ activeLayoutId: id });
  }
})); 