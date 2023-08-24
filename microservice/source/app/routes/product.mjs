import express from 'express';
import { endpoint, httpMessage, requiredColumns, tls } from '../modules/constants.mjs';
import { httpReq, httpReqBody } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createProduct = async function(skuId, req) {
    try {
        const options = {
            ca: tls.ca,
            headers: {
                'Content-Type': 'application/json',
                traceparent: req.headers.traceparent || null
            }
        };
        
        const sku = await httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`), {...options, ...{ method: 'POST' }});
        
        if (sku.code === 201) {
            options.method = 'POST';
            const results = await Promise.all(Object.keys(req.body).map(function(key) {
                return httpReqBody(Fn.buildUrl(`${endpoint[key]}/${skuId}`), options, JSON.stringify(req.body[key]));
            }));
            
            const status = results.filter(function(result) {
                return result.code !== 201;
            });
            
            return Fn.isEmpty(status) ? sku.code : status[0].code;
        }
        
        return sku.code;
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const deleteProduct = async function(skuId, req) {
    try {
        const options = {
            ca: tls.ca,
            headers: {
                traceparent: req.headers.traceparent || null
            },
            method: 'DELETE'
        };
        
        const endpoints = Object.keys(Fn.pruneObject({...endpoint}, ['products', 'stores']));
        const results = await Promise.all(endpoints.map(function(key) {
            return httpReq(Fn.buildUrl(`${endpoint[key]}/${skuId}`), options);
        }));
        
        const status = results.filter(function(result) {
            return result.code !== 200 && result.code !== 404;
        });
        
        return Fn.isEmpty(status) ? 200 : status[0].code;
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getProduct = async function(skuId, req) {
    try {
        const options = {
            ca: tls.ca,
            headers: {
                traceparent: req.headers.traceparent || null
            }
        };
        
        const endpoints = Object.keys(Fn.pruneObject({...endpoint}, ['products', 'stores']));
        const results = await Promise.all(endpoints.map(function(key) {
            return httpReq(Fn.buildUrl(`${endpoint[key]}/${skuId}`, req.query), options);
        }));
        
        if (!results.some(result => result.code !== 404) || results[6].code !== 200) {
            return {};
        }
        
        const assets = results[0].code === 200 ? results[0].data.map(result => (delete result.sku_id, result)) : [];
        const description = results[1].code === 200 ? (delete results[1].data.sku_id, results[1].data) : null;
        const inventory = results[2].code === 200 ? results[2].data.map(result => (delete result.sku_id, result)) : [];
        const price = results[3].code === 200 ? (delete results[3].data.sku_id, results[3].data) : null;
        const rating = results[4].code === 200 ? (delete results[4].data.sku_id, results[4].data) : null;
        const reviews = results[5].code === 200 ? results[5].data.map(result => (delete result.sku_id, result)) : [];
        const sku = results[6].code === 200 ? results[6].data : null;
        
        return {
            assets: assets,
            created: sku.created,
            description: description,
            inventory: inventory,
            price: price,
            rating: rating,
            reviews: reviews,
            sku_id: sku.sku_id,
            updated: sku.updated
        };
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const updateProduct = async function(skuId, req) {
    try {
        const options = {
            ca: tls.ca,
            headers: {
                'Content-Type': 'application/json',
                traceparent: req.headers.traceparent || null
            },
            method: 'PUT'
        };
        
        const results = await Promise.all(Object.keys(req.body).map(function(key) {
            return httpReqBody(Fn.buildUrl(`${endpoint[key]}/${skuId}`), options, JSON.stringify(req.body[key]));
        }));
        
        const status = results.filter(function(result) {
            return result.code !== 200;
        });
        
        return Fn.isEmpty(status) ? 200 : status[0].code;
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const router = express.Router({ mergeParams: true });

/* create /products/{skuId} */
router.post('/:skuId', async function(req, res) {
    const columns = {...requiredColumns};
    const components = ['assets', 'description', 'inventory', 'price', 'rating'];
    const skuId = Number(req.params.skuId);
    let response, status;
    
    columns.inventory = [...columns.inventory, 'store_id'];
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    for (const key of components) {
        if (!Fn.isArrayOrObject(req.body[key]) || !Fn.isValidRequest(req.body[key], columns[key], true)) {
            status = 400;
            response = Fn.setResponse(status);
            res.status(status).json(response);
            Fn.httpLog(req, status, JSON.stringify(response).length);
            return;
        }
    }
    
    if (!req.is('application/json')) {
        status = 415;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const sku = await httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`), options);
    
    if (!Fn.isObject(sku.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (sku.code === 200) {
        status = 409;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (sku.code === 400 || sku.code === 500) {
        status = sku.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = await createProduct(skuId, req);
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
    return;
});

/* get /products/{skuId} */
router.get('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const product = await getProduct(skuId, req);
    
    if (!Fn.isObject(product)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(product)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(product);
    Fn.httpLog(req, status, JSON.stringify(product).length);
});

/* update /products/{skuId} */
router.put('/:skuId', async function(req, res) {
    const columns = {...requiredColumns};
    const skuId = Number(req.params.skuId);
    let response, status;
    
    columns.assets = [...columns.assets, 'asset_id'];
    columns.inventory = [...columns.inventory, 'store_id'];
    
    req.body = Fn.pruneEmpty(req.body, ['sale']);
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    for (const key in req.body) {
        if (!Fn.isArrayOrObject(req.body[key]) || !Fn.isValidRequest(req.body[key], columns[key], false)) {
            console.log("HERE");
            status = 400;
            response = Fn.setResponse(status);
            res.status(status).json(response);
            Fn.httpLog(req, status, JSON.stringify(response).length);
            return;
        }
    }
    
    if (!req.is('application/json')) {
        status = 415;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const sku = await httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options);
    
    if (!Fn.isObject(sku.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (sku.code !== 200) {
        status = sku.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = await updateProduct(skuId, req);
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /products/{skuId} */
router.delete('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const sku = await httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`), options);
    
    if (!Fn.isObject(sku.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (sku.code !== 200) {
        status = sku.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = await deleteProduct(skuId, req);
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* default route */
router.all('/:skuId', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;