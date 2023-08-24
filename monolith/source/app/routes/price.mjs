import express from 'express';
import { getSkuById } from './sku.mjs';
import { httpMessage, requiredColumns, tableColumns } from '../modules/constants.mjs';
import { Price, Sku } from '../modules/models.mjs';
import * as Fn from '../modules/system.mjs';

export const createPrice = async function(skuId, request) {
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

export const deletePrice = async function(skuId) {
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

export const getPrice = async function(skuId, query) {
    try {
        const float = ['retail', 'sale'];
        const masked = ['sku_id'];
        
        return await Price.findOne({
            include: {
                model: Sku,
                attributes: [],
                required: true
            },
            attributes: Fn.selectFields(query.field, tableColumns.price, masked),
            where: { sku_id: skuId }
        }).then(function(price) {
            return !Fn.isEmpty(price) ? (
                price.dataValues = Fn.toFloat(Fn.toObject(price.dataValues), float),
                price.dataValues) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const updatePrice = async function(skuId, request) {
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

/* create /skus/{skuId}/price */
router.post('/', async function(req, res) {
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
    
    const sku = await getSkuById(skuId, { field: 'created' });
    
    if (!Fn.isObject(sku)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(sku)) {
        status = 404;
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

/* get /skus/{skuId}/price */
router.get('/', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const price = await getPrice(skuId, req.query);
    
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
    
    status = 200;
    res.status(status).json(price);
    Fn.httpLog(req, status, JSON.stringify(price).length);
});

/* update /skus/{skuId}/price */
router.put('/', async function(req, res) {
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

/* delete /skus/{skuId}/price */
router.delete('/', async function(req, res) {
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
router.all('/', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;