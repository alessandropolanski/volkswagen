import React from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import { ElementType } from '../../store/layoutStore';

interface ToolButtonProps {
  type: ElementType;
  icon: React.ReactNode;
  label: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({ type, icon, label }) => {
  const addElement = useLayoutStore(state => state.addElement);
  
  const handleClick = () => {
    addElement(type);
  };
  
  return (
    <button className="tool-button" onClick={handleClick}>
      <div className="tool-icon">{icon}</div>
      <div className="tool-label">{label}</div>
    </button>
  );
};

const SidebarTools: React.FC = () => {
  return (
    <div className="sidebar-section">
      <h2 className="sidebar-title">Ferramentas</h2>
      <div className="tools-grid">
        <ToolButton
          type="text"
          icon={<span className="icon">✕</span>}
          label="Texto"
        />
        <ToolButton
          type="image"
          icon={<span className="icon">📷</span>}
          label="Imagem"
        />
        <ToolButton
          type="variable"
          icon={<span className="icon">T</span>}
          label="Variável"
        />
      </div>
    </div>
  );
};

export default SidebarTools; 