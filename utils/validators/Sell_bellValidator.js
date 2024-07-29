
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createSell_bellValidator = [
  check('clint')
    .notEmpty()
    .withMessage('clint name is required'),

  
    check('payBell')
    .notEmpty()
    .withMessage('price is required'),

    check('paymentMethod')
    .notEmpty()
    .withMessage(' payment Method is required'),

   check('user')
   .isMongoId()
   .withMessage('Invalid user id format'),
  
  validatorMiddleware,
];

exports.getSell_bellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.updateSell_bellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.deleteSell_bellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];
