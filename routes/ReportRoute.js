const express = require('express');
const authService = require('../services/authService');
const { generateReport ,generateAugustReport} = require('../services/Report');
const router = express.Router();

router.get('/', authService.protect, authService.allowedTo('admin','storage_employee'),
  async (req, res) => {
    try {
      // استدعاء دالة generateReport بدون معلمات
      const report = await generateReport();
      res.status(200).json({
        status: 'success',
        data: report
      });
    } catch (err) {
      res.status(500).json({
        status: 'error',
        message: err.message,
      
      });
    }
  }
);
router.get('/augst',generateAugustReport)
module.exports = router;