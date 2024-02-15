const { ll } = require('my-scrapers');

const { FILE_WITH_GET_ERRORS } = require('../constants');

const getBooks = require('./getBooks');

async function getBooksFromNewBooks() {
  await getBooks(ll.catalogLinkFiles.newBooks);
}

async function getBooksFromBestsellers() {
  await getBooks(ll.catalogLinkFiles.bestsellers);
}

async function getBooksFromMainCat() {
  await getBooks(ll.catalogLinkFiles.mainCatalogs);
}

async function getBooksFromAllCatalogs() {
  await getBooks(ll.catalogLinkFiles.allCatalogs);
}

async function getBooksFromErrors() {
  await getBooks([FILE_WITH_GET_ERRORS]);
}

async function getBooksFromFile() {
  const file = process.argv.length >= 4 && process.argv[3];
  await getBooks([file]);
}

module.exports = {
  getBooksFromNewBooks,
  getBooksFromBestsellers,
  getBooksFromMainCat,
  getBooksFromAllCatalogs,
  getBooksFromErrors,
  getBooksFromFile,
};
