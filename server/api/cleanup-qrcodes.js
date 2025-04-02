const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Configurar pasta de QR codes
const QR_CODE_DIR = path.join(process.cwd(), 'public', 'qrcodes');

// Endpoint para limpar QR codes antigos
router.post('/api/cleanup-qrcodes', (req, res) => {
  try {
    if (!fs.existsSync(QR_CODE_DIR)) {
      return res.status(200).json({
        success: true,
        message: 'Pasta de QR codes não existe',
        removedCount: 0
      });
    }
    
    const files = fs.readdirSync(QR_CODE_DIR);
    const now = Date.now();
    let removedCount = 0;
    
    // Considerar arquivos com mais de 24 horas como antigos
    const MAX_AGE_HOURS = 24;
    
    files.forEach(file => {
      const filePath = path.join(QR_CODE_DIR, file);
      const stats = fs.statSync(filePath);
      const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);
      
      if (ageHours > MAX_AGE_HOURS) {
        fs.unlinkSync(filePath);
        removedCount++;
      }
    });
    
    res.status(200).json({
      success: true,
      message: `${removedCount} QR codes antigos removidos`,
      removedCount
    });
  } catch (error) {
    console.error('Erro ao limpar QR codes antigos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar QR codes antigos',
      error: String(error)
    });
  }
});

module.exports = router; 