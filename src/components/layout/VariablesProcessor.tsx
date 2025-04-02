import React, { useState, useEffect } from 'react';
import FillVariables from './FillVariables';
import { useLayoutStore } from '../../store/layoutStore';
import './layout.css';
// Importar a biblioteca QRCode diretamente
import QRCode from 'qrcode';

// Note: Para usar a geração de QR code offline, você precisa instalar:
// npm install qrcode
// npm install @types/qrcode --save-dev

// Mock de API para processamento de PDF
interface MockApiResponse {
  success: boolean;
  message: string;
  pdfUrl?: string;
  processedData?: any;
}

const VariablesProcessor: React.FC = () => {
  const [pdfResult, setPdfResult] = useState<MockApiResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeLibLoaded, setQrCodeLibLoaded] = useState<boolean>(true);
  const [qrCodesMap, setQrCodesMap] = useState<Map<string, string>>(new Map());

  // Verificar se a biblioteca QRCode está funcionando corretamente
  useEffect(() => {
    // Testar a geração de um QR code simples para verificar se a biblioteca está funcionando
    try {
      QRCode.toDataURL('teste')
        .then(() => {
          console.log('Biblioteca QRCode carregada com sucesso');
          setQrCodeLibLoaded(true);
        })
        .catch((err) => {
          console.error('Erro ao carregar biblioteca QRCode:', err);
          setQrCodeLibLoaded(false);
        });
    } catch (err) {
      console.error('Erro ao inicializar biblioteca QRCode:', err);
      setQrCodeLibLoaded(false);
    }
  }, []);

  // Função para gerar um texto aleatório como exemplo
  const generateRandomText = (type: string): string => {
    const carModels = [
      "Volkswagen Gol 1.6 2023 - VIN: 9BWZZZ377VT004251",
      "Polo Highline TSI - Preto Ninja",
      "T-Cross Comfortline 200 TSI - Cinza Platinum",
      "Virtus GTS 1.4 TSI - Branco Puro",
      "Jetta 250 TSI - VIN: 3VWSB7AJ6KM034456",
      "Nivus Highline 1.0 - Vermelho Sunset",
      "Taos Comfortline 250 TSI - Azul Atlântico",
      "Amarok Highline V6 - Prata Pyrit",
      "Saveiro Robust - VIN: 9BWKB45U4KP064578",
      "Golf GTI 350 TSI - Vermelho Tornado"
    ];
    
    return carModels[Math.floor(Math.random() * carModels.length)];
  };
  
  // QR Code em base64 embutido (fallback caso a geração falhe)
  // QR code básico da palavra "Volkswagen"
  const fallbackQRCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAMAAABmmnOVAAAANlBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC3dmhyAAAAEXRSTlMAECAwQFBgcICPn6+/z9/v+OcKdC0AAAFXSURBVHja7dtZcoMwEEXRJxASYh72v9lUJXEqYxj0usWc1bc5QkL+MWn4F3+rFoqEgCIhoEgIKBICikQERSKCIhFBkYigSERQJBCSRGFAIEkUBgSSRGFAIEkUBoQKiSLbdQDRRREBRRQREFAkBBQJAUVCQJEQUCQEFIkIikQERSKCgN19ZZtXBgSQkggCQEoiCAApiSAApCSCAJCSKAtdIggoEgKKhIAiIaBICASJwoBAkigMCCSJwoBAbxJ6ESMCioSAIiGgSAgoEgKKRARFIoIiEUGRiKBIRFAkIigSEQTY4rK2xYBAkCgKCASJooBAkCgKCASJooBAkCgKCA8S8VHsJSLgJeKqOEpEwEnEp/NUZc9LxGWI14jX2UlEwErEdfhRZctKxJ3wqsqOk4g7+6rKhpOIo8WqyoaTiOvVqsqGk4jl1qrKhpOI8etV2XEScaqxqrLnJP64vb9E6D+kzAAAAABJRU5ErkJggg==';
  
  // Função modificada para salvar QR codes localmente
  const generateQRCodeBase64 = async (text: string): Promise<string> => {
    try {
      // Se a biblioteca QRCode não estiver disponível, usar a API externa
      if (!qrCodeLibLoaded) {
        // Usar API externa como fallback
        const encodedText = encodeURIComponent(text || 'Volkswagen');
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodedText}&size=200x200&margin=10`;
        
        const response = await fetch(qrCodeUrl);
        if (!response.ok) {
          throw new Error(`Erro ao buscar QR code: ${response.status}`);
        }
        
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
      
      console.log(`Gerando QR Code para o texto: "${text}"`);
      
      // Usar a biblioteca QRCode local com configurações exatas conforme instruções
      const qrCodeOptions = {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'H' as 'H',
        color: {
          dark: '#000000FF',
          light: '#FFFFFFFF'
        }
      };
      
      // Gerar o QR code como arquivo local
      const sanitizedFilename = text.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
      const filename = `qrcode_${sanitizedFilename}_${Date.now()}.png`;
      const filePath = `${getQRCodeSavePath()}/${filename}`;
      
      try {
        // Gerar o QR code como arquivo físico local
        await QRCode.toFile(filePath, text, qrCodeOptions);
        console.log(`QR Code salvo localmente em: ${filePath}`);
        
        // Também manter o formato base64 para fallback
        const qrBase64 = await QRCode.toDataURL(text, qrCodeOptions);
        
        // Retornar o caminho do arquivo local como URL de arquivo
        return `file://${filePath}`;
      } catch (fileError) {
        console.error('Erro ao salvar QR code como arquivo local:', fileError);
        
        // Fallback para base64 caso o salvamento falhe
        const qrBase64 = await QRCode.toDataURL(text, qrCodeOptions);
        return qrBase64;
      }
    } catch (error) {
      console.error('Erro ao gerar QR code:', error);
      return fallbackQRCode;
    }
  };

  // Função auxiliar para obter o diretório onde salvar os QR codes
  const getQRCodeSavePath = (): string => {
    // Verificar se estamos em ambiente Electron (desktop)
    if (window.require) {
      try {
        const { app } = window.require('electron').remote;
        const path = window.require('path');
        const fs = window.require('fs');
        
        // Criar diretório de cache para QR codes se não existir
        const qrCodeDir = path.join(app.getPath('userData'), 'qrcodes');
        if (!fs.existsSync(qrCodeDir)) {
          fs.mkdirSync(qrCodeDir, { recursive: true });
        }
        
        return qrCodeDir;
      } catch (error) {
        console.error('Erro ao obter caminho para salvar QR codes:', error);
      }
    }
    
    // Fallback para o diretório temporário do sistema
    // Nota: isso não funciona em navegadores comuns, apenas em ambientes Electron
    return '/tmp';
  };

  // Função que simularia o envio dos dados para a API e retornaria um PDF
  const sendToApi = async (processedData: any): Promise<MockApiResponse> => {
    // Simular um tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // Extrair dados necessários
      const layout = processedData.layout;
      const variables = processedData.variables;
      
      console.log('Processando layout:', layout?.name);
      console.log('Total de variáveis:', variables?.length);
      console.log('Total de elementos:', layout?.elements?.length);
      
      // Listar todas as variáveis para depuração
      console.log('Todas as variáveis:', variables.map((v: any) => ({ name: v.name, type: v.type })));
      
      // Força a geração de QRcode para elementos de imagem dinâmicos
      // Isso é uma solução alternativa para garantir que QR codes sejam gerados
      // mesmo que não haja variáveis explicitamente marcadas como 'qrcode'
      const elementsNeedingQRCodes = layout?.elements?.filter((elem: any) => 
        elem.isDynamic && 
        elem.type === 'image' && 
        elem.variableName
      ) || [];
      
      console.log('Elementos que podem precisar de QR codes:', elementsNeedingQRCodes.map((e: any) => ({ 
        name: e.variableName, 
        x: e.x, 
        y: e.y, 
        w: e.width, 
        h: e.height 
      })));
      
      // Pré-processar QR codes para garantir que estejam disponíveis
      // Vamos primeiro gerar todos os QR codes e armazená-los
      const localQrCodesMap = new Map<string, string>();
      
      // Verificar se existem variáveis do tipo qrcode
      const qrCodeVariables = variables.filter((v: any) => v.type === 'qrcode');
      console.log('Variáveis QR code encontradas:', qrCodeVariables.length, qrCodeVariables);
      
      // Se não houver variáveis de QR code mas houver elementos dinâmicos,
      // vamos forçar a geração de QR codes para eles
      if (qrCodeVariables.length === 0 && elementsNeedingQRCodes.length > 0) {
        console.log('Forçando geração de QR codes para elementos dinâmicos...');
        
        // Para cada elemento que pode precisar de QR code
        for (const elem of elementsNeedingQRCodes) {
          // Procurar a variável correspondente
          const variable = variables.find((v: any) => v.name === elem.variableName);
          
          if (variable) {
            console.log(`Gerando QR code para o elemento ${elem.variableName} mesmo sem tipo explícito`);
            
            // Obter o texto para o QR code (pode ser o valor da variável, texto padrão, etc)
            const valueToEncode = variable.value || variable.default_value || variable.name || 'Volkswagen';
            const qrCodeBase64 = await generateQRCodeBase64(valueToEncode);
            
            console.log(`QR Code forçado gerado para: ${elem.variableName}`, qrCodeBase64.substring(0, 50) + '...');
            localQrCodesMap.set(elem.variableName, qrCodeBase64);
          }
        }
      }
      
      // Buscar todos os elementos de QR code e gerar as imagens em base64
      const qrCodesPromises = qrCodeVariables
        .map(async (v: any) => {
          try {
            // Garantir que temos um valor para o QR code
            const valueToEncode = v.value || v.default_value || v.name || 'Volkswagen';
            console.log(`Gerando QR Code para: ${v.name} com valor: ${valueToEncode}`);
            
            const qrCodeBase64 = await generateQRCodeBase64(valueToEncode);
            console.log(`QR Code gerado para: ${v.name}`, qrCodeBase64.substring(0, 50) + '...');
            localQrCodesMap.set(v.name, qrCodeBase64);
            return { name: v.name, base64: qrCodeBase64 };
          } catch (err) {
            console.error(`Erro ao gerar QR code para ${v.name}:`, err);
            localQrCodesMap.set(v.name, fallbackQRCode);
            return { name: v.name, base64: fallbackQRCode };
          }
        });
      
      // Aguardar a geração de todos os QR codes
      await Promise.all(qrCodesPromises);
      
      console.log('QR codes gerados:', localQrCodesMap);
      console.log('Tamanho do mapa de QR codes:', localQrCodesMap.size);
      
      // Listar os QR codes gerados de forma mais clara
      console.log('QR codes gerados:');
      localQrCodesMap.forEach((value, key) => {
        console.log(`- ${key}: ${value.substring(0, 30)}...`);
      });
      
      // Forçar a geração de pelo menos um QR code para demonstração
      if (localQrCodesMap.size === 0) {
        console.log('Nenhum QR code gerado. Criando QR code de demonstração...');
        const demoQRCode = await generateQRCodeBase64("Volkswagen Demo QR Code");
        localQrCodesMap.set('demo_qr_code', demoQRCode);
        
        // Se não temos elementos dinâmicos, vamos criar um para o QR code de demonstração
        if (elementsNeedingQRCodes.length === 0 && layout?.elements?.length > 0) {
          // Adicionar variável para o QR code de demonstração
          variables.push({
            name: 'demo_qr_code',
            type: 'qrcode',
            value: 'Volkswagen Demo QR Code',
            default_value: 'Volkswagen Demo QR Code'
          });
          
          // Adicionar atributos necessários ao primeiro elemento de imagem encontrado
          const firstImageElement = layout.elements.find((elem: any) => elem.type === 'image');
          if (firstImageElement) {
            console.log('Modificando elemento para mostrar QR code de demonstração:', firstImageElement);
            firstImageElement.isDynamic = true;
            firstImageElement.variableName = 'demo_qr_code';
            firstImageElement.dynamicType = 'qrcode';
          }
        }
      }
      
      // Atualizar o estado com os QR codes gerados
      // Importante: Criar uma nova instância do Map para garantir que o React detecte a mudança
      setQrCodesMap(new Map(localQrCodesMap));
      
      // Criar um HTML que represente visualmente o layout com todas as variáveis preenchidas
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Layout Processado: ${layout.name}</title>
          <meta charset="UTF-8">
          <style>
            @page {
              size: ${layout.width}px ${layout.height}px;
              margin: 0;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: white;
              width: ${layout.width}px;
              height: ${layout.height}px;
              position: relative;
              overflow: hidden;
            }
            
            .layout-canvas {
              position: relative;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }
            
            /* Estilos básicos para elementos de layout */
            .element-text {
              position: absolute;
              white-space: pre-wrap;
              font-family: Arial, sans-serif;
            }
            
            .element-image {
              position: absolute;
            }
            
            /* Estilo específico para QR codes - classe atualizada */
            .qr-code-wrapper {
              background: white !important;
              overflow: hidden;
            }
            
            .qr-code-wrapper img {
              background: white !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            /* Remover padding e margens indesejadas */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            /* Ocultar elementos não necessários para impressão */
            .controls {
              display: none;
            }
            
            /* Estilos apenas para pré-visualização (não serão impressos) */
            @media screen {
              body {
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                margin: 30px auto;
              }
              
              .controls {
                position: fixed;
                bottom: 20px;
                left: 0;
                right: 0;
                display: flex;
                justify-content: center;
                z-index: 1000;
              }
              
              .download-pdf-button {
                padding: 10px 20px;
                background-color: #0066cc;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 16px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
              }
              
              .download-pdf-button:hover {
                background-color: #0055aa;
              }
            }
            
            /* Estilos específicos para impressão */
            @media print {
              body { 
                -webkit-print-color-adjust: exact !important; 
                print-color-adjust: exact !important;
                background-color: white !important;
              }
              
              .qr-code-wrapper {
                border: none !important;
                background: white !important;
              }
              
              .qr-code-wrapper img {
                background: white !important;
                filter: contrast(200%);
              }
              
              img[alt="QR Code"] {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background-color: white !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="layout-canvas">
            ${layout.elements.map((element: any) => {
              let content = element.content || '';
              let finalHtml = '';
              
              // Se for um elemento dinâmico
              if (element.isDynamic && element.variableName) {
                const variable = variables.find((v: any) => v.name === element.variableName);
                
                if (variable) {
                  // Elemento de texto
                  if (element.type === 'text' || variable.type === 'text') {
                    const textContent = generateRandomText('text');
                    finalHtml = `
                      <div class="element-text" style="
                        left: ${element.x}px;
                        top: ${element.y}px;
                        width: ${element.width}px;
                        height: ${element.height}px;
                        font-size: ${element.fontSize || '14px'};
                        color: ${element.color || 'black'};
                        ${element.textAlign ? `text-align: ${element.textAlign};` : ''}
                      ">${textContent}</div>
                    `;
                  }
                  // Elemento QR code - versão atualizada para usar arquivo local
                  else if (variable.type === 'qrcode') {
                    const qrCodePath = localQrCodesMap.get(element.variableName) || fallbackQRCode;
                    console.log(`Renderizando QR code para ${element.variableName}`);
                    
                    // Verificar se é um caminho de arquivo local
                    const isLocalFile = qrCodePath.startsWith('file://');
                    
                    finalHtml = `
                      <img 
                        src="${qrCodePath}" 
                        alt="QR Code"
                        style="
                          position: absolute;
                          left: ${element.x}px;
                          top: ${element.y}px;
                          width: ${element.width}px;
                          height: ${element.height}px;
                          background-color: white;
                        "
                        ${isLocalFile ? 'data-local-file="true"' : ''}
                      />
                    `;
                  }
                  // Elemento de imagem
                  else if (element.type === 'image' || variable.type === 'image') {
                    finalHtml = `
                      <img 
                        class="element-image" 
                        src="${variable.value || content}" 
                        alt="Imagem"
                        style="
                          left: ${element.x}px;
                          top: ${element.y}px;
                          width: ${element.width}px;
                          height: ${element.height}px;
                        "
                        onerror="this.onerror=null; this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';"
                      />
                    `;
                  }
                }
              }
              // Elementos estáticos
              else {
                if (element.type === 'text') {
                  finalHtml = `
                    <div class="element-text" style="
                      left: ${element.x}px;
                      top: ${element.y}px;
                      width: ${element.width}px;
                      height: ${element.height}px;
                      font-size: ${element.fontSize || '14px'};
                      color: ${element.color || 'black'};
                      ${element.textAlign ? `text-align: ${element.textAlign};` : ''}
                    ">${content}</div>
                  `;
                }
                else if (element.type === 'image') {
                  finalHtml = `
                    <img 
                      class="element-image" 
                      src="${content}" 
                      alt="Imagem"
                      style="
                        left: ${element.x}px;
                        top: ${element.y}px;
                        width: ${element.width}px;
                        height: ${element.height}px;
                      "
                      onerror="this.onerror=null; this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';"
                    />
                  `;
                }
              }
              
              return finalHtml;
            }).join('')}
          </div>
          
          <div class="controls">
            <button class="download-pdf-button" onclick="window.print()">Baixar PDF</button>
          </div>
          
          <script>
            // Ajustar comportamento de impressão
            window.addEventListener('load', function() {
              var printButton = document.querySelector('.download-pdf-button');
              if (printButton) {
                printButton.addEventListener('click', function() {
                  window.print();
                });
              }
              
              // Verificar se existem QR codes na página e relatar
              var qrCodes = document.querySelectorAll('.qr-code-wrapper');
              console.log('Total de QR codes encontrados:', qrCodes.length);
              
              qrCodes.forEach(function(qr, index) {
                console.log('QR code #' + (index+1) + ':', {
                  posicao: qr.style.left + ',' + qr.style.top,
                  tamanho: qr.style.width + 'x' + qr.style.height,
                  src: qr.querySelector('img') ? qr.querySelector('img').src.substring(0, 30) + '...' : 'não encontrado'
                });
              });
            });
            
            // Adicionar código para lidar com imagens de arquivos locais
            var localImages = document.querySelectorAll('img[data-local-file="true"]');
            console.log('Imagens locais encontradas:', localImages.length);
            
            if (localImages.length > 0) {
              // Se estamos no Electron, usamos Node.js para ler arquivos
              if (window.require) {
                const fs = window.require('fs');
                const { nativeImage } = window.require('electron');
                
                localImages.forEach(function(img) {
                  try {
                    const filePath = img.src.replace('file://', '');
                    const imageData = fs.readFileSync(filePath);
                    const nativeImg = nativeImage.createFromBuffer(imageData);
                    img.src = nativeImg.toDataURL();
                    console.log('Imagem local convertida com sucesso:', filePath);
                  } catch (error) {
                    console.error('Erro ao carregar imagem local:', error);
                    // Fallback para uma imagem base64 em branco
                    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
                  }
                });
              }
            }
          </script>
        </body>
        </html>
      `;
      
      // Criar um Blob que representa o HTML do layout processado
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const pdfUrl = URL.createObjectURL(blob);
      
      // Depuração: verificar se o conteúdo HTML contém QR codes
      const qrCodesEmHTML = (htmlContent.match(/src="data:image\/png;base64,[^"]+"/g) || []).length;
      console.log(`QR Codes incorporados no HTML: ${qrCodesEmHTML}`);
      
      return {
        success: true,
        message: 'Layout processado com sucesso!',
        pdfUrl,
        processedData: {
          ...processedData,
          qrCodes: Object.fromEntries(qrCodesMap)
        }
      };
    } catch (error) {
      console.error('Erro ao processar:', error);
      return {
        success: false,
        message: 'Erro ao processar o PDF. Tente novamente mais tarde.'
      };
    }
  };

  const handleProcessData = async (data: any) => {
    setIsProcessing(true);
    try {
      // Log para depuração - verificar dados recebidos
      console.log('DADOS RECEBIDOS PARA PROCESSAMENTO:', JSON.stringify(data, null, 2));
      console.log('LAYOUT ELEMENTS:', data?.layout?.elements);
      console.log('VARIABLES:', data?.variables);
      
      // Verificar especificamente variáveis QR code
      const qrVariables = data?.variables?.filter((v: any) => v.type === 'qrcode') || [];
      console.log('VARIÁVEIS QR CODE:', qrVariables);
      
      // Procurar elementos dinâmicos que usam variáveis do tipo qrcode
      const qrElements = data?.layout?.elements?.filter((elem: any) => {
        if (elem.isDynamic && elem.variableName) {
          const variable = data.variables.find((v: any) => v.name === elem.variableName);
          return variable && variable.type === 'qrcode';
        }
        return false;
      }) || [];
      
      console.log('ELEMENTOS QR CODE NO LAYOUT:', qrElements);
      
      // Aqui enviaríamos os dados para a API e receberíamos o PDF
      const response = await sendToApi(data);
      setPdfResult(response);
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      setPdfResult({
        success: false,
        message: 'Erro ao processar o PDF. Tente novamente mais tarde.'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Função para baixar o PDF diretamente
  const handleDownloadPDF = () => {
    if (!pdfResult?.pdfUrl) return;
    
    // Abrir em uma nova aba para impressão sem parâmetros extras
    const printWindow = window.open(pdfResult.pdfUrl, '_blank');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para baixar o PDF.');
    }
  };

  return (
    <div className="variables-processor">
      <div className="processor-header">
        <h1>Processamento de Layouts</h1>
        <p>Selecione um layout e preencha as variáveis para gerar o documento final.</p>
      </div>

      <div className="processor-content">
        <FillVariables onProcess={handleProcessData} />
        
        {isProcessing && (
          <div className="processing-overlay">
            <div className="processing-indicator">
              <div className="spinner"></div>
              <p>Processando o layout...</p>
            </div>
          </div>
        )}
        
        {pdfResult && (
          <div className={`api-result ${pdfResult.success ? 'success' : 'error'}`}>
            <h3>{pdfResult.success ? 'Layout Processado' : 'Erro'}</h3>
            <p>{pdfResult.message}</p>
            
            {pdfResult.success && pdfResult.pdfUrl && (
              <div className="result-actions">
                <button 
                  onClick={handleDownloadPDF}
                  className="download-pdf-button"
                >
                  Baixar PDF
                </button>
              </div>
            )}
            
          </div>
        )}
      </div>
    </div>
  );
};

export default VariablesProcessor;