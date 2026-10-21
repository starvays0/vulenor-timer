# İzinli yerel müzik arşivi

Arşiv bilerek boştur: henüz kullanım hakkı doğrulanmış kayıt sağlanmadı. YouTube dosyalarını indirmeyin veya arşive kopyalamayın.

`manifest.json` sürüm 1, `tracks` dizisi kullanır. Her kayıt: `id` (benzersiz), `title`, `category` (`classical`, `jazz`, `lofi`, `ambient`), `src` (`/timer/archive/tracks/<dosya>.mp3`, `.ogg`, `.m4a` veya `.wav`), `license` (lisans / hak sahibi ve izin kaynağı). Dosya adı yalnız ASCII harf, rakam, `_`, `-` içermeli. Kaynak ve lisans belgesini burada kaydedin; manifestteki lisans metni kendi başına kullanım hakkı oluşturmaz.

Gerçek dosyaları `tracks/` dizinine koyun, yalnız doğrulanmış izinli kayıtları manifestte listeleyin. Statik servis için restart gerekmez. Tarayıcı listeyi yükler, türe göre süzer; çalan parça bitince aynı türün sonraki parçasına geçer. İlk yükleme ve kaynak/tür/parça değişimi kendiliğinden çalmaz. Arşivde odak modunda ses devam eder; YouTube odak/gizli sekme/ekran dışı durumunda duraklatılır. Arşiv dosyası oynatması gerçek bir kayıt eklenene kadar canlı doğrulanamaz.
