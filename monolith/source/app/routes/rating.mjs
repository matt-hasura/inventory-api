import express from 'express';
import { deleteReview } from './review.mjs';
import { getSkuById } from './sku.mjs';
import { httpMessage, requiredColumns, tableColumns } from '../modules/constants.mjs';
import { Rating, Sku } from '../modules/models.mjs';
import * as Fn from '../modules/system.mjs';

export const createRating = async function(skuId, request) {
    try {
        const masked = ['sku_id'];
        
        return await Rating.findOrCreate({
            defaults: Fn.pruneObject(request, masked, false),
            fields: [...requiredColumns.rating, ...masked],
            where: { sku_id: skuId }
        }).then(function(created) {
            return created[1];
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const deleteRating = async function(skuId) {
    try {
        return await Rating.destroy({
            where: { sku_id: skuId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const getRating = async function(skuId, query) {
    try {
        const float = ['score'];
        const masked = ['sku_id'];
        
        return await Rating.findOne({
            include: {
                model: Sku,
                attributes: [],
                required: true
            },
            attributes: Fn.selectFields(query.field, tableColumns.rating, masked),
            where: { sku_id: skuId }
        }).then(function(rating) {
            return !Fn.isEmpty(rating) ? (
                rating.dataValues = Fn.toFloat(Fn.toObject(rating.dataValues), float),
                rating.dataValues) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const updateRating = async function(skuId, request) {
    try {
        const masked = ['sku_id'];
        
        return await Rating.update({
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

/* create /skus/{skuId}/rating */
router.post('/', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
     
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.rating, true)) {
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
    
    const created = await createRating(skuId, req.body);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /skus/{skuId}/rating */
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
    
    const rating = await getRating(skuId, req.query);
    
    if (!Fn.isObject(rating)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(rating)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(rating);
    Fn.httpLog(req, status, JSON.stringify(rating).length);
});

/* update /skus/{skuId}/rating */
router.put('/', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.rating, true)) {
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
    
    const rating = await getRating(skuId, { field: 'created' });
    
    if (!Fn.isObject(rating)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(rating)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await updateRating(skuId, req.body);
    
    status = updated === true ? 200 : updated === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /skus/{skuId}/rating */
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
    
    const rating = await getRating(skuId, { field: 'created' });
    
    if (!Fn.isObject(rating)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(rating)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const deleted = await Promise.all([
        deleteRating(skuId),
        deleteReview(skuId, undefined)
    ]);
    
    status = deleted[0] && deleted[1] ? 200 : 500;
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