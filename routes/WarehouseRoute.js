
const express = require('express');
const {
  getWarehouses,
  getWarehouse,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  printProductComparisonExcel,
  
} = require('../services/WarehouseService');
const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(
    authService.protect,
    authService.allowedTo('admin2', 'storage_employee'),getWarehouses)
  .post(
    createWarehouse
  );
router
  .route('/:id')
  .get(
    authService.protect,
    authService.allowedTo('admin2', 'storage_employee'),getWarehouse)
  .put(
    authService.protect,
    authService.allowedTo('admin2'),
    updateWarehouse
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin2'),
    deleteWarehouse
  );
 

  router
  .route('/export/size')
  .get(
    printProductComparisonExcel
  );


module.exports = router;
