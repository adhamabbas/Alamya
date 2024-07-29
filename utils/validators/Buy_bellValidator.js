
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createBuy_bellValidator = [
  check('supplayr')
  .isMongoId()
  .withMessage('Invalid user id format')
  .notEmpty()
  .withMessage('supplayr name is required'),
  
  check('pay_bell')
    .notEmpty()
    .withMessage('price is required'),
   
  check('payment_method')
    .notEmpty()
    .withMessage('price is required'),
  
  check('user')
   .isMongoId()
   .withMessage('Invalid user id format'),
  
  validatorMiddleware,
];

exports.getBuy_bellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.updateBuy_bellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.deleteBuy_bellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];
