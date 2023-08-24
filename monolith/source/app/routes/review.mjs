import express from 'express';
import { createRating, deleteRating, getRating, updateRating } from './rating.mjs';
import { getSkuById } from './sku.mjs';
import { httpMessage, requiredColumns, tableColumns } from '../modules/constants.mjs';
import { Review, Sku } from '../modules/models.mjs';
import * as Fn from '../modules/system.mjs';

export const createReview = async function(skuId, request) {
    try {
        const masked = ['review_id', 'sku_id'];
        
        return await Review.create({
            ...Fn.pruneObject(request, masked, false),
            ...{ sku_id: skuId }
        }, {
            fields: [...requiredColumns.review, 'sku_id']
        }).then(function(review) {
            return review._options.isNewRecord;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const deleteReview = async function(skuId, reviewId) {
    try {
        return await Review.destroy({
            where: reviewId ? { review_id: reviewId } : { sku_id: skuId }
        }).then(function() {
            return true;
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const getReviewById = async function(skuId, reviewId, query) {
    try {
        const float = ['score'];
        const masked = ['review_id', 'sku_id'];
        
        return await Review.findOne({
            include: [
                {
                    model: Sku,
                    attributes: [],
                    required: true
                }
            ],
            attributes: Fn.selectFields(query.field, tableColumns.review, masked),
            where: {
                review_id: reviewId,
                sku_id: skuId
            }
        }).then(function(review) {
            return !Fn.isEmpty(review) ? Fn.toFloat(Fn.toObject(review.dataValues), float) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const getReviews = async function(skuId, query) {
    try {
        const float = ['score'];
        const hidden = ['created', 'sku_id', 'updated'];
        const masked = ['sku_id'];
        
        return await Review.findAll({
            include: {
                model: Sku,
                attributes: [],
                where: { sku_id: skuId },
                required: true
            },
            attributes: Fn.selectFields(query.field, tableColumns.review, masked),
            where: Fn.selectWhere(query, tableColumns.review, hidden),
            order: [['review_id', 'ASC']],
            limit: Number(query.limit) || undefined,
            offset: Number(query.offset) || undefined
        }).then(function(reviews) {
            return reviews.map(function(review) {
                return (
                    review.dataValues = Fn.toFloat(Fn.toObject(review.dataValues), float),
                    review.dataValues
                );
            });
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

export const updateReview = async function(skuId, reviewId, request) {
    try {
        const masked = ['review_id', 'sku_id'];
        
        return await Review.update({
            ...Fn.pruneObject(request, masked, false),
            ...{ updated: new Date().toISOString() }
        }, {
            where: {
                review_id: reviewId,
                sku_id: skuId
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

/* create /skus/{skuId}/reviews */
router.post('/', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.review, true)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (req.body.score > 5 || req.body.score < 0) {
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
    
    const [rating, sku] = await Promise.all([
        getRating(skuId, {}),
        getSkuById(skuId, { field: 'created' })
    ]);
    
    if (!Fn.isObject(rating) || !Fn.isObject(sku)) {
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
    
    const promises = [createReview(skuId, req.body)];
    
    if (!Fn.isEmpty(rating)) {
        const score = Math.min(Number(((rating.score * rating.count) + req.body.score) / (rating.count + 1)), 5);
        const count = rating.count + 1;
        promises.push(updateRating(skuId, { count: count, score: score }));
    } else {
        promises.push(createRating(skuId, { count: 1, score: req.body.score }));
    }
    
    const created = await Promise.all(promises);
    
    status = created[0] === true ? 201 : created[0] === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /skus/{skuId}/reviews */
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
    
    const reviews = await getReviews(skuId, req.query);
    
    if (!Fn.isArray(reviews)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(reviews)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(reviews);
    Fn.httpLog(req, status, JSON.stringify(reviews).length);
});

/* get /skus/{skuId}/reviews/{reviewId} */
router.get('/:reviewId', async function(req, res) {
    const reviewId = Number(req.params.reviewId);
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(reviewId) || !Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const review = await getReviewById(skuId, reviewId, req.query);
    
    if (!Fn.isObject(review)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(review)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(review);
    Fn.httpLog(req, status, JSON.stringify(review).length);
});

/* update /skus/{skuId}/reviews/{reviewId} */
router.put('/:reviewId', async function(req, res) {
    const reviewId = Number(req.params.reviewId);
    const skuId = Number(req.params.skuId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body);
    
    if (!Fn.isNumber(reviewId) || !Fn.isNumber(skuId) || !Fn.isValidRequest(req.body, requiredColumns.review, false)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.containsKey(req.body, ['score']) && (req.body.score > 5 || req.body.score < 0)) {
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
    
    const [rating, review] = await Promise.all([
        getRating(skuId, {}),
        getReviewById(skuId, reviewId, { field: 'score' })
    ]);
    
    if (!Fn.isObject(review)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(review)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const score = Math.min(Number(((rating.score * rating.count) - review.score + req.body.score) / rating.count), 5);
    const count = rating.count;
    
    const updated = await Promise.all([
        updateReview(skuId, reviewId, req.body),
        updateRating(skuId, { count: count, score: score })
    ]);
    
    status = updated[0] === true ? 200 : updated[0] === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /skus/{skuId}/reviews/{reviewId} */
router.delete('/:reviewId', async function(req, res) {
    const reviewId = Number(req.params.reviewId);
    const skuId = Number(req.params.skuId);
    let response, status;
    
    if (!Fn.isNumber(reviewId) || !Fn.isNumber(skuId)) {
        status = 400;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const [rating, review] = await Promise.all([
        getRating(skuId, {}),
        getReviewById(skuId, reviewId, { field: 'score' })
    ]);
    
    if (!Fn.isObject(rating) || !Fn.isObject(review)) {
        status = 500;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    if (Fn.isEmpty(review)) {
        status = 404;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const promises = [deleteReview(undefined, reviewId)];
    
    if (rating.count - 1 > 0) {
        const score = Math.min(Number(((rating.score * rating.count) - review.score) / (rating.count - 1)), 5);
        const count = rating.count - 1;
        promises.push(updateRating(skuId, { count: count, score: score }));
    } else {
        promises.push(deleteRating(skuId));
    }
    
    const deleted = await Promise.all(promises);
    
    status = deleted[0] ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* default route */
router.all('/:reviewId?', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;