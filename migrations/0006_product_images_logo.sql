-- Re-point all catalog products to logo-branded product photos.

update products set image_url = '/images/product-legacy-tumbler.jpg', updated_at = now()
 where id = 'prod-tumbler';
update products set image_url = '/images/product-mission-polo.jpg', updated_at = now()
 where id = 'prod-polo';
update products set image_url = '/images/product-legacy-tee.jpg', updated_at = now()
 where id = 'prod-tee';
update products set image_url = '/images/product-hope-hoodie.jpg', updated_at = now()
 where id = 'prod-hoodie';
update products set image_url = '/images/product-legacy-cap.jpg', updated_at = now()
 where id = 'prod-cap';
update products set image_url = '/images/product-hope-tote.jpg', updated_at = now()
 where id = 'prod-tote';
update products set image_url = '/images/product-sticker-pack.jpg', updated_at = now()
 where id = 'prod-sticker';
update products set image_url = '/images/product-founders-patch.jpg', updated_at = now()
 where id = 'prod-retired';
