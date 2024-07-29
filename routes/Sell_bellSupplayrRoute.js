const express = require('express');


const {
  getSell_bellSupplayrs,
  getSell_bellSupplayr,
  createSell_bellSupplayr,
  updateSell_bellSupplayr,
  deleteSell_bellSupplayr,
} = require('../services/Sell_bellSupplayrService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(getSell_bellSupplayrs)
  .post(
    authService.protect,
    authService.allowedTo('admin', 'manager'),
    createSell_bellSupplayr
  );

router
  .route('/:id')
  .get(getSell_bellSupplayr)
  .put(
    authService.protect,
    authService.allowedTo('admin', 'manager'),
    updateSell_bellSupplayr,
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteSell_bellSupplayr
  );

module.exports = router;
