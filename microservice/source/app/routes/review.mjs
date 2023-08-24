import express from 'express';
import { endpoint, httpMessage, requiredColumns, tableColumns, tls } from '../modules/constants.mjs';
import { Review } from '../modules/models.mjs';
import { httpReq, httpReqBody } from '../modules/request.mjs';
import * as Fn from '../modules/system.mjs';

const createReview = async function(skuId, request) {
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

const deleteReview = async function(skuId, reviewId) {
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

const getReviewById = async function(skuId, reviewId, query) {
    try {
        const float = ['score'];
        const masked = [];
        return await Review.findOne({
            attributes: Fn.selectFields(query.field, tableColumns.review, masked),
            where: {
                review_id: reviewId,
                sku_id: skuId
            }
        }).then(function(review) {
            return !Fn.isEmpty(review) ? Fn.toFloat(review.dataValues, float) : {};
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const getReviews = async function(skuId, query) {
    try {
        const float = ['score'];
        const hidden = ['created', 'updated'];
        const masked = [];
        return await Review.findAll({
            attributes: Fn.selectFields(query.field, tableColumns.review, masked),
            where: Fn.selectWhere({...query, ...{ sku_id: skuId }}, tableColumns.review, hidden),
            order: [['review_id', 'ASC']],
            limit: Number(query.limit) || undefined,
            offset: Number(query.offset) || undefined
        }).then(function(reviews) {
            return reviews.map(function(review) {
                return (
                    review.dataValues = Fn.toFloat(review.dataValues, float),
                    review.dataValues
                );
            });
        });
    } catch (error) {
        Fn.systemLog(error);
        return;
    }
};

const updateReview = async function(skuId, reviewId, request) {
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

/* create /reviews/{skuId} */
router.post('/:skuId', async function(req, res) {
    const skuId = Number(req.params.skuId);
    let count, response, score, status;
    
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
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const [rating, sku] = await Promise.all([
        httpReq(Fn.buildUrl(`${endpoint.rating}/${skuId}`, { field: ['count', 'score'] }), options),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isObject(rating.data) || !Fn.isObject(sku.data)) {
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
    
    if (rating.code === 200) {
        count = rating.data.count + 1;
        score = Math.min(Number(((rating.data.score * rating.data.count) + req.body.score) / (rating.data.count + 1)), 5);
    }
    
    const body = JSON.stringify({
        count: Fn.isNumber(count) ? count : 1,
        score: Fn.isNumber(score) ? score : req.body.score
    });
    
    options.headers['Content-Type'] = 'application/json';
    
    const created = await Promise.all([
        createReview(skuId, req.body),
        Fn.isNumber(count) && Fn.isNumber(score) ?
            httpReqBody(Fn.buildUrl(`${endpoint.rating}/${skuId}`), {...options, ...{ method: 'PUT' }}, body) :
            httpReqBody(Fn.buildUrl(`${endpoint.rating}/${skuId}`), {...options, ...{ method: 'POST' }}, body)
    ]);
    
    status = created[0] === true ? 201 : created[0] === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* get /reviews/{skuId} */
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
    
    const [reviews, sku] = await Promise.all([
        getReviews(skuId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isArray(reviews) && !Fn.isObject(sku.data)) {
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
    
    if (sku.code !== 200) {
        status = sku.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(reviews);
    Fn.httpLog(req, status, JSON.stringify(reviews).length);
});

/* get /reviews/{skuId}/{reviewId} */
router.get('/:skuId/:reviewId', async function(req, res) {
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
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const [review, sku] = await Promise.all([
        getReviewById(skuId, reviewId, req.query),
        httpReq(Fn.buildUrl(`${endpoint.skus}/${skuId}`, { field: 'created' }), options)
    ]);
    
    if (!Fn.isObject(review) || !Fn.isObject(sku.data)) {
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
    
    if (sku.code !== 200) {
        status = sku.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    status = 200;
    res.status(status).json(review);
    Fn.httpLog(req, status, JSON.stringify(review).length);
});

/* update /reviews/{skuId}/{reviewId} */
router.put('/:skuId/:reviewId', async function(req, res) {
    const reviewId = Number(req.params.reviewId);
    const skuId = Number(req.params.skuId);
    let response, status;
    
    req.body = Fn.pruneEmpty(req.body, ['user_id']);
    
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
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const [review, rating] = await Promise.all([
        getReviewById(skuId, reviewId, { field: 'score' }),
        httpReq(Fn.buildUrl(`${endpoint.rating}/${skuId}`, { field: ['count', 'score'] }), options),
    ]);
    
    if (!Fn.isObject(review) || !Fn.isObject(rating.data)) {
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
    
    if (rating.code !== 200) {
        status = rating.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const body = JSON.stringify({
        count: rating.data.count,
        score: Math.min(Number(((rating.data.score * rating.data.count) - review.score + req.body.score) / rating.data.count), 5)
    });
    
    options.headers['Content-Type'] = 'application/json';
    
    const updated = await Promise.all([
        updateReview(skuId, reviewId, req.body),
        httpReqBody(Fn.buildUrl(`${endpoint.rating}/${skuId}`), {...options, ...{ method: 'PUT' }}, body)
    ]);
    
    status = updated[0] === true ? 200 : updated[0] === false ? 400 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /reviews/{skuId} */
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
    
    const deleted = await deleteReview(skuId, undefined);
    
    status = deleted ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* delete /reviews/{skuId}/{reviewId} */
router.delete('/:skuId/:reviewId', async function(req, res) {
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
    
    const options = {
        ca: tls.ca,
        headers: {
            traceparent: req.headers.traceparent || null
        }
    };
    
    const [review, rating] = await Promise.all([
        getReviewById(skuId, reviewId, { field: 'score' }),
        httpReq(Fn.buildUrl(`${endpoint.rating}/${skuId}`, { field: ['count', 'score'] }), options),
    ]);
    
    if (!Fn.isObject(review) || !Fn.isObject(rating.data)) {
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
    
    if (rating.code !== 200) {
        status = rating.code;
        response = Fn.setResponse(status);
        res.status(status).json(response);
        Fn.httpLog(req, status, JSON.stringify(response).length);
        return;
    }
    
    const body = JSON.stringify({
        count: rating.data.count - 1,
        score: Math.min(Number(((rating.data.score * rating.data.count) - review.score) / (rating.data.count - 1)), 5)
    });
    
    options.headers['Content-Type'] = 'application/json';
    
    const deleted = await Promise.all([
        deleteReview(undefined, reviewId),
        rating.data.count - 1 > 0 ?
            httpReqBody(Fn.buildUrl(`${endpoint.rating}/${skuId}`), {...options, ...{ method: 'PUT' }}, body) :
            httpReq(Fn.buildUrl(`${endpoint.rating}/${skuId}`), {...options, ...{ method: 'DELETE' }})
    ]);
    
    status = deleted[0] ? 200 : 500;
    response = Fn.setResponse(status);
    res.status(status).json(response);
    Fn.httpLog(req, status, JSON.stringify(response).length);
});

/* default route */
router.all('/:skuId/:reviewId?', function(req, res) {
    const statusCode = 405;
    const response = {
        status: statusCode,
        message: httpMessage[statusCode]
    };
    
    res.status(statusCode).json(response);
    Fn.httpLog(req, statusCode, JSON.stringify(response).length);
});

export default router;