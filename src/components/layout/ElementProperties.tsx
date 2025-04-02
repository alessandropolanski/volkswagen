import React from 'react';
import { LayoutElement, DynamicType } from '../../store/layoutStore';

interface ElementPropertiesProps {
  element: LayoutElement;
  onUpdateElement: (updates: Partial<LayoutElement>) => void;
  onRequestDelete: () => void;
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({ 
  element, 
  onUpdateElement, 
  onRequestDelete 
}) => {
  const handleUpdateContent = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onUpdateElement({ content: e.target.value });
  };
  
  const handleUpdateVariableName = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateElement({ variableName: e.target.value.trim() ? e.target.value : undefined });
  };
  
  const handleToggleDynamic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isDynamic = e.target.checked;
    
    // Se o elemento não é mais dinâmico, limpar o nome da variável
    const updates: Partial<LayoutElement> = { 
      isDynamic,
      variableName: isDynamic ? element.variableName : undefined
    };
    
    // Se estiver tornando o elemento dinâmico e não tiver um tipo, defina um tipo padrão
    if (isDynamic && !element.dynamicType) {
      updates.dynamicType = element.type === 'image' ? 'image' : 'text';
    }
    
    onUpdateElement(updates);
  };
  
  const handleUpdatePosition = (e: React.ChangeEvent<HTMLInputElement>, property: 'x' | 'y') => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      onUpdateElement({ [property]: value });
    }
  };
  
  const handleUpdateSize = (e: React.ChangeEvent<HTMLInputElement>, property: 'width' | 'height') => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      onUpdateElement({ [property]: value });
    }
  };
  
  const handleUpdateStyle = (property: string, value: string) => {
    onUpdateElement({
      style: {
        ...element.style,
        [property]: value
      }
    });
  };
  
  const elementTypeLabels = {
    text: 'Texto',
    image: 'Imagem'
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar se é realmente uma imagem
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }
    
    // Criar URL para o arquivo selecionado
    const imageUrl = URL.createObjectURL(file);
    
    // Salvar a imagem como Data URL para garantir que ela funcione na exportação
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onUpdateElement({ content: event.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="element-properties">
      <div className="property-group">
        <div className="property-header">
          <h3>Elemento: {elementTypeLabels[element.type]}</h3>
          <button 
            className="delete-element-button" 
            onClick={onRequestDelete}
            title="Excluir Elemento"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="property-group">
        <h4>Tipo de Conteúdo</h4>
        <div className="dynamic-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={element.isDynamic}
              onChange={handleToggleDynamic}
              className="toggle-input"
            />
            <span className="toggle-switch"></span>
            <span className="toggle-text">
              {element.isDynamic ? 'Dinâmico' : 'Fixo'}
            </span>
          </label>
        </div>
        <p className="help-text">
          {element.isDynamic 
            ? 'O conteúdo será substituído com dados externos durante o processamento.' 
            : 'O conteúdo permanecerá fixo no layout.'}
        </p>
      </div>
      
      {/* Conteúdo do elemento - apenas para elementos NÃO dinâmicos */}
      {!element.isDynamic && (
        <div className="property-group">
          <h4>Conteúdo</h4>
          {element.type === 'text' ? (
            <textarea
              value={element.content}
              onChange={handleUpdateContent}
              className="content-input"
              rows={3}
              placeholder="Digite o texto aqui"
            />
          ) : element.type === 'image' ? (
            <div className="image-input-container">
              <input
                type="text"
                value={element.content}
                onChange={handleUpdateContent}
                className="content-input"
                placeholder="URL da imagem"
              />
              <div className="upload-button-container">
                <label className="upload-button">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  Upload
                </label>
              </div>
            </div>
          ) : null}
        </div>
      )}
      
      {/* Mostrar o campo de nome de variável para qualquer elemento marcado como dinâmico */}
      {element.isDynamic && (
        <div className="property-group">
          <h4>Nome da Variável</h4>
          <input
            type="text"
            value={element.variableName || ''}
            onChange={handleUpdateVariableName}
            className="content-input"
            placeholder="nome_variavel"
          />
          <p className="help-text">Este identificador será usado para substituir o conteúdo durante o processamento.</p>
        </div>
      )}
      
      <div className="property-group">
        <h4>Posição e Tamanho</h4>
        <div className="property-row">
          <div className="property-field">
            <label>X:</label>
            <input
              type="number"
              value={element.x}
              onChange={(e) => handleUpdatePosition(e, 'x')}
              className="number-input"
              min="0"
            />
          </div>
          <div className="property-field">
            <label>Y:</label>
            <input
              type="number"
              value={element.y}
              onChange={(e) => handleUpdatePosition(e, 'y')}
              className="number-input"
              min="0"
            />
          </div>
        </div>
        <div className="property-row">
          <div className="property-field">
            <label>Largura:</label>
            <input
              type="number"
              value={element.width}
              onChange={(e) => handleUpdateSize(e, 'width')}
              className="number-input"
              min="10"
            />
          </div>
          <div className="property-field">
            <label>Altura:</label>
            <input
              type="number"
              value={element.height}
              onChange={(e) => handleUpdateSize(e, 'height')}
              className="number-input"
              min="10"
            />
          </div>
        </div>
      </div>
      
      <div className="property-group">
        <h4>Estilo</h4>
        <div className="property-row">
          <div className="property-field">
            <label>Texto:</label>
            <input
              type="color"
              value={element.style?.color || '#333333'}
              onChange={(e) => handleUpdateStyle('color', e.target.value)}
              className="color-input"
            />
          </div>
          <div className="property-field">
            <label>Fundo:</label>
            <input
              type="color"
              value={element.style?.backgroundColor || '#ffffff'}
              onChange={(e) => handleUpdateStyle('backgroundColor', e.target.value)}
              className="color-input"
            />
          </div>
        </div>
        
        {element.type === 'text' && (
          <>
            <div className="property-row">
              <div className="property-field">
                <label>Tamanho da Fonte:</label>
                <select
                  value={element.style?.fontSize || '16px'}
                  onChange={(e) => handleUpdateStyle('fontSize', e.target.value)}
                  className="select-input"
                >
                  {[12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                    <option key={size} value={`${size}px`}>{size}px</option>
                  ))}
                </select>
              </div>
              <div className="property-field">
                <label>Alinhamento:</label>
                <select
                  value={element.style?.textAlign || 'left'}
                  onChange={(e) => handleUpdateStyle('textAlign', e.target.value)}
                  className="select-input"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </div>
            </div>
            <div className="property-row">
              <div className="property-field">
                <label>Peso da Fonte:</label>
                <select
                  value={element.style?.fontWeight || 'normal'}
                  onChange={(e) => handleUpdateStyle('fontWeight', e.target.value)}
                  className="select-input"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Negrito</option>
                  <option value="lighter">Leve</option>
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ElementProperties; 