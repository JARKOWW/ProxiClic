# Mise en production de Proxi'Clic

Ce guide liste ce qu'il faut faire **en dehors du code** pour ouvrir le site au public, sur Vercel (prototype actuel)
puis sur le VPS Contabo (hébergement prévu). Le code applique déjà : mentions légales, politique de confidentialité,
CGU avec case à cocher, suppression et export du compte, aidants majeurs, mots de passe de 12 caractères,
limitation des tentatives stockée en base, sessions révocables, CSP, assistant IA signalé comme tel.

## 1. Variables d'environnement

Toutes sont décrites dans `.env.example`. En production, au minimum :

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | base de production |
| `SESSION_SECRET` | `openssl rand -base64 48` — **une valeur propre à la production**, jamais partagée |
| `LEGAL_EDITOR_NAME`, `LEGAL_PUBLICATION_DIRECTOR`, `LEGAL_CONTACT_EMAIL` | à valider avec le responsable juridique |
| `LEGAL_HOST` / `LEGAL_HOST_PHONE` | `vercel` ou `contabo`, et le téléphone de l'hébergeur relevé sur son site |
| `GROQ_API_KEY` | facultatif ; activer **Zero Data Retention** dans les Data Controls du compte Groq |

Changer `SESSION_SECRET` déconnecte tout le monde : à faire si l'ancienne valeur a pu fuiter.

## 2. Comptes de démonstration

La migration `0006_rotate_demo_passwords` remplace le mot de passe de tous les comptes `@example.fr` (l'ancien
était publié dans l'historique du dépôt) et ferme leurs sessions. Elle s'exécute au prochain déploiement
(`npm run build` lance les migrations).

- Pour choisir un autre mot de passe plus tard : `SEED_PASSWORD="…" npm run db:rotate-demo` avec la
  `DATABASE_URL` de production.
- Tant que des comptes `@example.fr` existent, un bandeau « Site de démonstration » s'affiche (les faux avis
  présentés comme réels sont interdits, Code de la consommation L121-4).
- **Avant l'ouverture au public : partir d'une base vide** (ne pas lancer `db:seed` en production).

## 3. Vercel (prototype)

- `vercel.json` fixe la région des fonctions à Paris (`cdg1`). Vérifier que la base de données est elle aussi
  dans l'Union européenne.
- Accepter le DPA de Vercel et le conserver (sous-traitant, RGPD art. 28).

## 4. VPS Contabo

### Système

```bash
adduser --disabled-password proxiclic          # utilisateur dédié, sans droits root
apt update && apt install -y nginx certbot python3-certbot-nginx ufw fail2ban unattended-upgrades sqlite3
dpkg-reconfigure -plow unattended-upgrades     # mises à jour de sécurité automatiques
ufw default deny incoming && ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

Dans `/etc/ssh/sshd_config` : `PasswordAuthentication no` et `PermitRootLogin no` (après avoir installé
votre clé SSH), puis `systemctl reload ssh`.

### Application

```bash
# en tant que proxiclic, dans /home/proxiclic/app
npm ci && npm run build
chmod 600 .env data/proxitech.db
```

`/etc/systemd/system/proxiclic.service` :

```ini
[Unit]
Description=Proxi'Clic
After=network.target

[Service]
User=proxiclic
WorkingDirectory=/home/proxiclic/app
Environment=NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1
ExecStart=/usr/bin/npm start
Restart=always
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/home/proxiclic/app/data

[Install]
WantedBy=multi-user.target
```

### nginx et HTTPS

```nginx
server {
    server_name proxiclic.eu www.proxiclic.eu;
    client_max_body_size 5m;   # avis avec 3 photos

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        # Indispensable : on écrase l'IP fournie par le client, sinon la limitation des tentatives
        # de connexion peut être contournée.
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
certbot --nginx -d proxiclic.eu -d www.proxiclic.eu --redirect   # HTTPS + renouvellement automatique
```

### Sauvegardes chiffrées et purge

`/etc/cron.d/proxiclic` :

```cron
# Purge quotidienne (durées de conservation de la politique de confidentialité)
15 3 * * * proxiclic cd /home/proxiclic/app && npm run db:purge >> /home/proxiclic/purge.log 2>&1
# Sauvegarde chiffrée quotidienne, gardée 30 jours
30 3 * * * proxiclic /home/proxiclic/backup.sh
```

`/home/proxiclic/backup.sh` (la clé publique GPG est celle d'un membre de l'équipe ; la clé privée n'est
jamais sur le VPS) :

```bash
#!/bin/sh
set -e
d=$(date +%F)
sqlite3 /home/proxiclic/app/data/proxitech.db ".backup /tmp/proxiclic-$d.db"
gpg --batch --yes --trust-model always -r sauvegarde@proxiclic.eu -o /home/proxiclic/backups/proxiclic-$d.db.gpg -e /tmp/proxiclic-$d.db
rm /tmp/proxiclic-$d.db
find /home/proxiclic/backups -name '*.gpg' -mtime +30 -delete
# Copier ensuite les sauvegardes hors du VPS (rclone, scp…) : un snapshot n'est pas une sauvegarde.
```

Tester une restauration au moins une fois avant l'ouverture.

### Démarches

- Accepter le contrat de traitement des données (DPA) de Contabo et le conserver.
- Passer `LEGAL_HOST=contabo` et renseigner `LEGAL_HOST_PHONE`.
- Mettre à jour la politique de confidentialité si d'autres services sont ajoutés (envoi d'e-mails, supervision).

## 5. Reste à faire côté juridique (non technique)

- Valider le texte des mentions légales, de la politique de confidentialité et des CGU (`src/app/…/page.tsx`).
- Tenir le registre des traitements (RGPD art. 30) et réaliser l'analyse d'impact (AIPD) : public vulnérable,
  notation des aidants.
- Vérifier la couverture responsabilité civile des aidants et souscrire une RC pour la plateforme.
- Vérifier les garanties de transfert proposées par Groq (clauses contractuelles types) avant d'activer l'IA.
- Recherche d'antériorité INPI / EUIPO sur le nom « Proxi'Clic ».
