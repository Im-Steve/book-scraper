const { wp } = require('my-scrapers');
const { exitProcess, writeLog } = require('useful-toolbox-js');

const { FILE_WITH_GET_ERRORS_WP } = require('../constants');
const getWpBooks = require('./getWpBooks');

async function getWpBooksFromAll() {
  await getWpBooks(wp.fileWithCatalogLinks);
}

async function getWpBooksFromErrors() {
  await getWpBooks(FILE_WITH_GET_ERRORS_WP);
}

async function getWpBooksFromFile() {
  const file = process.argv.length >= 4 && process.argv[3];
  if (!file) {
    writeLog.error('Error: No file provided');
    await exitProcess();
  }

  await getWpBooks(file);
}

module.exports = {
  getWpBooksFromAll,
  getWpBooksFromErrors,
  getWpBooksFromFile,
};
