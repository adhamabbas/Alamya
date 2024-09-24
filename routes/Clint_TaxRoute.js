const express = require('express');


const {
  getTax_clints,
  getTax_clint,
  createTax_clint,
  updateTax_clint,
  deleteTax_clint,
} = require('../services/Clint_TaxService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get( authService.protect,
        authService.allowedTo('admin','manager'),getTax_clints)
  .post(
    authService.protect,
    authService.allowedTo('admin','manager'),
    createTax_clint
  );

router
  .route('/:id')
  .get(
    authService.protect,
    authService.allowedTo('admin','manager'),getTax_clint)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateTax_clint
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteTax_clint
  );

module.exports = router;
