-- Point product images at WebP assets (same filenames, .webp extension).
update products set image_url = replace(image_url, '.jpg', '.webp'), updated_at = now()
  where image_url like '/images/%.jpg';
update products set image_url = replace(image_url, '.png', '.webp'), updated_at = now()
  where image_url like '/images/%.png';
