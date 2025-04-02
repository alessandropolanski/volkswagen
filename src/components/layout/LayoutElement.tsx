import React, { useState, useRef, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { LayoutElement as LayoutElementType } from '../../store/layoutStore';
import { useLayoutStore } from '../../store/layoutStore';
import './layout.css';

interface ResizeHandleProps {
  direction: string;
  onResizeStart: (direction: string) => void;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ direction, onResizeStart }) => {
  return (
    <div 
      className={`resize-handle resize-handle-${direction}`} 
      onMouseDown={(e) => {
        e.stopPropagation();
        onResizeStart(direction);
      }}
    />
  );
};

interface LayoutElementProps {
  element: LayoutElementType;
  isSelected: boolean;
  scale: number;
  onSelect: (id: string) => void;
  onMove: (id: string, deltaX: number, deltaY: number) => void;
  onResize: (id: string, width: number, height: number) => void;
}

const LayoutElementComponent: React.FC<LayoutElementProps> = ({
  element,
  isSelected,
  scale,
  onSelect,
  onMove,
  onResize
}) => {
  const { id, x, y, width, height, type, content, style = {} } = element;
  const updateElement = useLayoutStore(state => state.updateElement);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(element.content);
  const [editVariableName, setEditVariableName] = useState(element.variableName || '');
  const [resizing, setResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [startSize, setStartSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const variableInputRef = useRef<HTMLInputElement>(null);
  
  // Obter o tipo dinâmico para classes CSS e exibição
  const getDynamicType = () => {
    return element.dynamicType || (type === 'image' ? 'image' : 'text');
  };
  
  // Obter o rótulo do tipo dinâmico para exibição
  const getDynamicTypeLabel = () => {
    switch (getDynamicType()) {
      case 'image': return 'Imagem';
      case 'qrcode': return 'QR Code';
      case 'text': 
      default: return 'Texto';
    }
  };
  
  // Obter classe CSS adicional baseada no tipo dinâmico
  const getDynamicClass = () => {
    if (!element.isDynamic) return '';
    return `dynamic-${getDynamicType()}`;
  };
  
  // Atualizar editValue e editVariableName quando o elemento muda
  useEffect(() => {
    setEditValue(element.content);
    setEditVariableName(element.variableName || '');
  }, [element.content, element.variableName]);
  
  // Focar no input quando edição é ativada
  useEffect(() => {
    if (isEditing) {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isEditing]);
  
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
    disabled: isEditing || resizing,
  });
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
  };
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };
  
  const handleInputBlur = () => {
    if (editValue.trim() !== element.content || editVariableName !== (element.variableName || '')) {
      updateElement(id, { 
        content: editValue.trim(),
        variableName: editVariableName.trim() ? editVariableName.trim() : undefined
      });
    }
    setIsEditing(false);
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputBlur();
    }
  };
  
  const handleResizeStart = (direction: string) => {
    setResizing(true);
    setResizeDirection(direction);
    setStartSize({
      width: width,
      height: height,
      x: x,
      y: y
    });
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!startPos.x && !startPos.y) {
        setStartPos({ x: e.clientX, y: e.clientY });
        return;
      }
      
      const deltaX = (e.clientX - startPos.x) / scale;
      const deltaY = (e.clientY - startPos.y) / scale;
      
      // Calcular novas dimensões com base na direção
      let newWidth = width;
      let newHeight = height;
      
      // Ajustar dimensões com base na direção
      switch (direction) {
        case 'e':
        case 'ne':
        case 'se':
          newWidth = Math.max(20, width + deltaX);
          break;
        case 'w':
        case 'nw':
        case 'sw':
          newWidth = Math.max(20, width - deltaX);
          break;
      }
      
      switch (direction) {
        case 's':
        case 'se':
        case 'sw':
          newHeight = Math.max(20, height + deltaY);
          break;
        case 'n':
        case 'ne':
        case 'nw':
          newHeight = Math.max(20, height - deltaY);
          break;
      }
      
      // Chamar a função onResize com as novas dimensões
      onResize(id, newWidth, newHeight);
      
      // Se necessário, ajustar a posição do elemento (para direções que afetam posição)
      if (['n', 'nw', 'ne', 'w', 'sw'].includes(direction)) {
        // Calcular ajustes de posição
        let moveX = 0;
        let moveY = 0;
        
        if (['nw', 'w', 'sw'].includes(direction)) {
          moveX = width - newWidth;
        }
        
        if (['n', 'nw', 'ne'].includes(direction)) {
          moveY = height - newHeight;
        }
        
        if (moveX !== 0 || moveY !== 0) {
          onMove(id, moveX, moveY);
        }
      }
    };
    
    const handleMouseUp = () => {
      setResizing(false);
      setStartPos({ x: 0, y: 0 });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Melhoria nos estilos do elemento
  const elementStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    position: 'absolute',
    left: x,
    top: y,
    width: width,
    height: height,
    zIndex: isSelected ? 10 : 1,
    boxSizing: 'border-box',
    border: isSelected ? '2px solid #0066cc' : element.isDynamic ? '1px dashed #0066cc' : '1px solid #ddd',
    boxShadow: isSelected ? '0 0 0 2px rgba(0, 102, 204, 0.3)' : 'none',
    borderRadius: '4px',
    ...(style as React.CSSProperties)
  };
  
  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="element-edit-container">
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="element-edit-textarea"
            style={{ width: '100%', height: element.isDynamic ? 'calc(100% - 60px)' : '100%' }}
          />
          
          {/* Mostrar o campo de nome da variável apenas para elementos dinâmicos */}
          {element.isDynamic && (
            <div className="variable-name-container">
              <label htmlFor="variable-name">Nome da Variável:</label>
              <input
                id="variable-name"
                ref={variableInputRef}
                value={editVariableName}
                onChange={e => setEditVariableName(e.target.value)}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="variable-name-input"
                placeholder="nome_variavel"
              />
            </div>
          )}
        </div>
      );
    }
    
    if (type === 'image') {
      return (
        <div className="image-preview">
          <div className="image-placeholder">
            {element.isDynamic && element.variableName ? (
              <div className="variable-image-indicator">
                <span className="variable-tag">{`{{${element.variableName}}}`}</span>
              </div>
            ) : (
              <>
                <svg className="image-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span className="image-text">{content}</span>
              </>
            )}
          </div>
        </div>
      );
    }
    
    if (element.isDynamic) {
      const varName = element.variableName || '';
      return (
        <div className="variable-display">
          <span className="variable-tag">{`{{${varName}}}`}</span>
          <span className="dynamic-indicator" data-type={getDynamicType()}>
            {getDynamicTypeLabel()}
          </span>
        </div>
      );
    }
    
    return <div className="element-content">{content}</div>;
  };
  
  return (
    <div
      ref={setNodeRef}
      className={`layout-element ${type}-element ${isSelected ? 'selected' : ''} ${getDynamicClass()}`}
      style={elementStyle}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
      {...(resizing ? {} : attributes)}
      {...(resizing ? {} : listeners)}
    >
      {renderContent()}
      
      {isSelected && !isEditing && (
        <>
          <ResizeHandle direction="nw" onResizeStart={handleResizeStart} />
          <ResizeHandle direction="n" onResizeStart={handleResizeStart} />
          <ResizeHandle direction="ne" onResizeStart={handleResizeStart} />
          <ResizeHandle direction="e" onResizeStart={handleResizeStart} />
          <ResizeHandle direction="se" onResizeStart={handleResizeStart} />
          <ResizeHandle direction="s" onResizeStart={handleResizeStart} />
          <ResizeHandle direction="sw" onResizeStart={handleResizeStart} />
          <ResizeHandle direction="w" onResizeStart={handleResizeStart} />
        </>
      )}
    </div>
  );
};

export default LayoutElementComponent; 