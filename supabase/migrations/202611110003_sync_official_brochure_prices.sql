-- Sync product prices, names, and dimensions to match official Ciamis Pandan Craft brochure

update public.products
set price = 100000
where slug = 'tas-kantor';

update public.products
set price = 25000
where slug = 'sandal-hotel';

update public.products
set price = 35000
where slug = 'kotak-tisu';

update public.products
set
  name = 'Lampu Hias Model Tinggi',
  price = 200000,
  dimensions = 'Tinggi: 94cm | Lingkaran: 38cm',
  description = 'Lampu hias anyaman pandan dengan bentuk ramping dan elegan, cocok untuk ruang tamu maupun kamar tidur. Terbuat dari bahan alami yang kuat dan tahan lama.'
where slug = 'lampu-hias-berdiri';

update public.products
set
  name = 'Lampu Hias',
  price = 350000,
  dimensions = 'Tinggi: 105cm | Lingkaran: 30cm',
  description = 'Menghadirkan suasana hangat dan natural untuk ruang tamu maupun kamar tidur. Terbuat dari bahan pandan alami yang kuat dan tahan lama.'
where slug = 'lampu-hias';
