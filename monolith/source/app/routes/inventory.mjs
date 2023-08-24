import express from 'express';
import { getStoreById } from './store.mjs';
import { getSkuById } from './sku.mjs';
import { httpMessage, requiredColumns, tableColumns } from '../modules/constants.mjs';
import { Inventory, Sku, Store } from '../modules/models.mjs';
import * as Fn from '../modules/system.mjs';

export const createInventory = async function(skuId, request) {
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

export const deleteInventory = async function(skuId, storeId) {
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

export const getInventory = async function(skuId, query) {
    try {
        const float = ['latitude', 'longitude', 'zip_code'];
        const hidden = ['created', 'inventory_id', 'sku_id', 'store_id', 'updated'];
        const masked = ['inventory_id', 'sku_id', 'store_id'];
        
        return await Inventory.findAll({
            include: [
                {
                    model: Sku,
                    attributes: [],
                    where: { sku_id: skuId },
                    required: true
                },
                {
                    model: Store,
                    attributes: Fn.selectFields(query.field, tableColumns.store),
                    where: Fn.selectWhere(query, tableColumns.store, ['created', 'updated']),
                    required: true
                }
            ],
            attributes: Fn.selectFields(query.field, tableColumns.inventory, masked),
            where: Fn.selectWhere(query, tableColumns.inventory, hidden),
            order: [['store_id', 'ASC']],
            limit: Number(query.limit) || undefined,
            offset: Number(query.offset) || undefined
        }).then(function(inventory) {
            return inventory.map(function(store) {
                return (
                    store.dataValues.store = Fn.toFloat(Fn.toObject(store.dataValues.store), float),
                    Fn.toObject(store.dataValues)
                );
            });
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const getInventoryByStore = async function(skuId, storeId, query) {
    try {
        const float = ['latitude', 'longitude', 'zip_code'];
        const masked = ['inventory_id', 'sku_id', 'store_id'];
        
        return await Inventory.findOne({
            include: [
                {
                    model: Sku,
                    attributes: [],
                    required: true,
                },
                {
                    model: Store,
                    attributes: Fn.selectFields(query.field, tableColumns.store, masked),
                    required: true
                }
            ],
            attributes: Fn.selectFields(query.field, tableColumns.inventory, masked),
            where: {
                sku_id: skuId,
                store_id: storeId
            }
        }).then(function(inventory) {
            return !Fn.isEmpty(inventory) ? (
                inventory.dataValues.store = Fn.toFloat(Fn.toObject(inventory.dataValues.store), float),
                Fn.toObject(inventory.dataValues)) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const updateInventory = async function(skuId, storeId, request) {
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

/* create /skus/{skuId}/inventory/{storeId} */
router.post('/:storeId', async function(req, res) {
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
    
    const [inventory, sku, store] = await Promise.all([
        getInventoryByStore(skuId, storeId, { field: 'created' }),
        getSkuById(skuId, { field: 'created' }),
        getStoreById(storeId, { field: 'created' })
    ]);
    
    if (!Fn.isObject(sku || !Fn.isObject(store))) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(sku) || Fn.isEmpty(store)) {
        status = 404;
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
    
    const created = await createInventory(skuId, [{...req.body, ...{store_id: storeId}}]);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /skus/{skuId}/inventory */
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
    
    const inventory = await getInventory(skuId, req.query);
    
    if (!Fn.isArray(inventory)) {
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
    
    status = 200;
    res.status(status).json(inventory);
    Fn.httpLog(req, status, JSON.stringify(inventory).length);
});

/* get /skus/{skuId}/inventory/{storeId} */
router.get('/:storeId', async function(req, res) {
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
    
    const inventory = await getInventoryByStore(skuId, storeId, req.query);
    
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
    
    status = 200;
    res.status(status).json(inventory);
    Fn.httpLog(req, status, JSON.stringify(inventory).length);
});

/* update /skus/{skuId}/inventory/{storeId} */
router.put('/:storeId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    const storeId = Number(req.params.storeId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(skuId) || !Fn.isNumber(storeId) || !Fn.isValidRequest(req.body, requiredColumns.inventory, false)) {
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

/* delete /skus/{skuId}/inventory/{storeId} */
router.delete('/:storeId', async function(req, res) {
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
router.all('/:storeId?', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;