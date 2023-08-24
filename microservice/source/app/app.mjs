import cors from 'cors';
import express from 'express';
import http from 'http';
// import https from 'https';

import asset from './routes/asset.mjs';
import description from './routes/description.mjs';
import inventory from './routes/inventory.mjs';
import price from './routes/price.mjs';
import product from './routes/product.mjs';
import rating from './routes/rating.mjs';
import review from './routes/review.mjs';
import sku from './routes/sku.mjs';
import store from './routes/store.mjs';

import { basePath, httpMessage, microservice, /* tls */ } from './modules/constants.mjs';
import { httpLog, systemLog } from './modules/system.mjs';

const app = express();

app.use(cors());
app.use(express.json());

switch (microservice) {
    case 'assets':
        app.use(`${basePath}/assets`, asset);
        break;
    case 'description':
        app.use(`${basePath}/description`, description);
        break;
    case 'inventory':
        app.use(`${basePath}/inventory`, inventory);
        break;
    case 'price':
        app.use(`${basePath}/price`, price);
        break;
    case 'products':
        app.use(`${basePath}/products`, product);
        break;
    case 'rating':
        app.use(`${basePath}/rating`, rating);
        break;
    case 'reviews':
        app.use(`${basePath}/reviews`, review);
        break;
    case 'skus':
        app.use(`${basePath}/skus`, sku);
        break;
    case 'stores':
        app.use(`${basePath}/stores`, store);
        break;
    default:
        app.use(`${basePath}/assets`, asset);
        app.use(`${basePath}/description`, description);
        app.use(`${basePath}/inventory`, inventory);
        app.use(`${basePath}/price`, price);
        app.use(`${basePath}/products`, product);
        app.use(`${basePath}/rating`, rating);
        app.use(`${basePath}/reviews`, review);
        app.use(`${basePath}/skus`, sku);
        app.use(`${basePath}/stores`, store);
}

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