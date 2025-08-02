const express = require('express');
const app = express();
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authJWT = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler');
require('dotenv/config');

// middleware 
app.use(cors());
app.use(/(.*)/, cors()); // without double quotes
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJWT());
app.use('/public/uploads', express.static(__dirname + '/public/uploads'));
app.use(errorHandler);

const api = process.env.API_URL || '/api/v1';
console.log('API_URL:', api);

// Routers
const productRouter = require('./routers/products');
const userRouter = require('./routers/users');
const orderRouter = require('./routers/orders');
const categoryRouter = require('./routers/categories');

// Route
app.use(`${api}/products`, productRouter);
app.use(`${api}/users`, userRouter);
app.use(`${api}/orders`, orderRouter);
app.use(`${api}/categories`, categoryRouter);


mongoose.connect(process.env.CONNECTION_STRING).then(()=> {
    console.log('Database connection is ready...');
}).catch((err) => {
    console.log(err);
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});