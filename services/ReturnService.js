const Return = require('../models/ReturnModel');
const factory = require('./handlersFactory');

exports.createReturn = factory.createOne(Return);

exports.getReturn = factory.getOne(Return,'Clint');

exports.getReturns = factory.getAll(Return);

exports.updateReturn = factory.updateOne(Return);

exports.deleteReturn = factory.deleteOne(Return);
