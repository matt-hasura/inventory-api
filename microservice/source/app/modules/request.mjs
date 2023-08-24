import http from 'http';
import https from 'https';
import { userAgent } from '../modules/constants.mjs';
import * as Fn from '../modules/system.mjs';

export const httpReq = async function(url, options) {
    return new Promise(function(resolve) {
        let data = '';
        options.headers = {...options.headers, ...{ 'User-Agent': userAgent }};
        
        if (url.protocol === 'http:') {
            http.request(url, options, function(res) {
                res.on('data', function(chunk) {
                    data += chunk;
                });
                res.on('end', function() {
                    try {
                        resolve({ code: res.statusCode, data: JSON.parse(data) });
                    } catch (error) {
                        resolve({ code: 400 });
                    }
                });
            }).on('error', function(error) {
                Fn.systemLog(error);
                resolve({ code: 400 });
            }).end();
        } else {
            https.request(url, options, function(res) {
                res.on('data', function(chunk) {
                    data += chunk;
                });
                res.on('end', function() {
                    try {
                        resolve({ code: res.statusCode, data: JSON.parse(data) });
                    } catch (error) {
                        resolve({ code: 400 });
                    }
                });
            }).on('error', function(error) {
                Fn.systemLog(error);
                resolve({ code: 400 });
            }).end();
        }
    });
};

export const httpReqBody = async function(url, options, body) {
    return new Promise(function(resolve) {
        let data = '';
        options.headers = {...options.headers, ...{ 'User-Agent': userAgent }};
        
        if (url.protocol === 'http:') {
            const req = http.request(url, options, function(res) {
                res.on('data', function(chunk) {
                    data += chunk;
                });
                
                res.on('end', function() {
                    try {
                        resolve({ code: res.statusCode, data: JSON.parse(data) });
                    } catch (error) {
                        resolve({ code: 400 });
                    }
                });
            }).on('error', function(error) {
                Fn.systemLog(error);
                resolve({ code: 400 });
            });
            
            req.write(body);
            req.end();
        } else {
            const req = https.request(url, options, function(res) {
                res.on('data', function(chunk) {
                    data += chunk;
                });
                
                res.on('end', function() {
                    try {
                        resolve({ code: res.statusCode, data: JSON.parse(data) });
                    } catch (error) {
                        resolve({ code: 400 });
                    }
                });
            }).on('error', function(error) {
                Fn.systemLog(error);
                resolve({ code: 400 });
            });
            
            req.write(body);
            req.end();
        }
    });
};