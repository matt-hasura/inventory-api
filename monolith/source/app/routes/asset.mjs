import express from 'express';
import { getSkuById } from './sku.mjs';
import { httpMessage, requiredColumns, tableColumns } from '../modules/constants.mjs';
import { Asset, Sku } from '../modules/models.mjs';
import * as Fn from '../modules/system.mjs';

export const createAsset = async function(skuId, request) {
    try {
        for (let i = 0; i < request.length; i++) {
            Fn.pruneObject(request[i], ['asset_id'], false);
            request[i].sku_id = skuId;
        }
        
        return await Asset.bulkCreate(request, {
            fields: [...requiredColumns.asset, 'sku_id']
        }).then(function(assets) {
            return request.length === assets.length;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const deleteAsset = async function(skuId, assetId) {
    try {
        return await Asset.destroy({
            where: assetId ? { asset_id: assetId } : { sku_id: skuId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const getAssetById = async function(skuId, assetId, query) {
    try {
        const masked = ['asset_id', 'sku_id'];
        
        return await Asset.findOne({
            include: {
                model: Sku,
                attributes: [],
                required: true
            },
            attributes: Fn.selectFields(query.field, tableColumns.asset, masked),
            where: {
                asset_id: assetId,
                sku_id: skuId
            }
        }).then(function(asset) {
            return !Fn.isEmpty(asset) ? Fn.toObject(asset.dataValues) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const getAssets = async function(skuId, query) {   
    try {
        const hidden = ['created', 'sku_id', 'updated'];
        const masked = ['sku_id'];
        
        return await Asset.findAll({
            include: {
                model: Sku,
                attributes: [],
                where: { sku_id: skuId },
                required: true
            },
            attributes: Fn.selectFields(query.field, tableColumns.asset, masked),
            where: Fn.selectWhere(query, tableColumns.asset, hidden),
            order: [['asset_id', 'ASC']],
            limit: Number(query.limit) || undefined,
            offset: Number(query.offset) || undefined
        }).then(function(assets) {
            return assets.map(function(asset) {
                return Fn.toObject(asset.dataValues);
            });
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const updateAsset = async function(assetId, request) {
    try {
        const masked = ['asset_id', 'sku_id'];
        
        return await Asset.update({
            ...Fn.pruneObject(request, masked, false),
            ...{ updated: new Date().toISOString() }
        }, {
            where: { asset_id: assetId }
        }).then(function(row) {
            return row[0] === 1;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const router = express.Router({ mergeParams: true });

/* create /skus/{skuId}/assets */
router.post('/', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.asset, true)) {
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
    
    const exists = await Promise.all(req.body.map(function(asset) {
        return getAssets(skuId, { field: 'created', tag: asset.tag, url: asset.url });
    })).then(function(results) {
        return results.map(function(result) {
            return !Fn.isEmpty(result);
        });
    });
    
    if (Fn.containsString(exists, true)) {
        status = 409;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const created = await createAsset(skuId, req.body);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /skus/{skuId}/assets */
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
    
    const assets = await getAssets(skuId, req.query);
    
    if (!Fn.isArray(assets)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(assets)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(assets);
    Fn.httpLog(req, status, JSON.stringify(assets).length);
});

/* get /skus/{skuId}/assets/{assetId} */
router.get('/:assetId', async function(req, res) {
    const assetId = Number(req.params.assetId);
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(assetId) || !Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const asset = await getAssetById(skuId, assetId, req.query);
    
    if (!Fn.isObject(asset)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(asset)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(asset);
    Fn.httpLog(req, status, JSON.stringify(asset).length);
});

/* update /skus/{skuId}/assets/{assetId} */
router.put('/:assetId', async function(req, res) {
    const assetId = Number(req.params.assetId);
    const skuId = Number(req.params.skuId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(assetId) || !Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.asset, false)) {
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
    
    const asset = await getAssetById(skuId, assetId, { field: 'created' });
    
    if (!Fn.isObject(asset)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(asset)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await updateAsset(assetId, req.body);
    
    status = updated === true ? 200 : updated === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /skus/{skuId}/assets/{assetId} */
router.delete('/:assetId', async function(req, res) {
    const assetId = Number(req.params.assetId);
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(assetId) || !Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const asset = await getAssetById(skuId, assetId, { field: 'created' });
    
    if (!Fn.isObject(asset)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(asset)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const deleted = await deleteAsset(undefined, assetId);
    
    status = deleted ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* default route */
router.all('/:assetId?', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;