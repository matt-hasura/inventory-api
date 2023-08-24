import { format } from 'sql-formatter';
import { Op } from 'sequelize';
import { accessLog, httpMessage } from './constants.mjs';

/* Custom Functions */
export const arrayIntersection = function(array1, array2) {
    return array1.filter(function(value) {
        return array2.includes(value);
    });
};

export const containsKey = function(object, array) {
    return array.some(function(value) {
        return Object.prototype.hasOwnProperty.call(object, value);
    });
};

export const containsKeys = function(object, array) {
    return array.every(function(value) {
        return Object.prototype.hasOwnProperty.call(object, value);
    });
};

export const containsPromise = function(array) {
    return array.some(function(value) {
        return value instanceof Promise;
    });
};

export const containsString = function(array, string) {
    return array.includes(string);
};

export const containsValue = function(array1, array2) {
    return array2.some(function(value) {
        return array1.includes(value);
    });
};

export const containsValues = function(array1, array2) {
    return array2.every(function(value) {
        return array1.includes(value);
    });
};

export const emptyProperties = function(object) {
    return Object.keys(object).filter(function(key) {
        return object[key] === null || object[key] === undefined || !object;
    }).map(function(key) {
        return key;
    });
};

export const isArray = function(array) {
    return Array.isArray(array);
};

export const isArrayOrObject = function(item) {
    return typeof item === 'object';
};

export const isEmpty = function(object) {
    return isArray(object) ? object.length === 0 : object ? Object.keys(object).length === 0 : true;
};

export const isNumber = function(value) {
    return value !== null && !isNaN(Number(value));
};

export const isObject = function(object) {
    return typeof object === 'object' && !isArray(object);
};

export const isString = function(string) {
    return typeof string === 'string';
};

export const isTimestamp = function(value) {
    const regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;
    return typeof value === 'string' && regex.test(value);
};

export const isTrue = function(value) {
    return value === "true";
};

export const pruneArray = function(array1, array2) {
    return array1.filter(function(value) {
        return !array2.includes(value);
    });
};

export const pruneObject = function(object, array, allowEmpty) {
    const copy = object;
    
    for (const key of array) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            delete object[key];
        }
    }
    
    return Object.keys(object).length > 0 || allowEmpty ? object : copy;
};

export const sortArrayObjects = function(array) {
    return array.map(function(object) {
        const sortedKeys = Object.keys(object).sort();
        return sortedKeys.reduce(function(sorted, key) {
            return {...sorted, [key]: object[key]};
        }, {});
    });
};

export const sortNestedObjects = function(object) {
    const sorted = {};
    const sortedKeys = Object.keys(object).sort();
    
    sortedKeys.forEach(function(key) {
        sorted[key] = object[key];
    });
    
    return sorted;
};

export const toFloat = function(object, array) {
    array.forEach(function(key) {
        if (Object.prototype.hasOwnProperty.call(object, key) && isNumber(object[key])) {
            object[key] = parseFloat(object[key]);
        }
    });
    
    return object;
};

export const toObject = function(object) {
    const sorted = {};
    
    object = JSON.parse(JSON.stringify(object));
    
    for (const key of Object.keys(object).sort()) {
        if (isArray(object[key])) {
            object[key] = sortArrayObjects(object[key]);
        } else if (isObject(object[key]) && object[key] !== null) {
            object[key] = sortNestedObjects(object[key]);
        }
        
        sorted[key] = object[key];
    }
    
    return JSON.parse(JSON.stringify(sorted));
};

export const valueExists = function(value) {
    return typeof value !== 'undefined' && value !== null;
};

/* Application Specific Functions */
export const buildUrl = function(url, query) {
    const queryString = new URLSearchParams();
    
    for (const key in query) {
        if (Object.prototype.hasOwnProperty.call(query, key)) {
            query[key] = isString(query[key]) ? [query[key]] : query[key];
            query[key].forEach(function(value) {
                queryString.append(key, value);
            });
        }
    }
    
    return new URL(!isEmpty(query) ? `${url}?${queryString.toString()}` : url);
};

export const isValidRequest = function(request, columns, requireAll) {
    if (!isArray(request)) {
        request = [request];
    }
    
    if (request.length === 0) {
        return false;
    }
    
    for (const object of request) {
        if (requireAll && !containsKeys(object, columns)) {
            return false;
        }
        
        if (!requireAll && !containsKey(object, columns)) {
            return false;
        }
    }
    
    return true;
};

export const pruneEmpty = function(object, array) {
    array = !isArray(array) ? [array] : array;
    
    for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
            if (isArray(object[key])) {
                for (let i = 0; i < object[key].length; i++) {
                    for (const nestedKey in object[key][i]) {
                        if (Object.prototype.hasOwnProperty.call(object[key][i], nestedKey)) {
                            if (!valueExists(object[key][i][nestedKey]) && !containsString(array, nestedKey)) {
                                delete object[key][i][nestedKey];
                            }
                        }
                    }
                }
            }
            
            if (isObject(object[key])) {
                for (const nestedKey in object[key]) {
                    if (Object.prototype.hasOwnProperty.call(object[key], nestedKey)) {
                        if (!valueExists(object[key][nestedKey]) && !containsString(array, nestedKey)) {
                            delete object[key][nestedKey];
                        }
                    }
                }
            }
            
            if (isString(object[key]) || isEmpty(object[key])) {
                if (!object[key] && !isNumber(object[key]) && !containsString(array, key)) {
                    delete object[key];
                }
            }
        }
    }
    
    return object;
};

export const selectFields = function(fields, table, hidden) {
    if (!isArray(hidden)) {
        hidden = [];
    }
    
    if (isString(fields)) {
        fields = [fields];
    }
    
    if (!fields) {
        return pruneArray(table, hidden);
    }
    
    const masked = pruneArray(fields, hidden);
    const columns = masked.filter(function(key) {
        return containsString(table, key);
    });
    
    return columns.length > 0 ? columns : pruneArray(table, hidden);
};

export const selectWhere = function(field, table, hidden) {
    let operator = Op.and;
    
    if (field.operator && field.operator.toUpperCase() === 'OR') {
        operator = Op.or;
    }
    
    const masked = isArray(hidden) ? pruneObject(field, hidden, true) : field;
    const where = {
        [operator]: Object.entries(masked).filter(function([key]) {
            return containsString(table, key);
        }).map(function([key, val]) {
            const column = {
                [key]: { [isNumber(val) ? Op.eq : Op.iLike]: val }
            };
            
            return column;
        })
    };
    
    return where;
};

export const setResponse = function(status) {
    return {
        status: status,
        message: httpMessage[status]
    };
};

/* Application Specific Logging Functions */
export const httpLog = function(req, resCode, bytesSent) {
    if (accessLog) {
        const { headers, httpVersion, ip, method, originalUrl, socket } = req;
        const entry = `${ip} - [${new Date().toUTCString()}] "${headers['user-agent']}" ${method} ` +
            `"${originalUrl} HTTP/${httpVersion}" ${resCode} ${socket.bytesRead} ${bytesSent}`;
        console.log(entry);
    }
};

export const sqlLog = function(sql, bind, language) {
    const timestamp = new Date().toUTCString();
    const options = {
        language: language,
        params: bind ? bind.map(String) : undefined
    };
    
    const formatted = format(sql, options);
    console.log(`${timestamp} :: Raw SQL\n${formatted.replace(/^/gm, '  ')}`);
};

export const systemLog = function(entry) {
    console.log(`${new Date().toUTCString()} :: ${entry}`);
};