const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();

// Configurar pasta para salvar QR codes
const QR_CODE_DIR = path.join(process.cwd(), 'public', 'qrcodes');

// Criar diretório se não existir
if (!fs.existsSync(QR_CODE_DIR)) {
  fs.mkdirSync(QR_CODE_DIR, { recursive: true });
  console.log('Pasta para QR codes criada:', QR_CODE_DIR);
}

// Configurar upload
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint para salvar QR code
router.post('/api/save-qrcode', upload.none(), (req, res) => {
  try {
    const { qrData, filename } = req.body;
    
    if (!qrData || !filename) {
      return res.status(400).json({
        success: false,
        message: 'Dados do QR code ou nome do arquivo não fornecidos'
      });
    }
    
    // Extrair dados base64
    const base64Data = qrData.replace(/^data:image\/png;base64,/, '');
    
    // Caminho completo do arquivo
    const filePath = path.join(QR_CODE_DIR, filename);
    
    // Salvar o arquivo
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    console.log(`QR code salvo com sucesso em: ${filePath}`);
    
    // Retornar sucesso
    res.status(200).json({
      success: true,
      message: 'QR code salvo com sucesso',
      filePath: `/qrcodes/${filename}`
    });
  } catch (error) {
    console.error('Erro ao salvar QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao salvar QR code',
      error: String(error)
    });
  }
});

// Endpoint para verificar/criar pasta de QR codes
router.post('/api/check-qrcodes-folder', (req, res) => {
  try {
    // Verificar se a pasta existe
    if (!fs.existsSync(QR_CODE_DIR)) {
      fs.mkdirSync(QR_CODE_DIR, { recursive: true });
      console.log('Pasta para QR codes criada:', QR_CODE_DIR);
    }
    
    // Contar arquivos na pasta
    const files = fs.readdirSync(QR_CODE_DIR);
    
    res.status(200).json({
      success: true,
      message: 'Pasta de QR codes verificada',
      path: QR_CODE_DIR,
      filesCount: files.length
    });
  } catch (error) {
    console.error('Erro ao verificar pasta de QR codes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar pasta de QR codes',
      error: String(error)
    });
  }
});

module.exports = router; 