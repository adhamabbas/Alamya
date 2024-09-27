const express = require('express');


const {
  getClints,
  getClint,
  createClint,
  updateClint,
  deleteClint,
  getClientDetails,
  exportClientDetailsToExcel,
  exportClintCheakToExcel,
} = require('../services/ClintService');

const authService = require('../services/authService');

const router = express.Router();

router
  .route('/')
  .get(getClints)
  .post(
    authService.protect,
    authService.allowedTo('admin'),
    createClint
  );

router
  .route('/:id')
  .get(getClint)
  .put(
    authService.protect,
    authService.allowedTo('admin'),
    updateClint
  )
  .delete(
    authService.protect,
    authService.allowedTo('admin'),
    deleteClint
  );
router
  .route('/:clientId/details') 
  .get(
    authService.protect,
    authService.allowedTo('admin'),getClientDetails); 
    router
  .route('/details/export')
  .get(exportClientDetailsToExcel);
 /* router
  .route('/:clientId/export')
  .get(exportClintCheakToExcel);*/

module.exports = router;
