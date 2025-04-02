import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore, Layout } from '../../store/layoutStore';

// Dimensões de papéis comuns em mm
const paperSizes = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
  Custom: { width: 0, height: 0 } // Valor especial para dimensões personalizadas
};

// Fator de conversão de mm para pixels (assumindo 96 DPI)
const MM_TO_PX = 3.78;

const SaveLoadPanel: React.FC = () => {
  const { 
    layouts, 
    activeLayoutId, 
    createLayout, 
    saveLayout, 
    loadLayout, 
    deleteLayout,
    updateLayout,
    getActiveLayout 
  } = useLayoutStore();
  
  const [layoutName, setLayoutName] = useState('');
  const [width, setWidth] = useState(794); // A4 em pixels
  const [height, setHeight] = useState(1123); // A4 em pixels
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPaperSize, setSelectedPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  const activeLayout = getActiveLayout();
  
  // Função memoizada para atualizar o tamanho do layout ativo
  const updateActiveLayoutSize = useCallback((newWidth: number, newHeight: number) => {
    if (activeLayoutId) {
      updateLayout(activeLayoutId, { width: newWidth, height: newHeight });
    }
  }, [activeLayoutId, updateLayout]);
  
  // Atualiza os campos quando um layout é carregado
  useEffect(() => {
    if (activeLayout) {
      setLayoutName(activeLayout.name);
      setWidth(activeLayout.width);
      setHeight(activeLayout.height);
      
      // Tenta determinar o tamanho do papel e orientação com base nas dimensões
      detectPaperSizeAndOrientation(activeLayout.width, activeLayout.height);
    }
  }, [activeLayout]);
  
  // Atualiza as dimensões quando o tamanho do papel ou orientação muda
  useEffect(() => {
    if (selectedPaperSize === 'Custom') return;
    
    const size = paperSizes[selectedPaperSize as keyof typeof paperSizes];
    if (!size) return;
    
    const newWidth = Math.round((orientation === 'portrait' ? size.width : size.height) * MM_TO_PX);
    const newHeight = Math.round((orientation === 'portrait' ? size.height : size.width) * MM_TO_PX);
    
    setWidth(newWidth);
    setHeight(newHeight);
    
    // Atualiza o layout ativo com as novas dimensões
    updateActiveLayoutSize(newWidth, newHeight);
  }, [selectedPaperSize, orientation, updateActiveLayoutSize]);
  
  // Detecta o tamanho do papel e orientação com base nas dimensões
  const detectPaperSizeAndOrientation = (width: number, height: number) => {
    // Converte pixels para mm
    const widthMm = Math.round(width / MM_TO_PX);
    const heightMm = Math.round(height / MM_TO_PX);
    
    let foundSize = false;
    
    for (const [size, dimensions] of Object.entries(paperSizes)) {
      if (size === 'Custom') continue;
      
      const sizeObj = dimensions as { width: number, height: number };
      
      // Verifica orientação retrato
      if (Math.abs(widthMm - sizeObj.width) < 5 && Math.abs(heightMm - sizeObj.height) < 5) {
        setSelectedPaperSize(size);
        setOrientation('portrait');
        foundSize = true;
        break;
      }
      
      // Verifica orientação paisagem
      if (Math.abs(widthMm - sizeObj.height) < 5 && Math.abs(heightMm - sizeObj.width) < 5) {
        setSelectedPaperSize(size);
        setOrientation('landscape');
        foundSize = true;
        break;
      }
    }
    
    if (!foundSize) {
      setSelectedPaperSize('Custom');
    }
  };
  
  const handleCreateLayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!layoutName.trim()) return;
    
    createLayout(layoutName, width, height);
    setLayoutName('');
  };
  
  const handleSaveLayout = () => {
    if (!activeLayoutId) return;
    
    setIsSaving(true);
    
    // Garantir que as dimensões atuais estão salvas no layout
    updateLayout(activeLayoutId, { 
      width, 
      height,
      name: layoutName.trim() || activeLayout?.name || 'Layout sem nome'
    });
    
    // Salvar layout
    saveLayout();
    
    // Mostra feedback visual
    setTimeout(() => setIsSaving(false), 1000);
  };
  
  // Manipulador para alterações de largura com debounce para evitar atualizações excessivas
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value) || 0;
    const validWidth = Math.max(100, newWidth); // Garantir valor mínimo
    setWidth(validWidth);
    setSelectedPaperSize('Custom');
    
    // Atualiza o layout ativo com a nova largura imediatamente
    if (activeLayoutId) {
      updateLayout(activeLayoutId, { width: validWidth });
    }
  };
  
  // Manipulador para alterações de altura com debounce para evitar atualizações excessivas
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value) || 0;
    const validHeight = Math.max(100, newHeight); // Garantir valor mínimo
    setHeight(validHeight);
    setSelectedPaperSize('Custom');
    
    // Atualiza o layout ativo com a nova altura imediatamente
    if (activeLayoutId) {
      updateLayout(activeLayoutId, { height: validHeight });
    }
  };
  
  // Use debounce apenas para inputs numéricos que exigem validação ou transformação
  const handleWidthInputBlur = () => {
    if (width <= 0) {
      const minWidth = 100;
      setWidth(minWidth);
      updateActiveLayoutSize(minWidth, height);
    }
  };
  
  const handleHeightInputBlur = () => {
    if (height <= 0) {
      const minHeight = 100;
      setHeight(minHeight);
      updateActiveLayoutSize(width, minHeight);
    }
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return 'Data inválida';
    }
  };
  
  return (
    <div className="save-load-panel">
      <div className="layout-creation-section">
        <h3 className="section-title">Criar Novo Layout</h3>
        
        <form onSubmit={handleCreateLayout} className="layout-creation-form">
          <div className="form-group">
            <label htmlFor="layout-name">Nome do Layout:</label>
            <input
              id="layout-name"
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="Nome do layout"
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="paper-size">Tamanho do papel:</label>
            <select 
              id="paper-size"
              value={selectedPaperSize}
              onChange={(e) => setSelectedPaperSize(e.target.value)}
              className="form-select"
            >
              {Object.keys(paperSizes).map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="orientation">Orientação:</label>
            <select 
              id="orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
              className="form-select"
              disabled={selectedPaperSize === 'Custom'}
            >
              <option value="portrait">Retrato</option>
              <option value="landscape">Paisagem</option>
            </select>
          </div>
          
          <div className="dimension-inputs">
            <div className="dimension-group">
              <label htmlFor="layout-width">Largura:</label>
              <div className="input-container">
                <input
                  id="layout-width"
                  type="number"
                  value={width}
                  onChange={handleWidthChange}
                  onBlur={handleWidthInputBlur}
                  min="1"
                  className="form-input dimension-input"
                />
              </div>
            </div>
            
            <div className="dimension-group">
              <label htmlFor="layout-height">Altura:</label>
              <div className="input-container">
                <input
                  id="layout-height"
                  type="number"
                  value={height}
                  onChange={handleHeightChange}
                  onBlur={handleHeightInputBlur}
                  min="1"
                  className="form-input dimension-input"
                />
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="create-button"
            disabled={!layoutName.trim()}
          >
            Criar Layout
          </button>
        </form>
      </div>
      
      {activeLayout && (
        <div className="current-layout-section">
          <h3 className="section-title">Layout Atual</h3>
          <div className="current-layout-info">
            <p className="layout-name">{activeLayout.name}</p>
            <p className="layout-dimensions">{activeLayout.width} × {activeLayout.height} px</p>
            
            <button 
              onClick={handleSaveLayout} 
              className={`save-button ${isSaving ? 'saving' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? 'Salvando...' : 'Salvar Layout'}
            </button>
          </div>
        </div>
      )}
      
      <div className="saved-layouts-section">
        <h3 className="section-title">
          Layouts Salvos ({layouts.length})
        </h3>
        
        <div className="saved-layouts-list">
          {layouts.length === 0 && (
            <p className="no-layouts-message">Nenhum layout salvo</p>
          )}
          
          {layouts.map((layout: Layout) => (
            <div
              key={layout.id}
              className={`saved-layout-item ${activeLayoutId === layout.id ? 'active' : ''}`}
              onClick={() => loadLayout(layout.id)}
            >
              <div className="layout-item-content">
                <div className="layout-item-header">
                  <h4 className="layout-item-name">{layout.name}</h4>
                  <button
                    className="delete-layout-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Excluir o layout "${layout.name}"?`)) {
                        deleteLayout(layout.id);
                      }
                    }}
                  >
                    ×
                  </button>
                </div>
                
                <div className="layout-item-details">
                  <span className="layout-item-dimensions">
                    {layout.width} × {layout.height} px
                  </span>
                  <span className="layout-item-element-count">
                    {layout.elements.length} elemento(s)
                  </span>
                </div>
                
                <div className="layout-item-dates">
                  <span className="layout-item-updated">
                    Atualizado: {formatDate(layout.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadPanel; 