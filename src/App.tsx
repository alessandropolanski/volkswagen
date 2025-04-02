import React, { useEffect, useRef, useState } from 'react';
import './index.css';
import LayoutCanvas from './components/layout/LayoutCanvas';
import ToolsPanel from './components/layout/ToolsPanel';
import SaveLoadPanel from './components/layout/SaveLoadPanel';
import PropertiesPanel from './components/layout/PropertiesPanel';
import VariablesProcessor from './components/layout/VariablesProcessor';
import { useLayoutStore } from './store/layoutStore';
import vwLogo from './assets/vw-logo.png';

// Tipo de página que estamos visualizando
type AppPage = 'editor' | 'processor';

function App() {
  const createLayout = useLayoutStore(state => state.createLayout);
  const layouts = useLayoutStore(state => state.layouts);
  const setLayouts = useLayoutStore(state => state.setLayouts);
  const initialLoadDone = useRef(false);
  const [currentPage, setCurrentPage] = useState<AppPage>('editor');
  
  // Carregar layouts salvos ou criar um layout inicial se necessário
  useEffect(() => {
    // Garantir que isso só execute uma vez
    if (initialLoadDone.current) return;
    
    console.log('Carregando layouts...');
    
    // Tentar carregar layouts salvos do localStorage
    const savedLayouts = localStorage.getItem('vw-layouts');
    console.log('Layouts salvos:', savedLayouts);
    
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        console.log('Layouts analisados:', parsedLayouts);
        
        if (Array.isArray(parsedLayouts) && parsedLayouts.length > 0) {
          // Carregar os layouts salvos
          console.log('Carregando layouts salvos');
          setLayouts(parsedLayouts);
          initialLoadDone.current = true;
          return; // Sai da função se conseguiu carregar os layouts
        }
      } catch (e) {
        console.error('Erro ao carregar layouts do localStorage:', e);
      }
    }
    
    // Se não tem layouts salvos ou houve erro, cria um layout inicial
    if (layouts.length === 0) {
      console.log('Criando layout inicial');
      createLayout('Layout Inicial', 800, 600);
    }
    
    initialLoadDone.current = true;
  }, [createLayout, setLayouts, layouts.length]); // Mantém as dependências para ESLint
  
  // Salvar layouts no localStorage quando mudam
  useEffect(() => {
    // Evitar salvar na primeira renderização
    if (!initialLoadDone.current) return;
    
    if (layouts.length > 0) {
      console.log('Salvando layouts:', layouts);
      localStorage.setItem('vw-layouts', JSON.stringify(layouts));
    }
  }, [layouts]);
  
  // Alternar para a página de processamento
  const goToProcessor = () => {
    setCurrentPage('processor');
  };
  
  // Alternar para o editor
  const goToEditor = () => {
    setCurrentPage('editor');
  };
  
  return (
    <div className="app">
      <header className="header">
        <img src={vwLogo} alt="Volkswagen Logo" className="vw-logo" />
        <div>
          <h1>Editor de Layouts Volkswagen</h1>
          <p>Crie e edite layouts para documentos</p>
        </div>
        <div className="navigation">
          <button 
            className={`nav-button ${currentPage === 'editor' ? 'active' : ''}`}
            onClick={goToEditor}
          >
            Editor
          </button>
          <button 
            className={`nav-button ${currentPage === 'processor' ? 'active' : ''}`}
            onClick={goToProcessor}
          >
            Processador
          </button>
        </div>
      </header>
      
      {currentPage === 'editor' && (
        <main className="main">
          <div className="sidebar">
            <h2>Ferramentas</h2>
            <ToolsPanel />
            
            <div className="layouts-section">
              <h2>Layouts</h2>
              <SaveLoadPanel />
            </div>
          </div>
          
          <div className="canvas">
            <LayoutCanvas />
          </div>
          
          <div className="properties-sidebar">
            <h2>Propriedades</h2>
            <PropertiesPanel />
          </div>
        </main>
      )}
      
      {currentPage === 'processor' && (
        <main className="main processor-page">
          <VariablesProcessor />
        </main>
      )}
      
      <footer className="footer">
        Volkswagen Layout Editor &copy; {new Date().getFullYear()} | v1.0.0
      </footer>
    </div>
  );
}

export default App;
