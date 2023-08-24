import express from 'express';
import { endpoint, httpMessage, requiredColumns, tableColumns, tls } from '../modules/constants.mjs';
import { Asset } from '../modules/models.mjs';
import { httpReq } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createAsset = async function(skuId, request) {
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

const deleteAsset = async function(skuId, assetId) {
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

const getAssetById = async function(skuId, assetId, query) {
    try {
        const masked = [];
        
        return await Asset.findOne({
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

const getAssets = async function(skuId, query) {   
    try {
        const hidden = ['created', 'updated'];
        const masked = [];
        
        return await Asset.findAll({
            attributes: Fn.selectFields(query.field, tableColumns.asset, masked),
            where: Fn.selectWhere({...query, ...{ sku_id: skuId }}, tableColumns.asset, hidden),
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

const updateAsset = async function(assetId, request) {
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

/* create /assets/{skuId} */
router.post('/:skuId', async function(req, res) {
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
    
    const assets = await Promise.all(req.body.map(function(asset) {
        return getAssets(skuId, { field: 'created', tag: asset.tag, url: asset.url });
    })).then(function(results) {
        return results.map(function(result) {
            return !Fn.isEmpty(result);
        });
    });
    
    if (Fn.containsString(assets, true)) {
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

/* get /assets/{skuId} */
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
    
    const [assets, sku] = await Promise.all([
        getAssets(skuId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isArray(assets) || !Fn.isObject(sku.data)) {
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
    
    if (sku.code !== 200) {
        status = sku.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(assets);
    Fn.httpLog(req, status, JSON.stringify(assets).length);
});

/* get /assets/{skuId}/{assetId} */
router.get('/:skuId/:assetId', async function(req, res) {
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
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const [asset, sku] = await Promise.all([
        getAssetById(skuId, assetId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isObject(asset) || !Fn.isObject(sku.data)) {
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
    
    if (sku.code !== 200) {
        status = sku.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(asset);
    Fn.httpLog(req, status, JSON.stringify(asset).length);
});

/* update /assets/{skuId} */
router.put('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    for (const asset of req.body) {
        if (!Fn.isValidRequest(asset, ['asset_id'], true)) {
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
    
    const assets = await getAssets(skuId, { field: 'asset_id' }).then(function(asset) {
        return asset.map(function(id) {
            return id.asset_id;
        });
    });
    
    const assetIds = req.body.map(function(asset) {
        return parseInt(asset.asset_id);
    });
    
    if (!Fn.isArray(assets)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.arrayIntersection(assetIds, assets).length !== req.body.length) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await Promise.all(req.body.map(function(asset) {
        return updateAsset(asset.asset_id, asset);
    }));
    
    status = Fn.containsString(updated, undefined) ? 500 : Fn.containsString(updated, false) ? 400 : 200;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* update /assets/{skuId}/{assetId} */
router.put('/:skuId/:assetId', async function(req, res) {
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

/* delete /assets/{skuId} */
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
    
    const deleted = await deleteAsset(skuId, undefined);
    
    status = deleted ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /assets/{skuId}/{assetId} */
router.delete('/:skuId/:assetId', async function(req, res) {
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
router.all('/:skuId/:assetId?', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;