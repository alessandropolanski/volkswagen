import React, { useState, useEffect } from 'react';
import { useLayoutStore } from '../../store/layoutStore';
import './layout.css';

interface VariableInput {
  name: string;
  type: string;
  value: string;
  default_value: string;
}

interface FillVariablesProps {
  onProcess?: (data: any) => void;
}

const FillVariables: React.FC<FillVariablesProps> = ({ onProcess }) => {
  const { layouts, activeLayoutId, selectLayout } = useLayoutStore();
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(activeLayoutId);
  const [variables, setVariables] = useState<VariableInput[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  
  // Lista de exemplos para preenchimento automático
  const textExamples = [
    "Volkswagen Gol 1.6 2023",
    "Polo Highline TSI",
    "T-Cross Comfortline 200 TSI",
    "Virtus GTS 1.4 TSI",
    "Jetta 250 TSI",
    "Nivus Highline 1.0",
    "Taos Comfortline 250 TSI",
    "Amarok Highline V6",
    "Saveiro Robust",
    "Golf GTI 350 TSI",
  ];

  const qrCodeExamples = [
    "https://www.vw.com.br/pt.html",
    "VW12345678901234567",
    "VWABC-2023-12345",
    "Veículo: Gol 1.6 2023\nChassi: 9BWZZZ377VT004251",
    "Concessionária: VW Motors\nVendedor: João Silva\nData: 01/12/2023",
  ];
  
  const imageExamples = [
    "https://cdn.motor1.com/images/mgl/JOVwy/s1/novo-volkswagen-polo-2023.jpg",
    "https://s2.glbimg.com/o05kJ2Ot-5ZB3I79XjT9_UCVRzU=/0x0:1280x853/924x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_cf9d9876ad9b4278bd33b1ad973fccd9/internal_photos/bs/2022/d/j/AtF0XkQsWxAFUJsD31GQ/15.jpg",
    "https://s2.glbimg.com/I0t0xb5iP7jRTePs2RRX9IfDPWA=/0x0:2000x1333/924x0/smart/filters:strip_icc()/i.s3.glbimg.com/v1/AUTH_cf9d9876ad9b4278bd33b1ad973fccd9/internal_photos/bs/2022/2/6/A5AiXYTZW13MzOAX35Ig/jetta-2023-6-.jpg"
  ];
  
  // Função para preencher automaticamente as variáveis com exemplos
  const fillWithExamples = () => {
    const updatedVariables = variables.map(variable => {
      const newVar = { ...variable };
      
      if (variable.type === 'text') {
        newVar.value = textExamples[Math.floor(Math.random() * textExamples.length)];
      } else if (variable.type === 'qrcode') {
        newVar.value = qrCodeExamples[Math.floor(Math.random() * qrCodeExamples.length)];
      } else if (variable.type === 'image') {
        newVar.value = imageExamples[Math.floor(Math.random() * imageExamples.length)];
      }
      
      return newVar;
    });
    
    setVariables(updatedVariables);
  };
  
  // Extrair variáveis do layout selecionado
  useEffect(() => {
    if (!selectedLayoutId) return;
    
    const layout = layouts.find(l => l.id === selectedLayoutId);
    if (!layout) return;
    
    // Encontrar todos os elementos dinâmicos com variáveis definidas
    const dynamicElements = layout.elements
      .filter(el => el.isDynamic && el.variableName)
      .map(el => ({
        name: el.variableName || '',
        type: el.dynamicType || (el.type === 'image' ? 'image' : 'text'),
        value: '',
        default_value: el.content
      }));
    
    setVariables(dynamicElements);
  }, [selectedLayoutId, layouts]);
  
  // Manipular mudança no layout selecionado
  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const layoutId = e.target.value;
    setSelectedLayoutId(layoutId);
    selectLayout(layoutId);
  };
  
  // Atualizar valor de uma variável
  const handleVariableChange = (index: number, value: string) => {
    const updatedVariables = [...variables];
    updatedVariables[index].value = value;
    setVariables(updatedVariables);
  };
  
  // Gerar QR Code com implementação real
  const generateQRCode = async (text: string): Promise<string> => {
    try {
      // Usando uma API gratuita para gerar QR codes reais
      const encodedText = encodeURIComponent(text);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodedText}&size=200x200&margin=10`;
      
      // Buscar a imagem e convertê-la para base64 para uso direto no layout
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      
      // Fallback para o mock anterior caso haja erro
      return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAABlBMVEX///8AAABVwtN+AAABA0lEQVR42uyYMQ7DIAxFDWLIEXKUHi1H69F6BJQhQwdEm1b90eoWqf8bHX4sy5a/DQBe4CMHgDUHQMwB0J/XagZwzmtVA6j/MG4A5x/mJoBORmQEUOFG6s8QbmcIwDIMAMoQBYgCDAAzRAHaAcCdYQAYKlUqVaoClCEKEAWQ0pQqValKVapSlapUpSr1/wAeJPEqYBuA+LcjvgXY3AsSuCPiAebcnOHu6BGA5tLsXrvbS4VhAHPtbk8ZNg8QMHnKsMnggWGTwQPDRoAzw9aBAMOWgfh3Z9gGEGfYMHDOsGEgzrBRIM2wTcDNsE0gzbBNwM2wTSDNsE0AMGwSABg2CeQZthNEvV/cQfI9cQAAAABJRU5ErkJggg==`;
    }
  };
  
  // Processar a exportação com variáveis substituídas
  const handleProcessExport = async () => {
    if (!selectedLayoutId) return;
    
    setIsProcessing(true);
    
    try {
      const layout = layouts.find(l => l.id === selectedLayoutId);
      if (!layout) throw new Error('Layout não encontrado');
      
      // Clona o layout para não modificar o original
      const processedLayout = JSON.parse(JSON.stringify(layout));
      
      // Processar elementos dinâmicos
      for (let i = 0; i < processedLayout.elements.length; i++) {
        const element = processedLayout.elements[i];
        
        if (element.isDynamic && element.variableName) {
          const variable = variables.find(v => v.name === element.variableName);
          
          if (variable && variable.value) {
            // Se for um QR Code, gerar a imagem
            if (variable.type === 'qrcode') {
              element.content = await generateQRCode(variable.value);
            } else {
              element.content = variable.value;
            }
          }
        }
      }
      
      // Criar estrutura do JSON para exportação
      const dynamicElements = variables.map(v => ({
        name: v.name,
        type: v.type,
        default_value: v.default_value,
        value: v.value || v.default_value
      }));
      
      const exportData = {
        layout: {
          name: layout.name,
          width: layout.width,
          height: layout.height,
          elements: processedLayout.elements
        },
        variables: dynamicElements
      };
      
      // Simular envio para API (mock)
      await mockApiCall(exportData);
      
      // Se existir a função de callback onProcess, chama ela
      if (onProcess) {
        onProcess(exportData);
      }
      
      // Criar URL do arquivo para download
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      setResultUrl(url);
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      alert('Ocorreu um erro ao processar os dados. Verifique o console para mais detalhes.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Mock da chamada de API
  const mockApiCall = async (data: any): Promise<void> => {
    // Simular um tempo de processamento
    return new Promise(resolve => setTimeout(resolve, 1000));
  };
  
  // Visualizar preview do PDF processado (mock)
  const handlePreviewPDF = () => {
    if (!resultUrl) return;
    
    // Em uma implementação real, isso enviaria os dados para uma API
    // e receberia um PDF para exibir
    alert('Em uma implementação real, aqui seria exibido o PDF gerado pela API');
  };
  
  // Baixar o JSON processado
  const handleDownloadJSON = () => {
    if (!resultUrl || !selectedLayoutId) return;
    
    const layout = layouts.find(l => l.id === selectedLayoutId);
    if (!layout) return;
    
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${layout.name}_processado.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="fill-variables-container">
      <h2>Preenchimento de Variáveis</h2>
      
      <div className="layout-selector">
        <label htmlFor="layout-select">Selecione um Layout:</label>
        <select 
          id="layout-select"
          value={selectedLayoutId || ''}
          onChange={handleLayoutChange}
          className="layout-select"
        >
          <option value="">Selecione um layout</option>
          {layouts.map(layout => (
            <option key={layout.id} value={layout.id}>
              {layout.name} ({layout.width}×{layout.height})
            </option>
          ))}
        </select>
      </div>
      
      {selectedLayoutId && variables.length === 0 && (
        <div className="no-variables-message">
          <p>Este layout não possui variáveis dinâmicas definidas.</p>
        </div>
      )}
      
      {variables.length > 0 && (
        <div className="variables-list">
          <h3>Variáveis Dinâmicas</h3>
          
          {variables.map((variable, index) => (
            <div key={variable.name} className="variable-input-row">
              <div className="variable-info">
                <span className="variable-name">{variable.name}</span>
                <span className={`variable-type variable-type-${variable.type}`}>
                  {variable.type === 'text' ? 'Texto' : 
                   variable.type === 'image' ? 'Imagem' : 'QR Code'}
                </span>
              </div>
              
              {variable.type === 'text' && (
                <input
                  type="text"
                  value={variable.value}
                  onChange={(e) => handleVariableChange(index, e.target.value)}
                  placeholder={variable.default_value || `Valor para ${variable.name}`}
                  className="variable-input"
                />
              )}
              
              {variable.type === 'image' && (
                <input
                  type="text"
                  value={variable.value}
                  onChange={(e) => handleVariableChange(index, e.target.value)}
                  placeholder="URL da imagem"
                  className="variable-input"
                />
              )}
              
              {variable.type === 'qrcode' && (
                <input
                  type="text"
                  value={variable.value}
                  onChange={(e) => handleVariableChange(index, e.target.value)}
                  placeholder="Texto para gerar QR Code"
                  className="variable-input"
                />
              )}
              
              {variable.type === 'qrcode' && variable.value && (
                <div className="qr-preview">
                  <p className="preview-label">Pré-visualização do QR Code:</p>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(variable.value)}&size=150x150&margin=10`} 
                    alt="QR Code Preview" 
                    className="qr-preview-image"
                  />
                </div>
              )}
            </div>
          ))}
          
          <div className="variables-actions">
            <button 
              onClick={handleProcessExport}
              disabled={isProcessing}
              className="process-button"
            >
              {isProcessing ? 'Processando...' : 'Processar Layout'}
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default FillVariables; 