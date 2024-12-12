const fs = require('fs');
const path = require('path');
const { exitProcess, findFileByName, writeLog } = require('useful-toolbox-js');

const scrapeBooks = require('./scrapeBooks');

const { FOLDER_WITH_BOOK_LINKS_CLEANED, FOLDER_WITH_BOOK_DATA } = require('../constants');

async function scrapeBooksFromCat() {
  const catalog = process.argv.length >= 4 && process.argv[3];
  if (!catalog) {
    writeLog.error('Error: No catalog provided');
    await exitProcess();
  }
  const fileWithBookLinks = findFileByName(catalog, FOLDER_WITH_BOOK_LINKS_CLEANED);
  writeLog.log('--------------------');

  await scrapeBooks([fileWithBookLinks]);
}

async function scrapeBooksFromAll() {
  const filesWithBookLinks = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_LINKS_CLEANED);
  folderFiles.forEach((file) => {
    if (file.includes('.xlsx')) {
      filesWithBookLinks.push(path.join(FOLDER_WITH_BOOK_LINKS_CLEANED, file));
    }
  });

  if (Array.isArray(filesWithBookLinks) && filesWithBookLinks.length > 0) {
    await scrapeBooks(filesWithBookLinks);
  } else {
    writeLog.alert(`No files with book links in the folder ${FOLDER_WITH_BOOK_LINKS_CLEANED}`);
  }
}

async function scrapeBookData() {
  const filesWithBookLinks = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_DATA);
  folderFiles.forEach((file) => {
    if (file.includes('.json') && !file.includes('WIP')) {
      filesWithBookLinks.push(path.join(FOLDER_WITH_BOOK_DATA, file));
    }
  });

  if (Array.isArray(filesWithBookLinks) && filesWithBookLinks.length > 0) {
    await scrapeBooks(filesWithBookLinks);
  } else {
    writeLog.alert(`No JSON files in the folder ${FOLDER_WITH_BOOK_DATA}`);
  }
}

async function scrapeBooksFromFile() {
  const file = process.argv.length >= 4 && process.argv[3];
  if (!file) {
    writeLog.error('Error: No file provided');
    await exitProcess();
  }

  await scrapeBooks([file]);
}

module.exports = {
  scrapeBooksFromCat,
  scrapeBooksFromAll,
  scrapeBookData,
  scrapeBooksFromFile,
};
