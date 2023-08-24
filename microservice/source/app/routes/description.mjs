import express from 'express';
import { endpoint, httpMessage, requiredColumns, tableColumns, tls } from '../modules/constants.mjs';
import { Description } from '../modules/models.mjs';
import { httpReq } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createDescription = async function(skuId, request) {
    try {
        const masked = ['sku_id'];
        
        return await Description.findOrCreate({
            defaults: Fn.pruneObject(request, masked, false),
            fields: [...requiredColumns.description, ...masked],
            where: { sku_id: skuId }
        }).then(function(created) {
            return created[1];
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const deleteDescription = async function(skuId) {
    try {
        return await Description.destroy({
            where: { sku_id: skuId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getDescription = async function(skuId, query) {
    try {
        const masked = [];
        
        return await Description.findOne({
            attributes: Fn.selectFields(query.field, tableColumns.description, masked),
            where: { sku_id: skuId }
        }).then(function(description) {
            return !Fn.isEmpty(description) ? Fn.toObject(description.dataValues) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getSkus = async function(query) {
    try {
        const hidden = ['created', 'updated'];
        
        return await Description.findAll({
            attributes: ['sku_id'],
            where: Fn.selectWhere(query, tableColumns.description, hidden),
            order: [['sku_id', 'ASC']],
            limit: Number(query.limit) || undefined,
            offset: Number(query.offset) || undefined
        }).then(function(skus) {
            return skus.map(function(sku) {
                return sku.dataValues.sku_id;
            });
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const updateDescription = async function(skuId, request) {
    try {
        const masked = ['sku_id'];
        
        return await Description.update({
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

/* create /description/{skuId} */
router.post('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
     
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.description, true)) {
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
    
    const created = await createDescription(skuId, req.body);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /description */
router.get('/', async function(req, res) {
    let response, status;
    
    const skus = await getSkus(req.query);
    
    if (!Fn.isArray(skus)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(skus)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(skus);
    Fn.httpLog(req, status, JSON.stringify(skus).length);
});

/* get /description/{skuId} */
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
    
    const [description, sku] = await Promise.all([
        getDescription(skuId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isObject(description) || !Fn.isObject(sku.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(description)) {
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
    res.status(status).json(description);
    Fn.httpLog(req, status, JSON.stringify(description).length);
});

/* update /description/{skuId} */
router.put('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.description, false)) {
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
    
    const description = await getDescription(skuId, { field: 'created' });
    
    if (!Fn.isObject(description)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(description)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await updateDescription(skuId, req.body);
    
    status = updated === true ? 200 : updated === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /description/{skuId} */
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
    
    const description = await getDescription(skuId, { field: 'created' });
    
    if (!Fn.isObject(description)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(description)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const deleted = await deleteDescription(skuId) ? 200 : 500;
    
    status = deleted ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* default route */
router.all('/:skuId?', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;