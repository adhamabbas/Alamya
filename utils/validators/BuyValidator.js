
const { check, body } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');

exports.createBuyValidator = [
  check('supplayr')
  .isMongoId()
  .withMessage('Invalid user id format'),

    
  check('E_wieght')
    .notEmpty()
    .withMessage('wieght is required'),
    
  check('price_Kilo')
    .notEmpty()
    .withMessage('price is required'),
    
  check('price_all')
    .notEmpty()
    .withMessage('price is required'),
    
  check('pay')
    .notEmpty()
    .withMessage('price is required'),

  check('size')
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

exports.getBuyValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.updateBuyValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.deleteBuyValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];
