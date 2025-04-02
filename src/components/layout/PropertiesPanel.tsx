import React, { useState } from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import { LayoutElement } from '../../store/layoutStore';
import ElementProperties from './ElementProperties';
import CanvasProperties from './CanvasProperties';

const PropertiesPanel: React.FC = () => {
  const activeLayout = useLayoutStore(state => state.getActiveLayout());
  const selectedElementId = useLayoutStore(state => state.selectedElementId);
  const updateElement = useLayoutStore(state => state.updateElement);
  const deleteElement = useLayoutStore(state => state.deleteElement);
  const updateLayout = useLayoutStore(state => state.updateLayout);
  
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  const selectedElement = activeLayout?.elements.find(
    element => element.id === selectedElementId
  );
  
  const handleUpdateElement = (updates: Partial<LayoutElement>) => {
    if (selectedElementId) {
      updateElement(selectedElementId, updates);
    }
  };
  
  const handleDeleteElement = () => {
    if (selectedElementId) {
      deleteElement(selectedElementId);
      setDeleteDialog(false);
    }
  };
  
  const handleUpdateLayout = (width: number, height: number) => {
    if (activeLayout) {
      updateLayout(activeLayout.id, { width, height });
    }
  };
  
  if (!activeLayout) {
    return (
      <div className="properties-panel">
        <p className="properties-empty-message">Nenhum layout selecionado</p>
      </div>
    );
  }
  
  if (!selectedElement) {
    return (
      <div className="properties-panel">
        <CanvasProperties 
          layout={activeLayout}
          onUpdateLayout={handleUpdateLayout}
        />
      </div>
    );
  }
  
  return (
    <div className="properties-panel">
      <ElementProperties 
        element={selectedElement}
        onUpdateElement={handleUpdateElement}
        onRequestDelete={() => setDeleteDialog(true)}
      />
      
      {deleteDialog && (
        <div className="delete-dialog">
          <div className="delete-dialog-content">
            <h3 className="delete-dialog-title">Excluir Elemento</h3>
            <p>Tem certeza que deseja excluir este elemento?</p>
            <div className="delete-dialog-buttons">
              <button 
                className="cancel-button" 
                onClick={() => setDeleteDialog(false)}
              >
                Cancelar
              </button>
              <button 
                className="confirm-button" 
                onClick={handleDeleteElement}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPanel; 