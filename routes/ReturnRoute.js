const express = require('express');


const {
  getReturns,
  getReturn,
  createReturn,
  updateReturn,
  deleteReturn,
} = require('../services/ReturnService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(
       authService.protect,
       authService.allowedTo('admin', 'storage_employee'),getReturns)
  .post(
    authService.protect,
    authService.allowedTo('admin', 'storage_employee'),
    createReturn
  );

router
  .route('/:id')
  .get(authService.protect,
    authService.allowedTo('admin', 'storage_employee'),getReturn)
  .put(
    authService.protect,
    authService.allowedTo('admin', 'storage_employee'),
    updateReturn
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteReturn
  );

module.exports = router;
