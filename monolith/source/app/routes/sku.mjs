import express from 'express';
import { deleteProduct } from './product.mjs';
import { httpMessage, tableColumns } from '../modules/constants.mjs';
import { Description, Sku } from '../modules/models.mjs';
import * as Fn from '../modules/system.mjs';

export const createSku = async function(skuId) {
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

export const deleteSku = async function(skuId) {
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

export const getSkuById = async function(skuId, query) {
    try {
        const masked = ['sku_id'];
        
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

export const getSkus = async function(query) {
    try {
        const hidden = ['created', 'updated'];
        
        return await Sku.findAll({
            include: Fn.containsKey(query, tableColumns.description) ? {
                model: Description,
                attributes: [],
                where: Fn.selectWhere(query, tableColumns.description, hidden),
                required: true
            } : undefined,
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
    
    status = await deleteProduct(skuId);
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