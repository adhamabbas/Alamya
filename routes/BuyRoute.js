const express = require('express');

const {
  getBuyValidator,
  createBuyValidator,
  updateBuyValidator,
  deleteBuyValidator,
} = require('../utils/validators/BuyValidator');

const {
  getBuys,
  getBuy,
  createBuy,
  updateBuy,
  deleteBuy,
  exportToExcel,
  
} = require('../services/BuyService');


const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(
    authService.protect,
    authService.allowedTo('admin','storage_employee'),
    getBuys)
  .post(
    authService.protect,
    authService.allowedTo('admin','storage_employee'),
    createBuyValidator,
    createBuy
  );
router
  .route('/:id')
  .get(
    authService.protect,
    authService.allowedTo('admin', 'storage_employee'),getBuyValidator,getBuy)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateBuyValidator,
    updateBuy
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteBuyValidator,
    deleteBuy
  );
  
router
  .route('/export/excel')
  .get(exportToExcel);
  


module.exports = router;
