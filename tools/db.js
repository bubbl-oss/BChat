const Datastore = require('nedb-promises');
const path = require('path');
const { saveFiles } = require('./persist-db');

const users_collection = Datastore.create({
  filename: path.resolve(
    `${path.dirname(require.main.filename)}/db/users-datafile.db`
  ),
  autoload: false,
}).on('load', () => {
  console.log('users collection loaded');
});

const rooms_collection = Datastore.create({
  filename: path.resolve(
    `${path.dirname(require.main.filename)}/db/rooms-datafile.db`
  ),
  autoload: false,
}).on('load', () => {
  console.log('rooms collection loaded');
});

const db = {
  users: users_collection,
  rooms: rooms_collection,
};

module.exports = async () => {
  if (process.env.NODE_ENV.trim() === 'dev') return db;

  try {
    const saved = await saveFiles();

    await db.users.load();
    await db.rooms.load();

    console.log('Success saving database files!');
    console.log(JSON.stringify(saved));
  } catch (error) {
    console.log('Error saving database files :/\n', error);
    console.error(error);
  }

  return db;
};
