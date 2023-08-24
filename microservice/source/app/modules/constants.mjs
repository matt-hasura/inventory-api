import dotenv from 'dotenv'; // for local dev
import fs from 'fs';
import * as Fn from './system.mjs';

dotenv.config();

export const accessLog = !process.env.ACCESS_LOG ? false : Fn.isTrue(process.env.ACCESS_LOG);

export const basePath = process.env.BASE_PATH || '/api/v2';

export const databaseType = process.env.DATABASE_TYPE || 'postgres'

export const endpoint = {
    assets: process.env.ENDPOINT_ASSETS || 'http://localhost/api/v2/assets',
    description: process.env.ENDPOINT_DESCRIPTION || 'http://localhost/api/v2/description',
    inventory: process.env.ENDPOINT_INVENTORY || 'http://localhost/api/v2/inventory',
    price: process.env.ENDPOINT_PRICE || 'http://localhost/api/v2/price',
    products: process.env.ENDPOINT_PRODUCT|| 'http://localhost/api/v2/product',
    rating: process.env.ENDPOINT_RATING || 'http://localhost/api/v2/rating',
    reviews: process.env.ENDPOINT_REVIEWS || 'http://localhost/api/v2/reviews',
    skus: process.env.ENDPOINT_SKUS || 'http://localhost/api/v2/skus',
    stores: process.env.ENDPOINT_STORES || 'http://localhost/api/v2/stores',
};

export const httpMessage = {
    200: 'ok',
    201: 'created',
    400: 'bad request',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'not found',
    405: 'method not allowed',
    409: 'conflict',
    415: 'unsupported media type',
    500: 'internal server error'
};

export const logSQL = !process.env.LOG_SQL ? false : Fn.isTrue(process.env.LOG_SQL);

export const microservice = process.env.MICROSERVICE;

export const postgres = {
    ca: process.env.POSTGRES_CA,
    database: process.env.POSTGRES_DATABASE,
    host: process.env.POSTGRES_HOST,
    password: process.env.POSTGRES_PASSWORD,
    port: Number(process.env.POSTGRES_PORT) || 5432,
    schema: process.env.POSTGRES_SCHEMA || 'public',
    ssl: !process.env.POSTGRES_SSL ? false : Fn.isTrue(process.env.POSTGRES_SSL),
    username: process.env.POSTGRES_USERNAME
};

export const snowflake = {
    account: process.env.SNOWFLAKE_ACCOUNT,
    database: process.env.SNOWFLAKE_DATABASE,
    password: process.env.SNOWFLAKE_PASSWORD,
    schema: process.env.SNOWFLAKE_SCHEMA,
    username: process.env.SNOWFLAKE_USERNAME,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE
};

export const tls = {
    ca: process.env.SERVER_CA && fs.existsSync(process.env.SERVER_CA) ?
        fs.readFileSync(process.env.SERVER_CA) : undefined,
    cert: process.env.SERVER_CERT && fs.existsSync(process.env.SERVER_CERT) ?
        fs.readFileSync(process.env.SERVER_CERT) : undefined,
    key: process.env.SERVER_KEY && fs.existsSync(process.env.SERVER_KEY) ?
        fs.readFileSync(process.env.SERVER_KEY) : undefined
};

export const requiredColumns = {
    asset: ['tag', 'url'],
    assets: ['tag', 'url'], // used for product input validation
    description: ['brand', 'country', 'name', 'region', 'size','summary', 'type', 'units'],
    inventory: ['quantity'],
    price: ['retail', 'sale'],
    rating: ['count', 'score'],
    review: ['author', 'score', 'summary', 'user_id'],
    store: ['address', 'city', 'latitude', 'longitude', 'name', 'state', 'zip_code']
};

export const tableColumns = {
    asset: ['asset_id', 'created', 'sku_id', 'tag', 'updated', 'url'],
    description: ['brand', 'country', 'created', 'name', 'region', 'size', 'sku_id', 'style', 'summary', 'type', 'units', 'updated'],
    inventory: ['created', 'inventory_id', 'quantity', 'sku_id', 'store_id', 'updated'],
    price: ['created', 'retail', 'sale', 'sku_id', 'updated'],
    rating: ['count', 'created', 'score', 'sku_id', 'updated'],
    review: ['author', 'created', 'review_id', 'score', 'sku_id', 'summary', 'updated', 'user_id'],
    sku: ['created', 'sku_id', 'updated'],
    store: ['address', 'city', 'created', 'latitude', 'longitude', 'name', 'state', 'store_id', 'updated', 'zip_code']
};

export const userAgent = microservice ? microservice : 'all-in-one';