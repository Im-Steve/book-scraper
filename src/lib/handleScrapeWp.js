const fs = require('fs');
const path = require('path');
const { exitProcess, findFileByName, writeLog } = require('useful-toolbox-js');

const scrapeWpBooks = require('./scrapeWpBooks');

const { FOLDER_WITH_BOOK_LINKS_WP, FOLDER_WITH_BOOK_DATA_WP } = require('../constants');

async function scrapeWpBooksFromCat() {
  const catalog = process.argv.length >= 4 && process.argv[3];
  if (!catalog) {
    writeLog.error('Error: No catalog provided');
    await exitProcess();
  }
  const fileWithBookLinks = findFileByName(catalog, FOLDER_WITH_BOOK_LINKS_WP);
  writeLog.log('--------------------');

  await scrapeWpBooks([fileWithBookLinks]);
}

async function scrapeWpBooksFromAll() {
  const filesWithBookLinks = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_LINKS_WP);
  folderFiles.forEach((file) => {
    if (file.includes('.xlsx')) {
      filesWithBookLinks.push(path.join(FOLDER_WITH_BOOK_LINKS_WP, file));
    }
  });

  if (Array.isArray(filesWithBookLinks) && filesWithBookLinks.length > 0) {
    await scrapeWpBooks(filesWithBookLinks);
  } else {
    writeLog.alert(`No files with book links in the folder ${FOLDER_WITH_BOOK_LINKS_WP}`);
  }
}

async function scrapeWpBookData() {
  const filesWithBookLinks = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_DATA_WP);
  folderFiles.forEach((file) => {
    if (file.includes('.json') && !file.includes('WIP')) {
      filesWithBookLinks.push(path.join(FOLDER_WITH_BOOK_DATA_WP, file));
    }
  });

  if (Array.isArray(filesWithBookLinks) && filesWithBookLinks.length > 0) {
    await scrapeWpBooks(filesWithBookLinks);
  } else {
    writeLog.alert(`No JSON files in the folder ${FOLDER_WITH_BOOK_DATA_WP}`);
  }
}

async function scrapeWpBooksFromFile() {
  const file = process.argv.length >= 4 && process.argv[3];
  if (!file) {
    writeLog.error('Error: No file provided');
    await exitProcess();
  }

  await scrapeWpBooks([file]);
}

module.exports = {
  scrapeWpBooksFromCat,
  scrapeWpBooksFromAll,
  scrapeWpBookData,
  scrapeWpBooksFromFile,
};
