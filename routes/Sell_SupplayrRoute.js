const express = require('express');


const {
  getSell_supplayrs,
  getSell_supplayr,
  createSell_supplayr,
  updateSell_supplayr,
  deleteSell_supplayr,
} = require('../services/sell_SupplayrService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(getSell_supplayrs)
  .post(
    authService.protect,
    authService.allowedTo('admin', 'manager'),
    createSell_supplayr
  );

router
  .route('/:id')
  .get(getSell_supplayr)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateSell_supplayr
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteSell_supplayr
  );

module.exports = router;
