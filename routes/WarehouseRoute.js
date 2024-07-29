
const express = require('express');
const {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  printExcel,
  
} = require('../services/WarehouseService');
const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(
    authService.protect,
    authService.allowedTo('admin', 'storage_employee'),getWarehouses)
  .post(
    createWarehouse
  );
router
  .route('/:id')
  .get(
    authService.protect,
    authService.allowedTo('admin', 'storage_employee'),getWarehouse)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateWarehouse
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteWarehouse
  );
  router
  .route('/export/excel')
  .get(
    printExcel
  );


module.exports = router;
