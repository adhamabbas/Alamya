const express = require('express');

const {
  getSupplayrs,
  getSupplayr,
  createSupplayr,
  updateSupplayr,
  deleteSupplayr,
  getSupplayrDetails,
  exportSupplayrDetailsToExcel,
} = require('../services/SupplayrService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(getSupplayrs)
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    createSupplayr
  );

router
  .route('/:id')
  .get(getSupplayr)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateSupplayr
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteSupplayr
  );
  router
  .route('/:supplayrId/details') 
  .get(
    authService.protect,
    authService.allowedTo('admin'),getSupplayrDetails);

 router
  .route('/:supplayrId/exportToExcel')
  .get(exportSupplayrDetailsToExcel);
module.exports = router;
