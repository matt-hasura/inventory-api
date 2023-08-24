import cors from 'cors';
import express from 'express';
import http from 'http';
// import https from 'https';
// import { tls } from './modules/constants.mjs';

import asset from './routes/asset.mjs';
import description from './routes/description.mjs';
import inventory from './routes/inventory.mjs';
import price from './routes/price.mjs';
import product from './routes/product.mjs';
import rating from './routes/rating.mjs';
import review from './routes/review.mjs';
import sku from './routes/sku.mjs';
import store from './routes/store.mjs';

import { basePath, httpMessage, /* tls */ } from './modules/constants.mjs';
import { httpLog, systemLog } from './modules/system.mjs';

const app = express();

app.use(cors());
app.use(express.json());
app.use(`${basePath}/products/:skuId`, product);
app.use(`${basePath}/skus`, sku);
app.use(`${basePath}/skus/:skuId/assets`, asset);
app.use(`${basePath}/skus/:skuId/description`, description);
app.use(`${basePath}/skus/:skuId/inventory`, inventory);
app.use(`${basePath}/skus/:skuId/price`, price);
app.use(`${basePath}/skus/:skuId/rating`, rating);
app.use(`${basePath}/skus/:skuId/reviews`, review);
app.use(`${basePath}/stores`, store);

/* invalid request body */
app.use(function(error, req, res, next) {
    if (error instanceof SyntaxError && 'body' in error && error.type.includes('parse.failed')) {
        systemLog(error);
    }
    
    next();
});

/* default route */
app.all('*', function(req, res) {
    const statusCode = 400;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    httpLog(req, statusCode, JSON.stringify(response).length);
});

const httpServer = http.createServer(app);

httpServer.listen(80, function() {
    systemLog('Server listening on port 80');
});

/* uncomment for https server */
// const httpsServer = https.createServer({
//     cert: tls.cert,
//     key: tls.key
// }, app);

// httpsServer.listen(443, function() {
//     systemLog('Server listening on port 443');
// });