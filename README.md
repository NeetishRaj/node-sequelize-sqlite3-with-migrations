
## Setup Sequelize init

Step 1: Run `node_modules/.bin/sequelize init`

Step 2: Update config/config.json to support sqlite memory

Step 3: Generate SQL models.
```
node_modules/.bin/sequelize model:generate --name Players --attributes name:string,position:string

node_modules/.bin/sequelize model:generate --name Skills --attributes playerId:number,skill:string,value:number
```

Step 4: Run SQL migration to create the tables
```
node_modules/.bin/sequelize db:migrate
```

Step 5: Can open newly created tables
```
sqlite3 database.sqlite3
```
can check schema with `.schema` command

```
CREATE TABLE `Players` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `name` VARCHAR(255), `position` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);
CREATE TABLE `Skills` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `playerId` NUMBER, `skill` VARCHAR(255), `value` NUMBER, `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NULL);
```

Step 6: Creating and updating seeder script to populate the tables
```
node_modules/.bin/sequelize seed:generate --name seed-players
node_modules/.bin/sequelize seed:generate --name seed-skills
```

Step 7: Run all the seeders
```
node_modules/.bin/sequelize db:seed:all
```
