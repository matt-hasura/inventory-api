import { DataTypes } from 'sequelize';
import sequelize from './database.mjs';

export const Asset = sequelize.define('asset', {
    asset_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    sku_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING(256),
        allowNull: false
    },
    tag: {
        type: DataTypes.STRING(128),
        allowNull: false
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false
    }
});

export const Description = sequelize.define('description', {
    sku_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(256),
        allowNull: false
    },
    summary: {
        type: DataTypes.STRING(4096),
        allowNull: false
    },
    brand: {
        type: DataTypes.STRING(256),
        allowNull: false
    },
    type: {
        type: DataTypes.STRING(128),
        allowNull: false
    },
    country: {
        type: DataTypes.STRING(128),
        allowNull: false
    },
    region: {
        type: DataTypes.STRING(128),
        allowNull: false
    },
    style: {
        type: DataTypes.STRING(128),
        allowNull: true
    },
    size: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false
    },
    units: {
        type: DataTypes.STRING(3),
        allowNull: false
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false
    }
});

export const Inventory = sequelize.define('inventory', {
    inventory_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    store_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    sku_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false
    }
});

export const Price = sequelize.define('price', {
    sku_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    retail: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: false
    },
    sale: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false
    }
});

export const Rating = sequelize.define('rating', {
    sku_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    score: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: true
    },
    count: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false
    }
});

export const Review = sequelize.define('review', {
    review_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    sku_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: true
    },
    author: {
        type: DataTypes.STRING(256),
        allowNull: false
    },
    summary: {
        type: DataTypes.STRING(8192),
        allowNull: true
    },
    score: {
        type: DataTypes.DECIMAL(2, 1),
        allowNull: false
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false
    }
});

export const Sku = sequelize.define('sku', {
    sku_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false,
    }
});

export const Store = sequelize.define('store', {
    store_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(128),
        allowNull: false
    },
    address: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    city: {
        type: DataTypes.STRING(64),
        allowNull: false
    },
    state: {
        type: DataTypes.STRING(2),
        allowNull: false
    },
    zip_code: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    latitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: false
    },
    longitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: false
    },
    created: {
        type: DataTypes.DATE(6),
        allowNull: false
    },
    updated: {
        type: DataTypes.DATE(6),
        allowNull: false,
    }
});

Sku.hasMany(Asset, {
    foreignKey: 'sku_id'
});

Asset.belongsTo(Sku, {
    foreignKey: 'sku_id'
});

Sku.hasOne(Description, {
    foreignKey: 'sku_id'
});

Description.belongsTo(Sku, {
    foreignKey: 'sku_id'
});

Sku.hasMany(Inventory, {
    as: {
        plural: 'inventory'
    },
    foreignKey: 'sku_id'
});

Inventory.belongsTo(Sku, {
    foreignKey: 'sku_id'
});

Store.hasMany(Inventory, {
    foreignKey: 'store_id'
});

Inventory.belongsTo(Store, {
    foreignKey: 'store_id'
});

Sku.hasOne(Price, {
    foreignKey: 'sku_id'
});

Price.belongsTo(Sku, {
    foreignKey: 'sku_id'
});

Sku.hasOne(Rating, {
    foreignKey: 'sku_id'
});

Rating.belongsTo(Sku, {
    foreignKey: 'sku_id'
});

Sku.hasMany(Review, {
    foreignKey: 'sku_id'
});

Review.belongsTo(Sku, {
    foreignKey: 'sku_id'
});