import express from 'express';
import { endpoint, httpMessage, requiredColumns, tableColumns, tls } from '../modules/constants.mjs';
import { Price } from '../modules/models.mjs';
import { httpReq } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createPrice = async function(skuId, request) {
    try {
        const masked = ['sku_id'];
        return await Price.findOrCreate({
            defaults: Fn.pruneObject(request, masked, false),
            fields: [...requiredColumns.price, ...masked],
            where: { sku_id: skuId }
        }).then(function(created) {
            return created[1];
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const deletePrice = async function(skuId) {
    try {
        return await Price.destroy({
            where: { sku_id: skuId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getPrice = async function(skuId, query) {
    try {
        const float = ['retail', 'sale'];
        const masked = [];
        return await Price.findOne({
            attributes: Fn.selectFields(query.field, tableColumns.price, masked),
            where: { sku_id: skuId }
        }).then(function(price) {
            return !Fn.isEmpty(price) ? (
                price.dataValues = Fn.toFloat(price.dataValues, float),
                price.dataValues) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const updatePrice = async function(skuId, request) {
    try {
        const masked = ['sku_id'];
        return  await Price.update({
            ...Fn.pruneObject(request, masked, false),
            ...{ updated: new Date().toISOString() }
        }, {
            where: { sku_id: skuId }
        }).then(function(row) {
            return row[0] === 1;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const router = express.Router({ mergeParams: true });

/* create /price/{skuId} */
router.post('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
     
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.price, true)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
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
    
    const created = await createPrice(skuId, req.body);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /price/{skuId} */
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
    
        const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const [price, sku] = await Promise.all([
        getPrice(skuId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isObject(price) || !Fn.isObject(sku.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(price)) {
        status = 404;
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
    
    status = 200;
    res.status(status).json(price);
    Fn.httpLog(req, status, JSON.stringify(price).length);
});

/* update /price/{skuId} */
router.put('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body, ['sale']);
    
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.price, false)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (!req.is('application/json')) {
        status = 415;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const price = await getPrice(skuId, { field: 'created' });
    
    if (!Fn.isObject(price)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(price)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await updatePrice(skuId, req.body);
    
    status = updated === true ? 200 : updated === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /price/{skuId} */
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
    
    const price = await getPrice(skuId, { field: 'created' });
    
    if (!Fn.isObject(price)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(price)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const deleted = await deletePrice(skuId);
    
    status = deleted ? 200 : 500;
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