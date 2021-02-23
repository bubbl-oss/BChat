/* eslint-disable no-unused-vars */
/* eslint-disable prefer-const */
const fs = require('fs');
const path = require('path');
const http = require('http');
const { upload, url } = require('./uploader');

const rooms_db_path = `${path.dirname(
  require.main.filename
)}/db/rooms-datafile.db`;
const users_db_path = `${path.dirname(
  require.main.filename
)}/db/users-datafile.db`;

function ensureDirectoryExistence(dirname) {
  return new Promise((resolve, reject) => {
    console.log('dir => ', dirname);

    if (fs.existsSync(dirname)) {
      console.log('exists!');
      return resolve(true);
    }

    fs.mkdirSync(dirname);

    resolve(true);

    // ensureDirectoryExistence(dirname);
  });
}
async function uploadDb(db) {
  try {
    await ensureDirectoryExistence(`${path.dirname(require.main.filename)}/db`);

    const [ps, us] = await Promise.all([
      db.rooms.find().exec(),
      db.users.find().exec(),
    ]);

    let rooms_file;
    let users_file;

    rooms_file = await fs.promises
      .open(rooms_db_path, 'w+')
      .then((fd) => {
        return fs.createWriteStream(rooms_db_path, { fd });
      })
      .catch((err) => {
        throw err;
      });

    // open the file and then create the file if it doesn't exist
    users_file = await fs.promises
      .open(users_db_path, 'w+')
      .then((fd) => {
        return fs.createWriteStream(users_db_path, { fd });
      })
      .catch((err) => {
        throw err;
      });

    ps.forEach((value) => rooms_file.write(`${JSON.stringify(value)}\n`));
    rooms_file.end();

    us.forEach((value) => users_file.write(`${JSON.stringify(value)}\n`));
    users_file.end();

    console.log('DONE APPPENDING FILE %s', new Date().toLocaleTimeString());

    // after all this...

    return Promise.all([upload(rooms_db_path), upload(users_db_path)]);
  } catch (error) {
    console.log('Error creating database files!\n\n');

    throw error;
  }

  // return uploadDirectory({
  //   path: `${path.dirname(require.main.filename)}/db`,
  //   params: {
  //     Bucket: process.env.S3_BUCKET_NAME.trim().toLocaleLowerCase(),
  //     CacheControl: "86400",
  //   },
  //   // rootKey: "db",
  // });
}

function pDownload(download_url, dest) {
  const file = fs.createWriteStream(dest, { flags: 'w+' });
  return new Promise((resolve, reject) => {
    let responseSent = false; // flag to make sure that response is sent only once.
    http
      .get(download_url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (responseSent) return;
            responseSent = true;
            resolve();
          });
        });
      })
      .on('error', (err) => {
        console.log('here in http.error', err);

        if (responseSent) return;
        responseSent = true;
        reject(err);
      });
  });
}

function shutdown(signal, db) {
  return async (err) => {
    if (signal === 'uncaughtException') {
      console.log(err);
      return process.exit(err ? 1 : 0);
    }

    console.log(
      `${signal}... Shutting down Node app gracefully! Thank you Jesus!`
    );
    // Upload db to S3 to back it up!

    try {
      await uploadDb(db)
        .then((data) => {
          //   console.log("data =>", JSON.stringify(data));
          console.log('DONE uploading db folders :) thank you Jesus!');
          process.exit(err ? 1 : 0);
        })
        .catch((err) => {
          console.log('Error uploading folder to S3 =>\n', err.stack || err);
          process.exit(1);
        });
    } catch (err) {
      if (err) console.error(err.stack || err);
      process.exit(err ? 1 : 0);
    }
  };
}

async function saveFiles() {
  const room_url = process.env.ROOMS_DB_URL.trim();
  const users_url = process.env.USERS_DB_URL.trim();

  //   if (fs.existsSync(`${path.dirname(require.main.filename)}/db`)) {
  //     console.log("exists!");
  //     // resolve(true);
  //     fs.mkdirSync(`${path.dirname(require.main.filename)}/db`);
  //   }

  return ensureDirectoryExistence(
    `${path.dirname(require.main.filename)}/db`
  ).then((r) => {
    return Promise.all([
      pDownload(room_url, rooms_db_path),
      pDownload(users_url, users_db_path),
    ]);
  });
}

module.exports = {
  shutdown,
  saveFiles,
};
