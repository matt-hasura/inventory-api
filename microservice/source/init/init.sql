DROP DATABASE IF EXISTS asset WITH (FORCE);
CREATE DATABASE asset;

\c asset

CREATE SEQUENCE asset_id_seq RESTART WITH 1 INCREMENT BY 1;
CREATE TABLE asset (
    asset_id INTEGER PRIMARY KEY DEFAULT nextval('asset_id_seq'::regclass),
    sku_id INTEGER NOT NULL,
    url CHARACTER VARYING(256) NOT NULL,
    tag CHARACTER VARYING(128) NOT NULL,
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

DROP DATABASE IF EXISTS description WITH (FORCE);
CREATE DATABASE description;

\c description

CREATE TABLE description (
    sku_id INTEGER PRIMARY KEY,
    name CHARACTER VARYING(256) NOT NULL,
    summary CHARACTER VARYING(4096) NOT NULL,
    brand CHARACTER VARYING(256) NOT NULL,
    type CHARACTER VARYING(128) NOT NULL,
    country CHARACTER VARYING(128) NOT NULL,
    region CHARACTER VARYING(128) NOT NULL,
    style CHARACTER VARYING(128),
    size FLOAT4 NOT NULL,
    units CHARACTER VARYING(3) NOT NULL,
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

DROP DATABASE IF EXISTS inventory WITH (FORCE);
CREATE DATABASE inventory;

\c inventory

CREATE SEQUENCE inventory_id_seq RESTART WITH 1 INCREMENT BY 1;
CREATE TABLE inventory (
    inventory_id INTEGER PRIMARY KEY DEFAULT nextval('public.inventory_id_seq'::regclass),
    store_id INTEGER NOT NULL,
    sku_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

DROP DATABASE IF EXISTS price WITH (FORCE);
CREATE DATABASE price;

\c price

CREATE TABLE price (
    sku_id INTEGER PRIMARY KEY,
    retail NUMERIC(8,2) NOT NULL,
    sale NUMERIC(8,2),
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

DROP DATABASE IF EXISTS rating WITH (FORCE);
CREATE DATABASE rating;

\c rating

CREATE TABLE rating (
    sku_id INTEGER PRIMARY KEY,
    score NUMERIC(3,2),
    count INTEGER,
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

DROP DATABASE IF EXISTS review WITH (FORCE);
CREATE DATABASE review;

\c review

CREATE SEQUENCE review_id_seq RESTART WITH 1 INCREMENT BY 1;
CREATE TABLE review (
    review_id INTEGER PRIMARY KEY DEFAULT nextval('public.review_id_seq'::regclass),
    sku_id INTEGER NOT NULL,
    user_id uuid,
    author CHARACTER VARYING(256) NOT NULL,
    summary CHARACTER VARYING(8192),
    score NUMERIC(3,2) NOT NULL,
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

DROP DATABASE IF EXISTS sku WITH (FORCE);
CREATE DATABASE sku;

\c sku

CREATE TABLE sku (
    sku_id INTEGER PRIMARY KEY,
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

DROP DATABASE IF EXISTS store WITH (FORCE);
CREATE DATABASE store;

\c store

CREATE TABLE store (
    store_id INTEGER PRIMARY KEY,
    name CHARACTER VARYING(128) NOT NULL,
    address CHARACTER VARYING(64) NOT NULL,
    city CHARACTER VARYING(64) NOT NULL,
    state CHARACTER VARYING(2) NOT NULL,
    zip_code NUMERIC(5,0) NOT NULL,
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    created TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
    updated TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
);

\c asset

INSERT INTO
    asset (sku_id, url, tag)
VALUES
    (2572, '/images/assets/2572.png', 'thumbnail'),
    (2682, '/images/assets/2682.png', 'thumbnail'),
    (2922, '/images/assets/2922.png', 'thumbnail'),
    (3115, '/images/assets/3115.png', 'thumbnail'),
    (4457, '/images/assets/4457.png', 'thumbnail'),
    (4459, '/images/assets/4459.png', 'thumbnail'),
    (5797, '/images/assets/5797.png', 'thumbnail'),
    (61695, '/images/assets/61695.png', 'thumbnail'),
    (80121, '/images/assets/80121.png', 'thumbnail'),
    (85465, '/images/assets/85465.png', 'thumbnail'),
    (90748, '/images/assets/90748.png', 'thumbnail'),
    (91279, '/images/assets/91279.png', 'thumbnail'),
    (95340, '/images/assets/95340.png', 'thumbnail'),
    (96070, '/images/assets/96070.png', 'thumbnail'),
    (100328, '/images/assets/100328.png', 'thumbnail'),
    (100835, '/images/assets/100835.png', 'thumbnail'),
    (106160, '/images/assets/106160.png', 'thumbnail'),
    (118294, '/images/assets/118294.png', 'thumbnail'),
    (120756, '/images/assets/120756.png', 'thumbnail'),
    (120922, '/images/assets/120922.png', 'thumbnail'),
    (133154, '/images/assets/133154.png', 'thumbnail');

\c description

INSERT INTO
    description (sku_id, name, brand, type, country, region, style, size, units, summary)
VALUES
    (2572, 'Kendall-Jackson Chardonnay Vintner''s Reserve (750 mL)', 'Kendall-Jackson Winery', 'Chardonnay', 'USA', 'California', '', 750, 'mL', 'Concentrated and creamy but not overly showy, balanced and layered, apple tart flavor with subtle vanilla and nutmeg nuances.'),
    (2682, 'Quady Elysium Black Muscat (750 mL)', 'Quady Winery', 'Dessert', 'USA', 'California', '', 750, 'mL', 'The perfect companion to chocolate or fruit with potent notes of raspberry; bright, crisp, and spicy.'),
    (2922, 'Veuve Clicquot Yellow Label NV (750 mL)', 'Veuve Clicquot Ponsardin', 'Champagne', 'France', 'Champagne', '', 750, 'mL', 'Some oyster shell, berry biscuits, fresh strawberries and gently toasty brioche; the palate is plump and flavorsome; plenty of berries and citrus notes.'),
    (3115, 'Santa Margherita Pinot Grigio Italy (750 mL)', 'Santa Margherita', 'Pinot Gris', 'Italy', 'Trentino Alto Adige', 'Valdadige', 750, 'mL', 'Clean, crisp fragrance with intense yet elegant hints of quince. Fresh, harmonious fruit set off by slight sweetness with a long finish full of delicate, tangy flavor.'),
    (4457, 'Rombauer Chardonnay (750 mL)', 'Rombauer Vineyards', 'Chardonnay', 'USA', 'California', 'Napa Valley', 750, 'mL', 'Juicy peaches, pineapple and citrus greet the nose; followed by vanilla and toasty oak; ripe tropical fruit, pear and apple flood the palate; soft spice notes and nectarines mark the lengthy finish.'),
    (4459, 'Rombauer Merlot (750 mL)', 'Rombauer Vineyards', 'Merlot', 'USA', 'California', 'Napa Valley', 750, 'mL', 'Aromas of fresh, ripe blueberries, ripe plum and black currant intertwine with notes of cedar, vanilla and pie crust. This medium-bodied wine is plush with flavors of plums, blueberries and fig.'),
    (5797, 'Hanna Chardonnay (750 mL)', 'Hanna Winery', 'Chardonnay', 'USA', 'California', '', 750, 'mL', 'The Hanna Chardonnay is power-packed, with ripe apple and a hint of creamy oak; substantial and layered on the palate.'),
    (61695, 'Kim Crawford Sauvignon Blanc (750 mL)', 'Kim Crawford', 'Sauvignon Blanc', 'New Zealand', 'Marlborough', '', 750, 'mL', 'Kim Crawford Sauvignon Blanc (750 mL)'),
    (80121, 'Sonoma-Cutrer Sonoma Coast Chardonnay (750 mL)', 'Sonoma-Cutrer Vineyards', 'Chardonnay', 'USA', 'California', '', 750, 'mL', 'Offering apple pastry and pear tart flavors; which feature a creamy texture; the palate is rich and well textured; finishing with a hint of angel food cake.'),
    (85465, 'Donovan-Parke Chardonnay (750 mL)', 'Donovan-Parke', 'Chardonnay', 'USA', 'California', '', 750, 'mL', 'Aromas of nectarine, and tropical fruits; light style, with a refreshing palate, showing layers of citrus fruits and custard; clean and crisp finish.'),
    (90748, 'Decoy by Duckhorn Cabernet Sauvignon (750 mL)', 'Duckhorn Vineyards', 'Cabernet Sauvignon', 'USA', 'California', '', 750, 'mL', 'Tasty red fruit is complemented by spicy oak in this approachable Cabernet; juicy mid-palate offers nice structure and lasting finish.'),
    (91279, 'Lillie''s Sauvignon Blanc (750 mL)', 'Guenoc & Langtry Estate Vineyards', 'Sauvignon Blanc', 'USA', 'California', 'Santa Barbara County', 750, 'mL', 'Lillie''s North Coast Sauvignon Blanc is a bright and crisp wine with fruit-forward notes of guava, pineapple, gooseberry, and lemon. Complete with a bright finish.'),
    (95340, 'La Marca Prosecco (750 mL)', 'La Marca', 'Sparkling', 'Italy', 'Veneto', 'Brut', 750, 'mL', 'With delicate, golden straw color and lively effervescence, this Prosecco has aromas of fresh citrus, honey and white flowers. The palate is fresh and clean with flavors of ripe lemon and green apple.'),
    (96070, 'Chateau Montelena Napa Valley Chardonnay (750 mL)', 'Chateau Montelena Winery', 'Chardonnay', 'USA', 'California', 'Napa Valley', 750, 'mL', 'Bright, focused and tightly wound, with tons of citrus peel, orchard fruit and floral notes; terrific energy on the palate with a very long and classy finish.'),
    (100328, 'Josh Cellars Cabernet Sauvignon (750 mL)', 'Josh Cellars', 'Cabernet Sauvignon', 'USA', 'California', 'North Coast', 750, 'mL', 'Delicious aromas of black currant and black cherry; the palate is full with with black fruits flavors that dominate the finish; very well balanced.'),
    (100835, 'Coppola Director''s Central Coast Chardonnay (750 mL)', 'Francis Ford Coppola Winery', 'Chardonnay', 'USA', 'California', 'Paso Robles', 750, 'mL', 'Very fragrant and juicy with an exotic perfume of melon, fig, tangerine and plumeria flowers followed by succulent flavors of peaches, pineapple, and spices that fold into a butterscotch finish.'),
    (106160, 'Unruly Chardonnay (750 mL)', 'Unruly', 'Chardonnay', 'USA', 'California', '', 750, 'mL', 'Ripe melon, and citrus aromas; medium bodied, with lush core fruit flavors with just a note of lemon zest; juicy and crisp on the finish.'),
    (118294, 'Chateau Montelena Napa Valley Cabernet Sauvignon (750 mL)', 'Chateau Montelena Winery', 'Cabernet Sauvignon', 'USA', 'California', 'Napa Valley', 750, 'mL', 'Among the most historic estates in Napa Valley, Chateau Montelena has long set the benchmark standard for what traditionally classic Napa Cabernet Sauvignon should be. Fresh and dynamic, with cranberry, cola, and raspberry jam. The acidity is laser focused, the spine pulling the layers of flavor into harmony with the wine?s supple, yet dense, structure. The tannins here serve to elevate not overwhelm the kinetic balance of texture, ripeness, and vineyard character.'),
    (120756, 'Encore Monterey Pinot Noir (750 mL)', 'Encore', 'Pinot Noir', 'USA', 'California', 'Monterey', 750, 'mL', 'The classic style Monterey Pinot; ruby color; with cherry aromas; medium bodied, with a lush black cherry palate; good structure and balance.'),
    (120922, 'Gruet Cuvee 89 Sparkling Rose (750 mL)', 'Gruet', 'Sparkling', 'USA', 'California', '', 750, 'mL', 'Cuvee 89 Rose by Gruet boasts floral aromas, ripe strawberry flavors, and finishes with round, zesty acidity.'),
    (133154, 'Unruly Rampant Sparkling Brut NV (750 mL)', 'Unruly', 'Sparkling', 'USA', 'California', '', 750, 'mL', 'A wonderful sparkling wine that offers bright citrus, pear and ginger aromas; rich, yet still creamy and well balanced; perfect to pair with popcorn.');

\c inventory

INSERT INTO
    inventory (sku_id, store_id, quantity)
VALUES
    (2572, 2803, 5),
    (2572, 3025, 6),
    (2572, 3027, 11),
    (2572, 3028, 2),
    (2572, 3033, 7),
    (2572, 6602, 9),
    (2682, 2803, 6),
    (2682, 3025, 8),
    (2682, 3027, 4),
    (2682, 3028, 7),
    (2682, 3033, 6),
    (2682, 6602, 6),
    (2922, 2803, 14),
    (2922, 3025, 1),
    (2922, 3027, 8),
    (2922, 3028, 5),
    (2922, 3033, 5),
    (2922, 6602, 15),
    (3115, 2803, 10),
    (3115, 3025, 2),
    (3115, 3027, 9),
    (3115, 3028, 5),
    (3115, 3033, 14),
    (3115, 6602, 3),
    (4457, 2803, 12),
    (4457, 3025, 6),
    (4457, 3027, 6),
    (4457, 3028, 14),
    (4457, 3033, 1),
    (4457, 6602, 15),
    (4459, 2803, 1),
    (4459, 3025, 7),
    (4459, 3027, 12),
    (4459, 3028, 2),
    (4459, 3033, 2),
    (4459, 6602, 4),
    (5797, 2803, 8),
    (5797, 3025, 6),
    (5797, 3027, 4),
    (5797, 3028, 9),
    (5797, 3033, 12),
    (5797, 6602, 12),
    (61695, 2803, 7),
    (61695, 3025, 9),
    (61695, 3027, 13),
    (61695, 3028, 5),
    (61695, 3033, 1),
    (61695, 6602, 2),
    (80121, 2803, 9),
    (80121, 3025, 7),
    (80121, 3027, 3),
    (80121, 3028, 5),
    (80121, 3033, 9),
    (80121, 6602, 11),
    (85465, 2803, 9),
    (85465, 3025, 11),
    (85465, 3027, 8),
    (85465, 3028, 1),
    (85465, 3033, 5),
    (85465, 6602, 15),
    (90748, 2803, 15),
    (90748, 3025, 4),
    (90748, 3027, 11),
    (90748, 3028, 3),
    (90748, 3033, 8),
    (90748, 6602, 11),
    (91279, 2803, 12),
    (91279, 3025, 9),
    (91279, 3027, 5),
    (91279, 3028, 3),
    (91279, 3033, 6),
    (91279, 6602, 4),
    (95340, 2803, 11),
    (95340, 3025, 2),
    (95340, 3027, 15),
    (95340, 3028, 5),
    (95340, 3033, 9),
    (95340, 6602, 9),
    (96070, 2803, 15),
    (96070, 3025, 6),
    (96070, 3027, 14),
    (96070, 3028, 12),
    (96070, 3033, 7),
    (96070, 6602, 7),
    (100328, 2803, 6),
    (100328, 3025, 7),
    (100328, 3027, 7),
    (100328, 3028, 6),
    (100328, 3033, 8),
    (100328, 6602, 9),
    (100835, 2803, 1),
    (100835, 3025, 3),
    (100835, 3027, 12),
    (100835, 3028, 4),
    (100835, 3033, 10),
    (100835, 6602, 14),
    (106160, 2803, 5),
    (106160, 3025, 5),
    (106160, 3027, 4),
    (106160, 3028, 4),
    (106160, 3033, 7),
    (106160, 6602, 12),
    (118294, 2803, 13),
    (118294, 3025, 6),
    (118294, 3027, 5),
    (118294, 3028, 15),
    (118294, 3033, 6),
    (118294, 6602, 5),
    (120756, 2803, 4),
    (120756, 3025, 5),
    (120756, 3027, 1),
    (120756, 3028, 3),
    (120756, 3033, 10),
    (120756, 6602, 1),
    (120922, 2803, 15),
    (120922, 3025, 9),
    (120922, 3027, 2),
    (120922, 3028, 1),
    (120922, 3033, 7),
    (120922, 6602, 4),
    (133154, 2803, 11),
    (133154, 3025, 6),
    (133154, 3027, 15),
    (133154, 3028, 7),
    (133154, 3033, 9),
    (133154, 6602, 10);

\c price

INSERT INTO
    price (sku_id, retail, sale)
VALUES
    (2572, 16.99, 11.99),
    (2682, 29.99, 24.99),
    (2922, 64.99, 59.99),
    (3115, 29.99, 20.99),
    (4457, 47.99, 39.99),
    (4459, 63.99, 51.99),
    (5797, 32.99, 27.99),
    (61695, 20.99, 15.99),
    (80121, 28.99, 37.99),
    (85465, 16.95, NULL),
    (90748, 26.99, 17.99),
    (91279, 23.95, NULL),
    (95340, 24.99, 13.99),
    (96070, 84.99, 74.99),
    (100328, 19.99, 12.99),
    (100835, 19.95, NULL),
    (106160, 15.95, NULL),
    (118294, 104.99, 84.99),
    (120756, 19.95, NULL),
    (120922, 23.95, NULL),
    (133154, 18.95, NULL);

\c rating

INSERT INTO
    rating (sku_id, count, score)
VALUES
    (2572, 4, 4.5),
    (2682, 5, 5),
    (2922, 12, 3.8),
    (3115, 6, 5),
    (4457, 17, 4.6),
    (4459, 1, 5),
    (5797, 2, 5),
    (61695, 8, 4.6),
    (80121, 3, 4.7),
    (85465, 4, 4.3),
    (90748, 2, 4.5),
    (91279, 11, 3.6),
    (95340, 9, 4.3),
    (96070, 2, 4.5),
    (100328, 2, 5),
    (100835, 14, 3.4),
    (106160, 8, 4.3),
    (118294, 0, 0),
    (120756, 7, 4.6),
    (120922, 12, 4.6),
    (133154, 2, 5);

\c review

INSERT INTO
    review (sku_id, user_id, author, summary, score)
VALUES
    (2572, '3f359f78-6682-5fcf-86b6-f737b29b9604', 'Priscilla', 'Meh. It was ok. But for the same price, Woodbridge is better.', 3),
    (2572, NULL, 'Guest', 'This is the BEST! Goes well with a seafood dinner or a movie night in with popcorn!', 5),
    (2572, 'bf753470-8311-d691-4171-21f2b375fd4b', 'Deb', 'This is my go to wine. Reasonable price, very fruity.', 5),
    (2682, NULL, 'Guest', 'This is the best Muscat I have tasted. It is sweet and soft… it warms your chest going down, but it’s delicious. Fifteen percent and I absolutely love it!', 5),
    (2682, '3388387e-d601-3856-6a27-2472bf41d3cb', 'WineManDan', 'The best Black Muscat I''ve ever tasted and that goes for the last 10 years of tasting Black Muscat''s.', 5),
    (2682, '6cbfe10d-60b0-5cdd-1d92-c0fddd2154f9', 'Monica', 'I thought this was a great sweet wine. On the top of my sweet red wine list. It is full bodied, tastes more alcoholic, and it also tastes like lychee (the fruit). I did not taste raspberry at all.', 5),
    (2922, NULL, 'Guest', 'We have this periodically and the last bottle we had was horrible! It was flat and tasted like some swill you would expect to buy in some neighborhood liquor store. Point being this should NEVER happen with a product like this and I''m too worn down to take it up with the retailer -- who I''m sure is understaffed and not interested.', 2),
    (2922, NULL, 'Guest', 'Love!', 5),
    (2922, NULL, 'Guest', 'This is not good champagne ... tart sour ... you are drinking $20 champagne with a $80 price.', 3),
    (3115, '3163a6ca-cfc2-f59c-fbb2-c5077660dc7f', 'Don', 'This is my go-to Pinot Grigio, especially if I am having guests over. Wonderful flavor, not too fruity or sweet, great with a nice seafood meal.', 5),
    (3115, '8daa8193-9408-f364-be6b-4ef3747f2ef5', 'BEATRIZ', 'My favorite Pinot Grigio. I have tried other kinds, but keep coming back for this one. Fresh, citric, fruits, not sweet.', 5),
    (3115, 'eedb18b5-a129-47dd-013a-189035e6828a', 'STEVEN B.', 'Absolutely the best. Just a bit more than I would usually spend but worth every penny.', 5),
    (4457, NULL, 'Guest', 'Love the fruity flavor!', 4),
    (4457, 'cdf8f067-fec7-e69b-0a65-e009072ac399', 'William', 'A base of toasty butter with levels of spice and fruit dancing above. Don’t drink too cold or you will miss it. This chardonnay is superb.', 5),
    (4457, NULL, 'Guest', 'Faultless and smooth as silk. If I could give it a 10, I would! Subtle oak and vanilla with a hint of butter, it’s simply just divine!', 5),
    (4459, 'bcbcc96b-2285-4e16-a4e6-7006d82f2617', 'DONA P.', 'Very nice wine by the glass or with dinner.', 5),
    (5797, '02af5583-8e8b-018d-e74e-d2ba9cc318b7', 'MICHELLE S.', 'This is a great Chardonnay. Pairs well with food but is also enjoyable on its own. Not your typical oak heavy, buttery Chardonnay. It is fresh, well balanced, and medium bodied.', 5),
    (5797, 'fa155f86-96f6-d1a1-58f2-38774340f344', 'Laura H.', 'Excellent Chardonnay! This may become my go to Chardonnay - Russian River AVA is always great. Very smooth with lots of taste. I didn''t even wait for it to get cold yet.', 5),
    (61695, NULL, 'Guest', 'It just got me.', 5),
    (61695, '42fa921a-82eb-cced-9b63-68fb121db29d', 'Joe', 'Nice, consistent Sauvignon Blanc. A go to after Mason SB.', 4),
    (61695, 'e748a9d9-2f51-e7ee-28d1-f3f5921c49ea', 'Smoke', 'Good value.', 4),
    (80121, NULL, 'Guest', 'The best chardonnay there is!', 5),
    (80121, '5622a309-2609-e089-af0c-ba0363715643', 'CRIS G.', 'Always a wonderful, smooth Chardonnay. It is consistently flavorful. You can''t go wrong with this Chardonnay. Sonoma-Cutrer earned my 5-Star rating!', 5),
    (80121, '9ab145cd-e720-fffa-05e7-e32025d8b439', 'Al T.', 'A very interesting Chardonnay. Starts off with crisp pear and apple flavors and finishes with cream.', 4),
    (85465, '46239dcd-9af4-2c34-6d37-f0a366f9e89e', 'Tom', 'Peach, stone fruit, and butter. That''s it.', 4),
    (85465, '7b460cd1-2622-9be5-c07b-357c7a3cb7b8', 'Smooth69', 'This wine is wonderful, especially when it''s on sale. Would recommend this wine to white wine drinkers.', 4),
    (85465, '357f2ed2-df68-b92a-c90a-1d1350e883e1', 'Donna S.', 'This one''s a keeper! Just finished a glass with my stir fry spicy chicken, veggies and rice -- good to the last drop. Can''t beat it for the price on sale! I''ll definitely buy again, and I''ve already recommended it to a fellow Chardonnay!', 5),
    (90748, 'f04abeff-760c-c654-de94-7a0bd457b041', 'Smoke', 'A good, secondary label Cabernet by an outstanding winery.', 4),
    (90748, 'c3463bfd-d25d-a19a-5b1e-19a7357db011', 'KDG', 'We discovered this wine via a recommendation from a waiter at a steakhouse we were at. My Son and I had a steak/filet and this wine paired perfectly. A wonderful smooth, rich Cabernet for the price, especially if you get a discount.', 5),
    (91279, NULL, 'Guest', 'This has been my favorite for about 6 years -- never without it in my fridge. However, the last 4 bottles (2021) have tasted like a totally different wine. Too acidic, too much grapefruit, lacking that subtle fruity palate. Going to have to find another Sauvignon Blanc to love.', 3),
    (91279, '8ccc8707-d962-3ed6-f2d4-e4df8ee793e1', 'Queenandre', 'Okay, not great. Would not buy again.', 2),
    (91279, '932ca28e-5c7e-f0ce-f61e-931b89cf74f0', 'ANNA', '2021 is way more "grapefruit" forward than 2020 was. To the point that it really didn''t match well with most foods and it wasn''t as great a sipping wine as the 2020. Thought maybe it was the bottle, so I tried another. Still grapefruit forward. Looking forward to trying next year''s.', 4),
    (95340, 'ffeae5f8-d4c9-61dc-7e5f-37ce8b613525', 'Bruce B.', 'It''s the best selling Prosecco in the USA for a reason, it''s cost-benefit is hard to beat. Great for everyday drinking and for mixing for: Aperol/Campari Spritz, Mimosas and Bellini''s (add puréed peaches, defrosted ones work fine, no sugar!)', 4),
    (95340, NULL, 'Guest', 'We purchased this to celebrate my moms 80th; everyone that stopped by and toasted her during the "covid drive by" wanted more… we had to buy more. Wonderful smooth flavor that was a hit with all.', 5),
    (95340, NULL, 'Guest', 'Don''t be fooled: it scores an 85 on Wine Spectator, not 90 as it''s currently listed. Off nose, off taste, watery. A blah overpriced Prosecco.', 1),
    (96070, '4c6f9272-0d3d-8636-d387-45a91bc86b6b', 'Ronald C.', 'Cheers and thank you to Jim Barrett. This Chardonnay is beyond explanation. Had this right after Jim passed us on to the great winery in the sky.', 4),
    (96070, 'cd1a2ada-e39a-b80c-1961-d1eceb1b6d66', 'ROBIN C.', 'Had this for my birthday yesterday. The best bottle of white wine of any kind I''ve ever tasted. Absolutely worth every dime.', 5),
    (100328, '64b654ea-9c17-509a-7ecb-dea660d59111', 'Chargergirl', 'Less expensive at Total Wines!', 5),
    (100328, '92c1621a-054e-e093-cd9d-8b2a841f5115', 'Mads', 'This is by far my favorite Cabernet Sauvignon that I''ve ever tried. Super inexpensive and a really nice flavor profile.', 5),
    (100835, 'dd2f36b9-d85f-7a5c-ff73-16747c621673', 'Brian', 'I found it undrinkable sad to say. It has a very strange off taste and finish. Doesn''t taste like a Chardonnay. Sorry I bought it.', 1),
    (100835, NULL, 'Guest', 'Gave this wine a try due to it being on sale and it''s really good! I will definitely buy this wine again.', 5),
    (100835, '7c1836a4-c1a4-fcf5-9be2-9262ee746b8b', 'Katie', 'Horrible! It does not compare to the last Central Coast Chardonnay ( with the dancers on the label). I couldn''t drink it. Wish I could find the old one.', 1),
    (106160, '9e17820c-96b9-7795-a709-62a9eba94bcd', 'Alice', 'With white wines, I don’t care for woody flavors or very dry wines, and tend to go more for a Rosé (not white but a good point of reference) or Riesling. I decided to give Chardonnay a try again and chose this one based on reviews. I’m so glad I did because it’s now a favorite of mine. No oakiness. It is the smoothest Chardonnay I’ve had. Very mellow and well balanced. Not sweet per-say, but not dry. Nice subtle tartness. I can’t say enough good things about this wine.', 5),
    (106160, NULL, 'Guest', 'Great Chardonnay with a unique attitude all of its own, not pretentious at all, just a delightfully cheeky profile. It''s only drawback is that it prices itself with the cult-club selections, which makes it somewhat of a naughty young whipper snapper. If that''s your thing, get naughty with it.', 4),
    (106160, 'd118d22a-e262-a6d1-eabf-aeb06a151c94', 'PHIL', 'A little too bubbly for a Chardonnay yet is ok for an every day wine. A great pick when on sale.', 3),
    (120756, NULL, 'Guest', 'Excellent! Lush, yet light and smooth. Stocking up!', 5),
    (120756, '581da6c1-c050-e25c-4d6b-c4b6d9655c61', 'Bahman', 'Very light, almost watery. Completely translucent in the glass. Has a slightly bitter aftertaste. Otherwise a good wine.', 3),
    (120756, 'b62dc9d4-155c-3cf7-0f65-4ca05885aafd', 'Wine Lady 126', 'This is a heartier style pinot even though from Monterey. Plenty of cherry cola flavors, and a nice edge of acidity make it an easy pair with salmon, chicken, or cheeses. Excellent choice for a bargain Pinot!', 4),
    (120922, '8fab3286-e34d-0540-a535-e8f19373f843', 'ROBERT', 'Best for mimosas. Buy it by the case.', 5),
    (120922, '6333a2d3-b525-219a-ecca-89f223fd3671', 'RickyD', 'Wonderful Róse, especially for the price point. Rivals most in the Napa Valley!', 4),
    (120922, NULL, 'Guest', 'Really good sparkling wine. Well balanced. Perfect for summer daytime picnics.', 5),
    (133154, NULL, 'Guest', 'Excellent and so tasty.', 5),
    (133154, NULL, 'Guest', 'I cannot believe Unruly came out with a Sparkling Wine. This is awesome! I just had it for my Easter Brunch and it was delicious. Amazing!', 5);

\c sku

INSERT INTO
    sku (sku_id)
VALUES
    (2572),
    (2682),
    (2922),
    (3115),
    (4457),
    (4459),
    (5797),
    (61695),
    (80121),
    (85465),
    (90748),
    (91279),
    (95340),
    (96070),
    (100328),
    (100835),
    (106160),
    (118294),
    (120756),
    (120922),
    (133154);

\c store

INSERT INTO
    store (store_id, name, address, city, state, zip_code, latitude, longitude)
VALUES
    (2803, 'Santa Clara', '3149 Stevens Creek Boulevard', 'San Jose', 'CA', 95117, 37.323886, -121.952181),
    (3025, 'Sunnyvale', '1247 West El Camino Real', 'Sunnyvale', 'CA', 94086, 37.375004, -122.057389),
    (3027, 'San Jose - Willow Glen', '1133 Lincoln Avenue', 'San Jose', 'CA', 95125, 37.307687, -121.900973),
    (3028, 'San Jose - Blossom Hill', '871 Blossom Hill Road', 'San Jose', 'CA', 95123, 37.251831, -121.857595),
    (3033, 'San Jose - Westgate', '5205 Prospect Road', 'San Jose', 'CA', 95129, 37.292896, -121.99263),
    (6602, 'Los Gatos', '636 Blossom Hill Road', 'Los Gatos', 'CA', 95032, 37.2354774, -121.9640198);
