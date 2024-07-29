
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createSellValidator = [

    check('clint')
      .isMongoId()
      .withMessage('Invalid clint id format'),

    check('o_wieght')
    .notEmpty()
    .withMessage('wieght is required'),

    check('priceForKilo')
    .notEmpty()
    .withMessage('price is required'),
    
    check('price_allQuantity')
    .notEmpty()
    .withMessage('price is required'),
    
    check('product_code')
    .notEmpty()
    .withMessage('price is required'),
    
    check('user')
   .isMongoId()
   .withMessage('Invalid user id format'),

    check('product')
    .isMongoId()
    .withMessage('Invalid product id format'),
  
   validatorMiddleware,
];

exports.getSellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.updateSellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.deleteSellValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];
