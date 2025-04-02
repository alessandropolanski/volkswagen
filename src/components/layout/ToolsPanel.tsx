import React from 'react';
import { useLayoutStore, ElementType } from '../../store/layoutStore';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ icon, label, onClick }) => {
  return (
    <button 
      className="tool" 
      onClick={onClick}
      title={label}
    >
      <div className="tool-icon">{icon}</div>
      <span className="tool-label">{label}</span>
    </button>
  );
};

const ToolsPanel: React.FC = () => {
  const addElement = useLayoutStore(state => state.addElement);
  const activeLayout = useLayoutStore(state => state.getActiveLayout());
  
  const handleAddElement = (type: ElementType) => {
    if (!activeLayout) {
      alert('Por favor, crie ou carregue um layout primeiro.');
      return;
    }
    
    // Centralizar o elemento no canvas
    const centerX = activeLayout.width / 2 - 50;
    const centerY = activeLayout.height / 2 - 20;
    
    addElement(type, centerX, centerY);
  };
  
  const tools = [
    {
      id: 'text',
      label: 'Texto',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 9l-5.063 7.881L7 9"/>
          <path d="M12 18V5"/>
        </svg>
      ),
      onClick: () => handleAddElement('text')
    },
    {
      id: 'image',
      label: 'Imagem',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      ),
      onClick: () => handleAddElement('image')
    }
  ];
  
  return (
    <div className="tools">
      <div className="tools-group">
        {tools.map(tool => (
          <ToolButton
            key={tool.id}
            icon={tool.icon}
            label={tool.label}
            onClick={tool.onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ToolsPanel; 