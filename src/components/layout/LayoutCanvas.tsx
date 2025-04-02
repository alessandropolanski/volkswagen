import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, pointerWithin, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { useLayoutStore } from '../../store/layoutStore';
import LayoutElement from './LayoutElement';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { LayoutElement as LayoutElementType } from '../../store/layoutStore';
// Importar jsPDF para a funcionalidade de exportação PDF
import { jsPDF } from 'jspdf';
import './layout.css';

const LayoutCanvas: React.FC = () => {
  const activeLayout = useLayoutStore(state => state.getActiveLayout());
  const selectedElementId = useLayoutStore(state => state.selectedElementId);
  const selectElement = useLayoutStore(state => state.selectElement);
  const moveElement = useLayoutStore(state => state.moveElement);
  const resizeElement = useLayoutStore(state => state.resizeElement);
  const createLayout = useLayoutStore(state => state.createLayout);
  const layouts = useLayoutStore(state => state.layouts);
  const loadLayout = useLayoutStore(state => state.loadLayout);
  
  // Estado para armazenar escala de visualização do canvas
  const [scale, setScale] = useState(1);
  
  // Usar useMemo para forçar a atualização da grade quando as dimensões mudam
  const canvasDimensions = useMemo(() => {
    return activeLayout ? {
      width: activeLayout.width,
      height: activeLayout.height
    } : null;
  }, [activeLayout?.width, activeLayout?.height]);
  
  // Ajusta a escala com base no tamanho do layout
  useEffect(() => {
    if (!activeLayout) return;
    
    try {
      // Calcula a escala para caber na visualização
      const containerEl = document.querySelector('.canvas-container') as HTMLDivElement;
      if (!containerEl) return;
      
      const containerWidth = containerEl.clientWidth - 60; // 60px de padding
      const containerHeight = containerEl.clientHeight - 60;
      
      // Escolhe a menor escala que garante que o layout caiba no container
      const widthScale = containerWidth / activeLayout.width;
      const heightScale = containerHeight / activeLayout.height;
      
      // Usa no máximo escala 1 para não aumentar se for pequeno
      const newScale = Math.min(1, Math.min(widthScale, heightScale));
      setScale(newScale > 0.2 ? newScale : 0.2); // Limita mínimo a 20%
      
      // Força a atualização do CSS da grade
      const gridElement = document.querySelector('.canvas-grid') as HTMLElement;
      if (gridElement) {
        gridElement.style.backgroundSize = `${20 * (1/newScale)}px ${20 * (1/newScale)}px`;
      }
    } catch (error) {
      console.error('Erro ao calcular escala:', error);
    }
  }, [canvasDimensions, activeLayout]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px of movement before drag starts
      },
    })
  );
  
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    if (active) {
      const elementId = active.id.toString();
      selectElement(elementId);
    }
  }, [selectElement]);
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    if (active) {
      const elementId = active.id.toString();
      moveElement(elementId, delta.x, delta.y);
    }
  }, [moveElement]);
  
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Deselecionar elemento se clicar no canvas fora de qualquer elemento
    if (e.currentTarget === e.target) {
      selectElement(null);
    }
  }, [selectElement]);
  
  const handleResize = (
    elementId: string, 
    direction: string, 
    deltaX: number, 
    deltaY: number, 
    startWidth: number, 
    startHeight: number,
    startX: number,
    startY: number
  ) => {
    const directionMap: Record<string, { width: number, height: number, x: number, y: number }> = {
      'nw': { 
        width: startWidth - deltaX, 
        height: startHeight - deltaY,
        x: startX + deltaX,
        y: startY + deltaY
      },
      'n': { 
        width: startWidth, 
        height: startHeight - deltaY,
        x: startX,
        y: startY + deltaY
      },
      'ne': { 
        width: startWidth + deltaX, 
        height: startHeight - deltaY,
        x: startX,
        y: startY + deltaY
      },
      'e': { 
        width: startWidth + deltaX, 
        height: startHeight,
        x: startX,
        y: startY
      },
      'se': { 
        width: startWidth + deltaX, 
        height: startHeight + deltaY,
        x: startX,
        y: startY
      },
      's': { 
        width: startWidth, 
        height: startHeight + deltaY,
        x: startX,
        y: startY
      },
      'sw': { 
        width: startWidth - deltaX, 
        height: startHeight + deltaY,
        x: startX + deltaX,
        y: startY
      },
      'w': { 
        width: startWidth - deltaX, 
        height: startHeight,
        x: startX + deltaX,
        y: startY
      }
    };
    
    const changes = directionMap[direction];
    
    if (changes.width < 20) changes.width = 20;
    if (changes.height < 20) changes.height = 20;
    
    resizeElement(elementId, changes.width, changes.height);
    moveElement(elementId, changes.x - startX, changes.y - startY);
  };
  
  // Adaptador para a nova interface do LayoutElement
  const handleResizeWrapper = (id: string, width: number, height: number) => {
    // Aqui simplesmente passamos as novas dimensões diretamente para o resizeElement
    resizeElement(id, width, height);
  };
  
  // Exportar como PNG (mantido para compatibilidade)
  const handleDownloadPNG = () => {
    if (!activeLayout) return;
    
    // Criar um elemento canvas para renderizar o layout
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Definir dimensões do canvas
    canvas.width = activeLayout.width;
    canvas.height = activeLayout.height;
    
    // Preencher o fundo
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Função auxiliar para carregar imagens
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = (e) => {
          console.error('Erro ao carregar imagem:', e);
          reject(new Error('Falha ao carregar imagem'));
        };
        img.src = src;
      });
    };
    
    // Desenhar todos os elementos usando Promises para imagens
    const drawElements = async () => {
      // Primeiro desenha todos os elementos que não são imagens
      activeLayout.elements.forEach((element: LayoutElementType) => {
        if (element.type === 'text') {
          ctx.fillStyle = element.style?.color || '#333';
          ctx.font = `${element.style?.fontWeight || 'normal'} ${element.style?.fontSize || '16px'} Arial, sans-serif`;
          ctx.textAlign = (element.style?.textAlign as CanvasTextAlign) || 'left';
          
          // Se for dinâmico, exibir com formato de variável
          const displayText = element.isDynamic && element.variableName
            ? `{{${element.variableName}}}`
            : element.content;
            
          ctx.fillText(displayText, element.x + 8, element.y + 24);
        }
      });
      
      // Depois tenta carregar e desenhar todas as imagens
      for (const element of activeLayout.elements) {
        if (element.type === 'image') {
          if (element.isDynamic || (!element.content.startsWith('http') && !element.content.startsWith('data:'))) {
            // Se for dinâmico ou não for uma URL válida ou data URL, desenhar um placeholder
            ctx.strokeStyle = '#999';
            ctx.strokeRect(element.x, element.y, element.width, element.height);
            ctx.fillStyle = '#eee';
            ctx.fillRect(element.x, element.y, element.width, element.height);
            ctx.fillStyle = '#999';
            ctx.textAlign = 'center';
            
            // Se for dinâmico, exibir com formato de variável
            const displayText = element.isDynamic && element.variableName
              ? `Imagem: {{${element.variableName}}}`
              : 'Imagem';
              
            ctx.fillText(displayText, element.x + element.width/2, element.y + element.height/2);
          } else {
            try {
              // Tentar carregar e desenhar a imagem real (HTTP ou data URL)
              const img = await loadImage(element.content);
              ctx.drawImage(img, element.x, element.y, element.width, element.height);
            } catch (error) {
              // Em caso de erro, desenha um placeholder
              console.error('Erro ao carregar a imagem para PNG:', error);
              
              ctx.strokeStyle = '#999';
              ctx.strokeRect(element.x, element.y, element.width, element.height);
              ctx.fillStyle = '#eee';
              ctx.fillRect(element.x, element.y, element.width, element.height);
              ctx.fillStyle = '#999';
              ctx.textAlign = 'center';
              ctx.fillText('Erro na imagem', element.x + element.width/2, element.y + element.height/2);
            }
          }
        }
      }
      
      // Converter o canvas para imagem PNG
      const dataUrl = canvas.toDataURL('image/png');
      
      // Criar um link para download
      const link = document.createElement('a');
      link.download = `${activeLayout.name}.png`;
      link.href = dataUrl;
      link.click();
    };
    
    // Executar o desenho dos elementos
    drawElements().catch(error => {
      console.error('Erro ao gerar PNG:', error);
      alert('Ocorreu um erro ao gerar a imagem PNG. Veja o console para mais detalhes.');
    });
  };
  
  // Novo método para exportar como PDF
  const handleDownloadPDF = () => {
    if (!activeLayout) return;
    
    try {
      // Criar um documento PDF usando jsPDF
      const pdf = new jsPDF({
        orientation: activeLayout.width > activeLayout.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [activeLayout.width, activeLayout.height]
      });
      
      // Criar um canvas temporário para renderização
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Definir dimensões do canvas igual ao layout
      canvas.width = activeLayout.width;
      canvas.height = activeLayout.height;
      
      // Preencher o fundo
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Função auxiliar para carregar imagens
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => resolve(img);
          img.onerror = (e) => {
            console.error('Erro ao carregar imagem:', e);
            reject(new Error('Falha ao carregar imagem'));
          };
          img.src = src;
        });
      };
      
      // Desenhar todos os elementos usando Promises para imagens
      const drawElements = async () => {
        // Primeiro desenha todos os elementos que não são imagens
        activeLayout.elements.forEach((element: LayoutElementType) => {
          if (element.type === 'text') {
            ctx.fillStyle = element.style?.color || '#333';
            ctx.font = `${element.style?.fontWeight || 'normal'} ${element.style?.fontSize || '16px'} Arial, sans-serif`;
            ctx.textAlign = (element.style?.textAlign as CanvasTextAlign) || 'left';
            
            // Se for dinâmico, exibir com formato de variável
            const displayText = element.isDynamic && element.variableName
              ? `{{${element.variableName}}}`
              : element.content;
              
            ctx.fillText(displayText, element.x + 8, element.y + 24);
          }
        });
        
        // Depois tenta carregar e desenhar todas as imagens
        for (const element of activeLayout.elements) {
          if (element.type === 'image') {
            if (element.isDynamic || (!element.content.startsWith('http') && !element.content.startsWith('data:'))) {
              // Se for dinâmico ou não for uma URL válida ou data URL, desenhar um placeholder
              ctx.strokeStyle = '#999';
              ctx.strokeRect(element.x, element.y, element.width, element.height);
              ctx.fillStyle = '#eee';
              ctx.fillRect(element.x, element.y, element.width, element.height);
              ctx.fillStyle = '#999';
              ctx.textAlign = 'center';
              
              // Se for dinâmico, exibir com formato de variável
              const displayText = element.isDynamic && element.variableName
                ? `Imagem: {{${element.variableName}}}`
                : 'Imagem';
                
              ctx.fillText(displayText, element.x + element.width/2, element.y + element.height/2);
            } else {
              try {
                // Tentar carregar e desenhar a imagem real (HTTP ou data URL)
                const img = await loadImage(element.content);
                ctx.drawImage(img, element.x, element.y, element.width, element.height);
              } catch (error) {
                // Em caso de erro, desenha um placeholder
                console.error('Erro ao carregar a imagem para PDF:', error);
                
                ctx.strokeStyle = '#999';
                ctx.strokeRect(element.x, element.y, element.width, element.height);
                ctx.fillStyle = '#eee';
                ctx.fillRect(element.x, element.y, element.width, element.height);
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('Erro na imagem', element.x + element.width/2, element.y + element.height/2);
              }
            }
          }
        }
        
        // Adicionar a imagem renderizada ao PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, activeLayout.width, activeLayout.height);
        
        // Adicionar metadados com informações sobre as variáveis (elementos dinâmicos)
        const variablesMetadata = activeLayout.elements
          .filter(el => el.isDynamic && el.variableName)
          .map(el => ({
            id: el.id,
            type: el.type,
            variableName: el.variableName,
            dynamicType: el.dynamicType,
            x: el.x,
            y: el.y,
            width: el.width,
            height: el.height
          }));
        
        // Adicionar uma página com os metadados em JSON para facilitar o processamento
        if (variablesMetadata.length > 0) {
          pdf.addPage();
          pdf.setFontSize(12);
          pdf.text('Metadados de Variáveis:', 20, 20);
          
          // Quebrar o JSON em linhas para melhor visualização
          const jsonLines = JSON.stringify(variablesMetadata, null, 2).split('\n');
          let yPosition = 30;
          
          jsonLines.forEach(line => {
            pdf.text(line, 20, yPosition);
            yPosition += 8;
          });
        }
        
        // Salvar o PDF
        pdf.save(`${activeLayout.name}.pdf`);
      };
      
      // Executar o desenho dos elementos
      drawElements().catch(error => {
        console.error('Erro ao gerar PDF:', error);
        alert('Ocorreu um erro ao gerar o PDF. Veja o console para mais detalhes.');
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Ocorreu um erro ao gerar o PDF. Veja o console para mais detalhes.');
    }
  };
  
  // Exportar o layout como JSON (para facilitar a integração com a API)
  const handleExportJSON = () => {
    if (!activeLayout) return;
    
    // Filtrar os elementos dinâmicos com nome de variável definido
    const dynamicElements = activeLayout.elements
      .filter(el => el.isDynamic && el.variableName)
      .map(el => {
        // Formato solicitado: name, type, default_value
        return {
          name: el.variableName,
          type: el.dynamicType || (el.type === 'image' ? 'image' : 'text'),
          default_value: el.content
        };
      });
    
    // Mapa de variáveis para acesso rápido
    const variablesMap = dynamicElements.reduce((acc, el) => {
      if (el.name) {
        acc[el.name] = el;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Estrutura conforme solicitado
    const layoutData = {
      layout: {
        name: activeLayout.name,
        width: activeLayout.width,
        height: activeLayout.height,
        elements: activeLayout.elements.map(el => ({
          id: el.id,
          type: el.type,
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          content: el.content,
          style: el.style,
          isDynamic: el.isDynamic,
          variableName: el.variableName,
          dynamicType: el.dynamicType
        }))
      },
      variables: dynamicElements
    };
    
    const jsonString = JSON.stringify(layoutData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLayout.name || 'layout'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleZoomIn = () => {
    setScale(prevScale => Math.min(2, prevScale + 0.1));
  };
  
  const handleZoomOut = () => {
    setScale(prevScale => Math.max(0.2, prevScale - 0.1));
  };
  
  const handleResetZoom = () => {
    setScale(1);
  };
  
  // Handlers para a tela "Nenhum layout ativo"
  const handleCreateNewLayout = () => {
    createLayout('Novo Layout', 800, 600);
  };
  
  const handleLoadExistingLayout = () => {
    if (layouts.length > 0) {
      loadLayout(layouts[0].id);
    } else {
      alert('Não há layouts salvos para carregar.');
    }
  };
  
  // Estilo dinâmico para o container do canvas com base nas dimensões do layout
  const canvasStyle = useMemo(() => {
    if (!activeLayout) return {
      width: '800px',
      height: '600px',
      background: 'white',
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.15)',
      border: '1px solid #ccc',
      position: 'relative' as const,
      margin: 'auto',
      overflow: 'hidden' as const,
    };
    
    return {
      width: `${activeLayout.width}px`,
      height: `${activeLayout.height}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
      background: 'white',
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.15)',
      border: '1px solid #ccc',
      position: 'relative' as const,
      margin: 'auto',
      overflow: 'hidden' as const,
    };
  }, [activeLayout, scale]);
  
  // No trecho do JSX onde verificamos se há layout ativo
  const showCreateButton = layouts.length === 0;
  const showLoadButton = layouts.length > 0;
  
  // Novo estado para controlar o dropdown de exportação
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Função para alternar a visibilidade do dropdown
  const toggleExportDropdown = () => {
    setShowExportDropdown(!showExportDropdown);
  };
  
  // Manipulador para clicar fora do dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="canvas-wrapper">
      <div className="canvas-tools">
        <button className="zoom-button" onClick={handleZoomIn} title="Aumentar Zoom">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button className="zoom-button" onClick={handleZoomOut} title="Diminuir Zoom">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button className="zoom-button" onClick={handleResetZoom} title="Resetar Zoom">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </button>
        <span className="zoom-level">{Math.round(scale * 100)}%</span>
        
        {/* Indicador de dimensões acima do canvas */}
        {activeLayout && (
          <span className="canvas-dimensions-indicator">
            {activeLayout.width} × {activeLayout.height} px
          </span>
        )}
        
        {/* Dropdown de exportação - só mostrar quando tiver layout ativo */}
        {activeLayout && (
          <div className="export-dropdown-container" ref={dropdownRef}>
            <button 
              className="export-dropdown-button" 
              onClick={toggleExportDropdown}
              title="Exportar Layout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Exportar</span>
            </button>
            
            {showExportDropdown && (
              <div className="export-dropdown-menu">
                <button className="export-option" onClick={() => { handleDownloadPDF(); toggleExportDropdown(); }}>
                  <svg className="export-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="12" y1="18" x2="12" y2="12"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                  PDF
                </button>
                <button className="export-option" onClick={() => { handleExportJSON(); toggleExportDropdown(); }}>
                  <svg className="export-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"></path>
                  </svg>
                  JSON
                </button>
                <button className="export-option" onClick={() => { handleDownloadPNG(); toggleExportDropdown(); }}>
                  <svg className="export-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  PNG
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="canvas-container">
        {!activeLayout ? (
          <div className="no-layout-message">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 19h18a1 1 0 001-1V3h-6a1 1 0 01-1-1v6H9a1 1 0 00-1 1v6H3a1 1 0 00-1 1v3a1 1 0 001 1z" stroke="#CCC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>Nenhum layout ativo</h3>
            <p>Crie um novo layout ou carregue um existente</p>
            <div className="no-layout-actions">
              <button className="create-button" onClick={handleCreateNewLayout}>Criar Layout</button>
              {showLoadButton && (
                <button className="save-button" onClick={handleLoadExistingLayout}>Carregar Layout</button>
              )}
            </div>
          </div>
        ) : (
          <div 
            className="canvas" 
            onClick={handleCanvasClick}
            style={canvasStyle}
            key={activeLayout ? `${activeLayout.width}-${activeLayout.height}` : 'no-layout'}
          >
            <div 
              className="canvas-grid" 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundSize: `${20 * (1/scale)}px ${20 * (1/scale)}px`,
                width: '100%',
                height: '100%'
              }} 
            />
            
            {/* Contexto de drag and drop */}
            <DndContext 
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              collisionDetection={pointerWithin}
              modifiers={[restrictToParentElement]}
            >
              {/* Render all layout elements */}
              {activeLayout.elements.map((element: LayoutElementType) => (
                <LayoutElement 
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                  scale={scale}
                  onSelect={(id) => selectElement(id)}
                  onMove={(id, deltaX, deltaY) => {
                    moveElement(id, deltaX, deltaY);
                  }}
                  onResize={handleResizeWrapper}
                />
              ))}
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutCanvas; 