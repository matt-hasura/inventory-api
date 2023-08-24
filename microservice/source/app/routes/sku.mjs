import express from 'express';
import { endpoint, httpMessage, requiredColumns, tableColumns, tls } from '../modules/constants.mjs';
import { Sku } from '../modules/models.mjs';
import { httpReq } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createSku = async function(skuId) {
    try {
        return await Sku.findOrCreate({
            fields: ['sku_id'],
            where: { sku_id: skuId }
        }).then(function(created) {
            return created[1];
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const deleteSku = async function(skuId) {
    try {
        return await Sku.destroy({
            where: { sku_id: skuId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getSkuById = async function(skuId, query) {
    try {
        const masked = [];
        return await Sku.findByPk(skuId, {
            attributes: Fn.selectFields(query.field, tableColumns.sku, masked)
        }).then(function(sku) {
            return !Fn.isEmpty(sku) ? Fn.toObject(sku.dataValues) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getSkus = async function(query) {
    try {
        return await Sku.findAll({
            attributes: ['sku_id'],
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

const router = express.Router();

/* create /skus/{skuId} */
router.post('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const created = await createSku(skuId);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /skus */
router.get('/', async function(req, res) {
    let response, status;
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    console.log(!Fn.containsKey(req.query, requiredColumns.description));

    const [all, filtered] = await Promise.all([
        getSkus({}),
        Fn.containsKey(req.query, tableColumns.description) ?
            httpReq(Fn.buildUrl(`${endpoint.description}`, req.query), options) : null
    ]);
    
    if (!Fn.isArray(all)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(all)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (filtered && filtered.code !== 200) {
        status = filtered.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const skus = filtered ? Fn.arrayIntersection(all, filtered.data) : all;
    
    status = 200;
    res.status(status).json(skus);
    Fn.httpLog(req, status, JSON.stringify(skus).length);
});

/* get /skus/{skuId} */
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
    
    const sku = await getSkuById(skuId, req.query);
    
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
    
    status = 200;
    res.status(status).json(sku);
    Fn.httpLog(req, status, JSON.stringify(sku).length);
});

/* delete /skus/{skuId} */
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
        },
        method: 'DELETE'
    };
    
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
    
    const endpoints = Object.keys(Fn.pruneObject({...endpoint}, ['products', 'skus', 'stores']));
    const promises = endpoints.map(function(key) {
        return httpReq(Fn.buildUrl(`${endpoint[key]}/${skuId}`), options);
    });
    
    promises.push(deleteSku(skuId));
    
    const results = await Promise.all(promises).then(function(results) {
        return results.map(function(result) {
            return Fn.isObject(result) ? result.code : result ? 200 : 500;
        });
    });
    
    const deleted = results.filter(function(value) {
        return value !== 200 && value !== 400 && value !== 404;
    });
    
    status = Fn.isEmpty(deleted) ? 200 : deleted[0];
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