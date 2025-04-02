import QRCode from 'qrcode';

// Para ambiente de navegador, não podemos acessar o sistema de arquivos diretamente
// então vamos usar uma abordagem baseada em API

// Caminho base para QR codes
const QR_CODE_BASE_URL = '/qrcodes';

/**
 * Gera um QR Code e envia para o servidor salvar como arquivo físico
 */
export async function generateAndSaveQRCode(text: string): Promise<string> {
  try {
    // Gerar nome de arquivo sanitizado
    const sanitizedText = text.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 20);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filename = `qrcode_${sanitizedText}_${timestamp}_${randomId}.png`;
    
    // Gerar QR code como base64
    const qrBase64 = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000FF',
        light: '#FFFFFFFF'
      }
    });
    
    // Enviar para o servidor salvar como arquivo
    const formData = new FormData();
    formData.append('qrData', qrBase64);
    formData.append('filename', filename);
    
    const response = await fetch('/api/save-qrcode', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao salvar QR code: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Retornar URL pública para o arquivo
    return `${QR_CODE_BASE_URL}/${filename}`;
  } catch (error) {
    console.error('Erro ao gerar e salvar QR code:', error);
    throw error;
  }
} 