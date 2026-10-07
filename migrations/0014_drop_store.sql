-- Remove the online store. The store was retired from this site (Regina runs
-- her own), so its tables are dropped. Created by 0004_shop.sql and
-- 0008_shop_public_setting.sql; no enums or sequences were ever created
-- (ids are text). Children first, so no CASCADE is needed.
--
-- WARNING: applying this on a database drops all store products, orders and
-- order items in it. Back them up first if they matter.

drop table if exists order_items;
drop table if exists orders;
drop table if exists products;
drop table if exists site_settings;
