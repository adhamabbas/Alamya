const userRoute = require('./userRoute');
const authRoute = require('./authRoute');
const ProductRoute = require('./productRoute');
const BuyRoute = require('./BuyRoute');
const SellRoute = require('./SellRoute');
const ClintRoute = require('./ClintRoute');
const SupplayrRoute = require('./SupplayrRoute');
const Buy_bell = require('./Buy_bellRoute');
const Sell_bell = require('./Sell_bellRoute');
const Warehouse = require('./WarehouseRoute');
const Clint_Tax = require('./Clint_TaxRoute');
const Supplayr_Tax = require('./Supplayr_TaxRoute');
const Sell_Supplayr = require('./Sell_SupplayrRoute');
const Sell_bellSupplayr = require('./Sell_bellSupplayrRoute');
const Return = require('./ReturnRoute');
const Return_Check = require('./ReturnCheckRoute');
const Report = require('./ReportRoute');





const mountRoutes = (app) => {
  
  app.use('/api/v1/users', userRoute);
  app.use('/api/v1/auth', authRoute);
  app.use('/api/v1/products', ProductRoute);
  app.use('/api/v1/buys', BuyRoute);
  app.use('/api/v1/sells', SellRoute);
  app.use('/api/v1/supplayrs', SupplayrRoute);
  app.use('/api/v1/clints', ClintRoute);
  app.use('/api/v1/buy_bell', Buy_bell);
  app.use('/api/v1/sell_bell', Sell_bell);
  app.use('/api/v1/warehous', Warehouse);
  app.use('/api/v1/clint_Tax', Clint_Tax);
  app.use('/api/v1/supplayr_Tax', Supplayr_Tax);
  app.use('/api/v1/sell_supplayr', Sell_Supplayr);
  app.use('/api/v1/sell_bellsupplayr', Sell_bellSupplayr);
  app.use('/api/v1/return',Return);
  app.use('/api/v1/return_check',Return_Check);
  app.use('/api/v1/report', Report);

}
module.exports = mountRoutes;
