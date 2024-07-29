const express = require('express');


const {
  getTax_supplayrs,
  getTax_supplayr,
  createTax_supplayr,
  updateTax_supplayr,
  deleteTax_supplayr,
} = require('../services/Supplayr_TaxService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(
    authService.protect,
    authService.allowedTo('admin', 'manager'),getTax_supplayrs)
  .post(
    authService.protect,
    authService.allowedTo('admin', 'manager'),
    createTax_supplayr
  );

router
  .route('/:id')
  .get(
    authService.protect,
    authService.allowedTo('admin', 'manager'),getTax_supplayr)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateTax_supplayr
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteTax_supplayr
  );

module.exports = router;
