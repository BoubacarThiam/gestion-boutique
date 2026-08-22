# Image de production pour Railway (ou tout hébergeur Docker). Apache +
# mod_rewrite pour que .htaccess route tout vers index.php, comme documenté
# pour l'hébergement mutualisé dans le README.
FROM php:8.2-apache

RUN docker-php-ext-install pdo_mysql \
    && a2enmod rewrite \
    && sed -ri 's/AllowOverride None/AllowOverride All/g' /etc/apache2/apache2.conf

WORKDIR /var/www/html
COPY . /var/www/html/

# uploads/produits/ devient le point de montage d'un volume Railway
# persistant (voir README) — on garde donc une copie de départ des photos
# livrées avec l'image à part, que docker-entrypoint.sh recopie dans le
# volume UNIQUEMENT s'il est vide (premier démarrage). Les photos ajoutées
# ensuite depuis l'admin ne sont ainsi jamais écrasées par un redéploiement.
RUN mv /var/www/html/uploads/produits /var/www/html/uploads_produits_initial \
    && mkdir -p /var/www/html/uploads/produits \
    && chown -R www-data:www-data /var/www/html/uploads

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
