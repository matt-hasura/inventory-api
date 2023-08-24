import express from 'express';
import { endpoint, httpMessage, requiredColumns, tableColumns, tls } from '../modules/constants.mjs';
import { Store } from '../modules/models.mjs';
import { httpReq } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createStore = async function(storeId, request) {
    try {
        const masked = ['store_id'];
        return await Store.findOrCreate({
            defaults: Fn.pruneObject(request, masked, false),
            fields: [...requiredColumns.store, ...masked],
            where: { store_id: storeId }
        }).then(function(created) {
            return created[1];
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const deleteStore = async function(storeId) {
    try {
        return await Store.destroy({
            where: { store_id: storeId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getStoreById = async function(storeId, query) {
    try {
        const float = ['latitude', 'longitude', 'zip_code'];
        const masked = [];
        return await Store.findByPk(storeId, {
            attributes: Fn.selectFields(query.field, tableColumns.store, masked)
        }).then(function(store) {
            return !Fn.isEmpty(store) ? Fn.toFloat(store.dataValues, float) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getStores = async function(query) {
    try {
        const float = ['latitude', 'longitude', 'zip_code'];
        const hidden = ['created', 'updated'];
        return await Store.findAll({
            attributes: Fn.selectFields(query.field, tableColumns.store),
            where: Fn.selectWhere(query, tableColumns.store, hidden),
            order: [['store_id', 'ASC']],
            limit: Number(query.limit) || undefined,
            offset: Number(query.offset) || undefined
        }).then(function(stores) {
            return stores.map(function(store) {
                return Fn.toFloat(store.dataValues, float);
            });
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const updateStore = async function(storeId, request) {
    try {
        return await Store.update({
            ...request,
            ...{ updated: new Date().toISOString() }
        }, {
            where: { store_id: storeId }
        }).then(function(row){
            return row[0] === 1;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const router = express.Router();

/* create /stores/{storeId} */
router.post('/:storeId', async function(req, res) {
    const storeId = Number(req.params.storeId);
    let response, status;
    
    if (!Fn.isNumber(storeId) || !Fn.isValidRequest(req.body, requiredColumns.store, true)) {
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
    
    const created = await createStore(storeId, req.body);
    
    status = created === true ? 201 : created === false ? 409 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /stores */
router.get('/', async function(req, res) {
    let response, status;
    
    const stores = await getStores(req.query);
    
    if (!Fn.isArray(stores)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(stores)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(stores);
    Fn.httpLog(req, status, JSON.stringify(stores).length);
});

/* get /stores/{storeId} */
router.get('/:storeId', async function(req, res) {
    const storeId = Number(req.params.storeId);
    let response, status;
    
    if (!Fn.isNumber(storeId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const store = await getStoreById(storeId, req.query);
    
    if (!Fn.isObject(store)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(store)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(store);
    Fn.httpLog(req, status, JSON.stringify(store).length);
});

/* update /stores/{storeId} */
router.put('/:storeId', async function(req, res) {
    const storeId = Number(req.params.storeId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(storeId) || !Fn.isValidRequest(req.body, requiredColumns.store, false)) {
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
    
    const store = await getStoreById(storeId, { field: 'created' });
    
    if (!Fn.isObject(store)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(store)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const updated = await updateStore(storeId, req.body);
    
    status = updated === true ? 200 : updated === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /stores/{storeId} */
router.delete('/:storeId', async function(req, res) {
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
        },
        method: 'DELETE'
    };
    
    const store = await getStoreById(storeId, { field: 'created' });
    
    if (!Fn.isObject(store)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(store)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const inventory = await httpReq(Fn.buildUrl(`${endpoint.inventory}/store/${storeId}`), options);
    
    if (inventory.code !== 200) {
        status = inventory.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const deleted = await deleteStore(storeId);
    
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