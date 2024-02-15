const fs = require('fs');
const path = require('path');
const { writeLog } = require('useful-toolbox-js');

const findFileByName = require('../func/findFileByName');
const scrapeBooks = require('./scrapeBooks');

const { FOLDER_WITH_BOOK_LINKS, FOLDER_WITH_BOOK_DATA } = require('../constants');

async function scrapeBooksFromNewBooks() {
  await scrapeBooks([
    path.join(FOLDER_WITH_BOOK_LINKS, 'nouveautes.xlsx'),
    path.join(FOLDER_WITH_BOOK_LINKS, 'a-paraitre.xlsx'),
  ]);
}

async function scrapeBooksFromBestsellers() {
  await scrapeBooks([path.join(FOLDER_WITH_BOOK_LINKS, 'palmares.xlsx')]);
}

async function scrapeBooksFromCat() {
  const catalogArg = process.argv.length >= 4 && process.argv[3];
  const bookLinkFile = findFileByName(catalogArg, FOLDER_WITH_BOOK_LINKS);
  writeLog.log('--------------------');
  await scrapeBooks([bookLinkFile]);
}

async function scrapeBooksFromMainCat() {
  const bookLinkFiles = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_LINKS);

  folderFiles.forEach((file) => {
    if (file !== 'nouveautes.xlsx'
    && file !== 'a-paraitre.xlsx'
    && file !== 'palmares.xlsx') {
      bookLinkFiles.push(path.join(FOLDER_WITH_BOOK_LINKS, file));
    }
  });

  await scrapeBooks(bookLinkFiles);
}

async function scrapeBooksFromAllCatalogs() {
  const bookLinkFiles = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_LINKS);

  folderFiles.forEach((file) => {
    bookLinkFiles.push(path.join(FOLDER_WITH_BOOK_LINKS, file));
  });

  await scrapeBooks(bookLinkFiles);
}

async function scrapeBookData() {
  const bookLinkFiles = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_DATA);

  folderFiles.forEach((file) => {
    if (file.includes('.xlsx')) {
      bookLinkFiles.push(path.join(FOLDER_WITH_BOOK_DATA, file));
    }
  });

  await scrapeBooks(bookLinkFiles);
}

async function scrapeBooksFromFile() {
  const file = process.argv.length >= 4 && process.argv[3];
  await scrapeBooks([file]);
}

module.exports = {
  scrapeBooksFromNewBooks,
  scrapeBooksFromBestsellers,
  scrapeBooksFromCat,
  scrapeBooksFromMainCat,
  scrapeBooksFromAllCatalogs,
  scrapeBookData,
  scrapeBooksFromFile,
};
