import express from 'express';
import { httpMessage, requiredColumns, tableColumns } from '../modules/constants.mjs';
import * as Fn from '../modules/system.mjs';
import * as Model from '../modules/models.mjs';
import * as Assets from './asset.mjs';
import * as Descriptions from './description.mjs';
import * as Inventories from './inventory.mjs';
import * as Prices from './price.mjs';
import * as Ratings from './rating.mjs';
import * as Reviews from './review.mjs';
import * as Skus from './sku.mjs';
import * as Stores from './store.mjs';

export const deleteProduct = async function(skuId) {
    try {
        const results = await Promise.all([
            Assets.deleteAsset(skuId, undefined),
            Descriptions.deleteDescription(skuId),
            Inventories.deleteInventory(skuId, undefined),
            Prices.deletePrice(skuId),
            Ratings.deleteRating(skuId),
            Reviews.deleteReview(skuId, undefined),
            Skus.deleteSku(skuId)
        ]);
        
        return !Fn.containsString(results, false) ? 200 : 500;
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const getProduct = async function(skuId, query) {
    try {
        const masked = ['inventory_id', 'sku_id', 'store_id'];
        
        return await Model.Sku.findOne({
            include: [
                {
                    model: Model.Asset,
                    attributes: Fn.selectFields(query.field, tableColumns.asset, masked)
                },
                {
                    model: Model.Description,
                    attributes: Fn.selectFields(query.field, tableColumns.description, masked)
                },
                {
                    model: Model.Inventory,
                    as: "inventory",
                    attributes: Fn.selectFields(query.field, tableColumns.inventory, masked),
                    include: {
                        model: Model.Store,
                        attributes: Fn.selectFields(query.field, tableColumns.store)
                    }
                }, 
                {
                    model: Model.Price,
                    attributes: Fn.selectFields(query.field, tableColumns.price, masked)
                },
                {
                    model: Model.Rating,
                    attributes: Fn.selectFields(query.field, tableColumns.rating, masked)
                },
                {
                    model: Model.Review,
                    attributes: Fn.selectFields(query.field, tableColumns.review, masked)
                }
            ],
            attributes: Fn.selectFields(query.field, tableColumns.sku, masked),
            where: { sku_id: skuId },
            order: [
                [Model.Asset, 'asset_id', 'ASC'],
                [Model.Inventory, 'store_id', 'ASC'],
                [Model.Review, 'review_id', 'ASC']
            ]
        }).then(function(product) {
            return !Fn.isEmpty(product) ? (
                product.price && (product.price.dataValues = Fn.toFloat(product.price.dataValues, ['retail', 'sale'])),
                product.rating && (product.rating.dataValues = Fn.toFloat(product.rating.dataValues, ['score'])),
                product.inventory.forEach(store => (store.dataValues.store = Fn.toFloat(Fn.toObject(store.dataValues.store), ['latitude', 'longitude', 'zip_code']))),
                product.reviews.forEach(review => (review.dataValues = Fn.toFloat(review.dataValues, ['score']))),
                Fn.toObject(product.dataValues)) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const router = express.Router({ mergeParams: true });

/* create /products/{skuId} */
router.post('/', async function(req, res) {
    const columns = {...requiredColumns};
    const components = ['assets', 'description', 'inventory', 'price', 'rating'];
    const skuId = Number(req.params.skuId);
    let response, status;
    
    columns.inventory = [...columns.inventory, 'store_id'];
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    for (const key of components) {
        if (!Fn.isArrayOrObject(req.body[key]) || !Fn.isValidRequest(req.body[key], columns[key], true)) {
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
    
    const sku = await Skus.getSkuById(skuId, { field: 'created' });
    
    if (!Fn.isObject(sku)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (!Fn.isEmpty(sku)) {
        status = 409;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (!await Skus.createSku(skuId)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const created = await Promise.all([
        Assets.createAsset(skuId, req.body.assets),
        Descriptions.createDescription(skuId, req.body.description),
        Inventories.createInventory(skuId, req.body.inventory),
        Prices.createPrice(skuId, req.body.price),
        Ratings.createRating(skuId, req.body.rating)
    ]);
    
    if (Fn.containsString(created, false)) {
        status = await deleteProduct(skuId);
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 201;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /products/{skuId} */
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
    
    const product = await getProduct(skuId, req.query);
    
    if (!Fn.isObject(product)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(product)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(product);
    Fn.httpLog(req, status, JSON.stringify(product).length);
});

/* update /products/{skuId} */
router.put('/', async function(req, res) {
    const columns = {...requiredColumns};
    const promises = [];
    const skuId = Number(req.params.skuId);
    let response, status;
    
    columns.assets = [...columns.assets, 'asset_id'];
    columns.inventory = [...columns.inventory, 'store_id'];
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    for (const key in req.body) {
        if (!Fn.isArrayOrObject(req.body[key]) || !Fn.isValidRequest(req.body[key], columns[key], false)) {
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
    
    const sku = await Skus.getSkuById(skuId, { field: 'created' });
    
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
    
    if (Fn.containsKey(req.body, ['assets'])) {
        const exists = await Promise.all(req.body.assets.map(function(asset) {
            return Assets.getAssetById(skuId, asset.asset_id, { field: 'created' });
        })).then(function(results) {
            return results.map(function(result) {
                return !Fn.isEmpty(result);
            });
        });
        
        if (Fn.containsString(exists, false)) {
            status = 404;
            response = Fn.setResponse(status);
            res.status(status).json(response);
            Fn.httpLog(req, status, JSON.stringify(response).length);
            return;
        }
    }
    
    if (Fn.containsKey(req.body, ['inventory'])) {
        const exists = await Promise.all(req.body.inventory.map(function(store) {
            return Stores.getStoreById(store.store_id, { field: 'created' });
        })).then(function(results) {
            return results.map(function(result) {
                return !Fn.isEmpty(result);
            });
        });
        
        if (Fn.containsString(exists, false)) {
            status = 404;
            response = Fn.setResponse(status);
            res.status(status).json(response);
            Fn.httpLog(req, status, JSON.stringify(response).length);
            return;
        }
    }
    
    const updateProduct = {
        assets: function() {
            for (const asset of req.body.assets) {
                promises.push(Assets.updateAsset(asset.asset_id, asset));
            }
        },
        description: function() {
            promises.push(Descriptions.updateDescription(skuId, req.body.description));
        },
        inventory: function() {
            for (const inventory of req.body.inventory) {
                promises.push(Inventories.updateInventory(skuId, inventory.store_id, inventory));
            }
        },
        price: function() {
            promises.push(Prices.updatePrice(skuId, req.body.price));
        },
        rating: function() {
            promises.push(Ratings.updateRating(skuId, req.body.rating));
        }
    };
    
    for (const key in req.body) {
        if (Fn.containsKey(updateProduct, [key])) {
            updateProduct[key]();
        }
    }
    
    const updated = await Promise.all(promises).then(function(results) {
        return results.map(function(result) {
            return result;
        });
    });
    
    if (Fn.containsValue(updated, [false, undefined])) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /products/{skuId} */
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
    
    const sku = await Skus.getSkuById(skuId, { field: 'created' });
    
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