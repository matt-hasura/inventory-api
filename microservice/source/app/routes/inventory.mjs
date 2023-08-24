import express from 'express';
import { endpoint, httpMessage, requiredColumns, tableColumns, tls } from '../modules/constants.mjs';
import { Inventory } from '../modules/models.mjs';
import { httpReq } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createInventory = async function(skuId, request) {
    try {
        for (let i = 0; i < request.length; i++) {
            Fn.pruneObject(request[i], ['inventory_id'], false);
            request[i].sku_id = skuId;
        }
        
        return await Inventory.bulkCreate(request, {
            fields: [...requiredColumns.inventory, 'sku_id', 'store_id']
        }).then(function(inventory) {
            return request.length === inventory.length;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const deleteInventory = async function(skuId, storeId) {
    try {
        const where = {
            sku_id: skuId,
            store_id: storeId
        };
        
        return await Inventory.destroy({
            where: (skuId && storeId) ? where : skuId ? { sku_id: skuId } : { store_id: storeId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getInventory = async function(skuId, query) {
    try {
        const float = ['latitude', 'longitude', 'zip_code'];
        const hidden = ['created', 'inventory_id', 'updated'];
        const masked = ['inventory_id'];
        
        delete query.sku_id; // prevent overriding sku_id in query string
        
        return await Inventory.findAll({
            attributes: Fn.selectFields(query.field, tableColumns.inventory, masked),
            where: Fn.selectWhere({...{sku_id: skuId}, ...query}, tableColumns.inventory, hidden),
            order: [['store_id', 'ASC']],
            limit: Number(query.limit) || undefined,
            offset: Number(query.offset) || undefined
        }).then(function(inventory) {
            return inventory.map(function(store) {
                return (
                    store.dataValues = Fn.toFloat(store.dataValues, float),
                    store.dataValues
                );
            });
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getInventoryByStore = async function(skuId, storeId, query) {
    try {
        const float = ['latitude', 'longitude', 'zip_code'];
        const masked = ['inventory_id'];
        
        return await Inventory.findOne({
            attributes: Fn.selectFields(query.field, tableColumns.inventory, masked),
            where: {
                sku_id: skuId,
                store_id: storeId
            }
        }).then(function(inventory) {
            return !Fn.isEmpty(inventory) ? (
                inventory.dataValues = Fn.toFloat(inventory.dataValues, float),
                inventory.dataValues) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const updateInventory = async function(skuId, storeId, request) {
    try {
        const masked = ['inventory_id', 'sku_id', 'store_id'];
        
        return await Inventory.update({
            ...Fn.pruneObject(request, masked, false),
            ...{ updated: new Date().toISOString() }
        }, {
            where: {
                sku_id: skuId,
                store_id: storeId
            }
        }).then(function(row) {
            return row[0] === 1;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const router = express.Router({ mergeParams: true });

/* create /inventory/{skuId} */
router.post('/:skuId', async function(req, res) {
    const columns = [...requiredColumns.inventory, 'store_id'];
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(skuId) || !Fn.isArray(req.body)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    for (const store of req.body) {
        if (!Fn.isValidRequest(store, columns, true)) {
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
    
    const [inventories, sku] = await Promise.all([
        getInventory(skuId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isArray(inventories) || !Fn.isObject(sku.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const bulkStores = req.body.map(function(store) {
        return store.store_id;
    });
    
    if (inventories.some(store => Fn.containsString(bulkStores, store.store_id))) {
        status = 409;
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
    
    const stores = await Promise.all(req.body.map(function(store) {
        return httpReq(Fn.buildUrl(`${endpoint.stores}/${store.store_id}`, { field: 'created' }), options);
    }));
    
    if (!Fn.isArray(stores)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (!Fn.isEmpty(stores.filter(store => store.code !== 200))) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const created = await createInventory(skuId, req.body);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* create /inventory/{skuId}/{storeId} */
router.post('/:skuId/:storeId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    const storeId = Number(req.params.storeId);
    let response, status;
    
    if (!Fn.isNumber(skuId) || !Fn.isNumber(storeId) || !Fn.isValidRequest(req.body, requiredColumns.inventory, true)) {
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
    
    const [inventory, sku, store] = await Promise.all([
        getInventoryByStore(skuId, storeId, { field: 'created' }),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options),
        httpReq(Fn.buildUrl(`${endpoint.stores}/${storeId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isObject(sku.data || !Fn.isObject(store.data))) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (!Fn.isEmpty(inventory)) {
        status = 409;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (sku.code !== 200 || store.code !== 200) {
        status = sku.code !== 200 ? sku.code : store.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const created = await createInventory(skuId, [{...req.body, ...{store_id: storeId}}]);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /inventory/{skuId} */
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
    
    const [inventories, sku] = await Promise.all([
        getInventory(skuId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isArray(inventories) || !Fn.isObject(sku.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(inventories)) {
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
    
    const inventory = Fn.sortArrayObjects(await Promise.all(inventories.map(function(store) {
        return httpReq(Fn.buildUrl(`${endpoint.stores}/${store.store_id}`), options);
    })).then(function(stores) {
        return stores.map(function(response, i) {
            const store = inventories[i];
            store.store = response.code === 200 ? response.data : {};
            store.store.store_id = store.store_id;
            store.store = Fn.sortNestedObjects(store.store);
            return Fn.pruneObject(store, ['store_id']);
        });
    }));
    
    status = 200;
    res.status(status).json(inventory);
    Fn.httpLog(req, status, JSON.stringify(inventory).length);
});

/* get /inventory/{skuId}/{storeId} */
router.get('/:skuId/:storeId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    const storeId = Number(req.params.storeId);
    let response, status;
    
    if (!Fn.isNumber(skuId) || !Fn.isNumber(storeId)) {
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
    
    const [quantity, sku, store] = await Promise.all([
        getInventoryByStore(skuId, storeId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options),
        httpReq(Fn.buildUrl(`${endpoint.stores}/${storeId}`), options)
    ]);
    
    if (!Fn.isObject(quantity) || !Fn.isObject(sku.data) || !Fn.isObject(store.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(quantity)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (sku.code !== 200 || store.code !== 200) {
        status = sku.code !== 200 ? sku.code : store.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const inventory = (
        quantity.store = store.data,
        Fn.toObject(Fn.pruneObject(quantity, ['store_id']))
    );
    
    status = 200;
    res.status(status).json(inventory);
    Fn.httpLog(req, status, JSON.stringify(inventory).length);
});

/* update /inventory/{skuId} */
router.put('/:skuId', async function(req, res) {
    const columns = [...requiredColumns.inventory, 'store_id'];
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
    
    for (const store of req.body) {
        if (!Fn.isValidRequest(store, columns, true)) {
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
    
    const inventories = await getInventory(skuId, { field: 'store_id' }).then(function(inventory) {
        return inventory.map(function(store) {
            return store.store_id;
        });
    });
    
    const stores = req.body.map(function(store) {
        return parseInt(store.store_id);
    });
    
    if (!Fn.isArray(inventories)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.arrayIntersection(stores, inventories).length !== req.body.length) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await Promise.all(req.body.map(function(store) {
        return updateInventory(skuId, store.store_id, store);
    }));
    
    status = Fn.containsString(updated, undefined) ? 500 : Fn.containsString(updated, false) ? 400 : 200;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* update /inventory/{skuId}/{storeId} */
router.put('/:skuId/:storeId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    const storeId = Number(req.params.storeId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(skuId) || !Fn.isNumber(storeId) || !Fn.isValidRequest(req.body, requiredColumns.inventory, true)) {
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
    
    const inventory = await getInventoryByStore(skuId, storeId, { field: 'created' });
    
    if (!Fn.isObject(inventory)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(inventory)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await updateInventory(skuId, storeId, req.body);
    
    status = updated === true ? 200 : updated === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /inventory/store/{storeId} */
router.delete('/store/:storeId', async function(req, res) {
    const storeId = Number(req.params.storeId);
    let response, status;
    
    if (!Fn.isNumber(storeId)) {
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
    
    const store = await httpReq(Fn.buildUrl(`${endpoint.stores}/${storeId}`, { field: 'created' }), options);
    
    if (!Fn.isObject(store.data)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (store.code !== 200) {
        status = store.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const deleted = await deleteInventory(undefined, storeId);
    
    status = deleted ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /inventory/{skuId} */
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
    
    const deleted = await deleteInventory(skuId, undefined);
    
    status = deleted ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /inventory/{skuId}/{storeId} */
router.delete('/:skuId/:storeId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    const storeId = Number(req.params.storeId);
    let response, status;
    
    if (!Fn.isNumber(skuId) || !Fn.isNumber(storeId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const inventory = await getInventoryByStore(skuId, storeId, { field: 'created' });
    
    if (!Fn.isObject(inventory)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(inventory)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const deleted = await deleteInventory(skuId, storeId);
    
    status = deleted ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* default route */
router.all('/:skuId/:storeId?', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;