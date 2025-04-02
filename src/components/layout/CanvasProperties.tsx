import React, { useState, useEffect } from 'react';
import { Layout } from '../../store/layoutStore';

interface CanvasPropertiesProps {
  layout: Layout;
  onUpdateLayout: (width: number, height: number) => void;
}

const CanvasProperties: React.FC<CanvasPropertiesProps> = ({ 
  layout, 
  onUpdateLayout
}) => {
  const [width, setWidth] = useState(layout.width);
  const [height, setHeight] = useState(layout.height);
  
  useEffect(() => {
    setWidth(layout.width);
    setHeight(layout.height);
  }, [layout.width, layout.height]);
  
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = parseInt(e.target.value, 10);
    if (!isNaN(newWidth) && newWidth > 0) {
      setWidth(newWidth);
    }
  };
  
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = parseInt(e.target.value, 10);
    if (!isNaN(newHeight) && newHeight > 0) {
      setHeight(newHeight);
    }
  };
  
  const handleApplyChanges = () => {
    if (width !== layout.width || height !== layout.height) {
      onUpdateLayout(width, height);
    }
  };
  
  // Opções de tamanho de página pré-definidos
  const pageSizes = [
    { name: 'A4 Retrato', width: 595, height: 842 },
    { name: 'A4 Paisagem', width: 842, height: 595 },
    { name: 'A5 Retrato', width: 420, height: 595 },
    { name: 'A5 Paisagem', width: 595, height: 420 },
    { name: 'Carta', width: 612, height: 792 },
    { name: 'Personalizado', width: width, height: height }
  ];
  
  const handleSizePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(e.target.value, 10);
    if (selectedIndex >= 0 && selectedIndex < pageSizes.length) {
      setWidth(pageSizes[selectedIndex].width);
      setHeight(pageSizes[selectedIndex].height);
    }
  };
  
  // Encontrar o índice do tamanho selecionado
  const selectedSizeIndex = pageSizes.findIndex(
    size => size.width === width && size.height === height
  );
  
  return (
    <div className="canvas-properties">
      <div className="property-group">
        <div className="property-header">
          <h3>Propriedades do Canvas</h3>
        </div>
        
        <h4>Dimensões</h4>
        
        <div className="property-row">
          <div className="property-field">
            <label>Tamanho Predefinido:</label>
            <select 
              value={selectedSizeIndex >= 0 ? selectedSizeIndex : pageSizes.length - 1} 
              onChange={handleSizePresetChange}
              className="select-input"
            >
              {pageSizes.map((size, index) => (
                <option key={index} value={index}>
                  {size.name} ({size.width} × {size.height})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="property-row">
          <div className="property-field">
            <label>Largura:</label>
            <input
              type="number"
              value={width}
              onChange={handleWidthChange}
              className="number-input"
              min="100"
            />
          </div>
          <div className="property-field">
            <label>Altura:</label>
            <input
              type="number"
              value={height}
              onChange={handleHeightChange}
              className="number-input"
              min="100"
            />
          </div>
        </div>
        
        <button 
          className="apply-button" 
          onClick={handleApplyChanges}
          disabled={width === layout.width && height === layout.height}
        >
          Aplicar Mudanças
        </button>
      </div>
      
      <div className="property-group">
        <h4>Nome do Layout</h4>
        <div className="property-field">
          <label>Nome:</label>
          <input
            type="text"
            value={layout.name}
            readOnly
            className="content-input"
          />
          <p className="help-text">Para alterar o nome, utilize o painel de layouts à esquerda.</p>
        </div>
      </div>
      
      <div className="property-group">
        <h4>Ajuda</h4>
        <div className="help-text">
          <p>Nenhum elemento selecionado. Clique em um elemento no canvas para editar suas propriedades.</p>
          <p>Para adicionar elementos, use os botões na barra de ferramentas à esquerda.</p>
        </div>
      </div>
    </div>
  );
};

export default CanvasProperties; 