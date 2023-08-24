import fs from 'fs';
import Sequelize from 'sequelize';
import { databaseType, logSQL, postgres, snowflake } from './constants.mjs';
import { sqlLog } from './system.mjs';

let language;
let options = {};
let pool = {
    acquire: 10000,
    idle: 300000,
    max: 5,
    min: 1
};

switch (databaseType) {
    case 'snowflake':
        language = 'sql';
        options = {
            database: snowflake.database,
            dialect: 'snowflake',
            dialectOptions: {
                account: snowflake.account,
                insecureConnect: true,
                schema: snowflake.schema,
                warehouse: snowflake.warehouse,
            },
            password: snowflake.password,
            username: snowflake.username
        };
        pool.max = 1;
        break;
    default:
        language = 'postgresql';
        options = {
            database: postgres.database,
            dialect: 'postgres',
            dialectOptions: {
                keepAlive: true,
                ...(postgres.ssl && {
                    ssl: {
                        ca: fs.readFileSync(postgres.ca) }
                    })
            },
            host: postgres.host,
            password: postgres.password,
            port: postgres.port,
            schema: postgres.schema,
            username: postgres.username
        };
}

export const sequelize = new Sequelize({...options, ...{
    define: {
        freezeTableName: true,
        timestamps: false
    },
    logging: function(sql, options) {
        if (logSQL) {
            const regex = /^.*?:.*?\s/;
            sqlLog(sql.replace(regex, ''), options.bind, language);
        }
    },
    logQueryParameters: false,
    pool
}});

export default sequelize;