const mongoose = require('mongoose');

let db =String(process.env.DB_URI);

const dbConnection = () => {
mongoose.set('strictQuery', true);
  mongoose
    .connect(db,{ useNewUrlParser: true, useUnifiedTopology: true  })
    .then((conn) => {
      console.log(`Database Connected: ${conn.connection.host}`);
    })
    .catch((err) => {
      console.error(`Database Error: ${err}`);
     process.exit(1);
    });
};

module.exports = dbConnection;
