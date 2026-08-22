#!/bin/sh
set -e

# Premier démarrage sur un volume vide : recopie les photos produit livrées
# avec l'image (voir Dockerfile). Une fois le volume alimenté, on n'y touche
# plus jamais — les photos ajoutées depuis l'admin restent en place aux
# déploiements suivants.
if [ -d /var/www/html/uploads_produits_initial ] && [ -z "$(ls -A /var/www/html/uploads/produits 2>/dev/null)" ]; then
    cp -a /var/www/html/uploads_produits_initial/. /var/www/html/uploads/produits/
    chown -R www-data:www-data /var/www/html/uploads/produits
fi

# Railway fournit le port d'écoute via $PORT ; l'image Apache officielle
# écoute sur 80 par défaut, donc on adapte au démarrage.
: "${PORT:=80}"
sed -i "s/80/${PORT}/g" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

exec "$@"
