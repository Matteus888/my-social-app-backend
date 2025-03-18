# My Social App - Backend

Bienvenue dans le repository backend de **My Social App**, une application sociale inspirée de Facebook, permettant de suivre des utilisateurs, envoyer des messages et personnaliser son profil.

## Prérequis

Avant de lancer le projet, assurez-vous d'avoir les outils suivants installés :

- [Node.js](https://nodejs.org/) (version recommandée : 18.x)
- [yarn](https://yarnpkg.com/)
- [Express.js](https://expressjs.com/)

## Installation

1. Clonez ce repository :
   ```bash
   git clone https://github.com/votre-utilisateur/my-social-app-backend.git
   ```
2. Accédez au dossier du projet :
   ```bash
   cd my-social-app-backend
   ```
3. Installez les dépendances :
   ```bash
   yarn install
   ```

## Configuration

Créez un fichier `.env` à la racine du projet et ajoutez-y les variables d'environnement suivantes :

```
DATABASE_CONNECTION_STRING=yourMongoDbConnectionString
JWT_SECRET=yourJwtSecret
CLOUDINARY_CLOUD_NAME=yourCloudinaryCloudName
CLOUDINARY_API_KEY=yourCloudinaryApiKey
CLOUDINARY_API_SECRET=yourCloudinaryApiSecret
```

## Scripts disponibles

- **Démarrage du serveur** :
  ```bash
  yarn start
  ```

## Structure du projet

La structure du projet est la suivante :

```
/src
  /config
  /modules
  /models
  /routes
  /bin
```

## Fonctionnalités principales

- Gestion des utilisateurs (inscription, connexion, modification du profil)
- Système de followers/following
- Gestion des relations amicales
- Envoi et réception de messages
- Gestion des médias via Cloudinary

## Lien vers le frontend

[My Social App - Frontend](https://my-80store-frontend.vercel.app/)

## Contribution

Les contributions sont les bienvenues ! Pour proposer des améliorations ou signaler des bugs :

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité : `git checkout -b ma-nouvelle-fonctionnalite`
3. Commitez vos changements : `git commit -m 'Ajout de ma fonctionnalité'`
4. Poussez la branche : `git push origin ma-nouvelle-fonctionnalite`
5. Créez une Pull Request

