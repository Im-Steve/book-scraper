const fs = require('fs');
const path = require('path');
const { ll } = require('my-scrapers');
const {
  exitProcess,
  findFileByName,
  importExcelFile,
  writeLog,
} = require('useful-toolbox-js');

const { FILE_WITH_GET_ERRORS } = require('../constants');
const getBooks = require('./getBooks');

async function getBooksFromCat() {
  const catalog = process.argv.length >= 4 && process.argv[3];
  if (!catalog) {
    writeLog.error('Error: No catalog provided');
    await exitProcess();
  }
  const file = findFileByName(catalog, ll.folderWithCatalogLinks);
  writeLog.log('--------------------');

  await getBooks([file]);
}

async function getBooksFromAll() {
  const filesWithCatalogLinks = [];

  const folderFiles = fs.readdirSync(ll.folderWithCatalogLinks);
  folderFiles.forEach((file) => {
    if (file.includes('.xlsx')) {
      filesWithCatalogLinks.push(path.join(ll.folderWithCatalogLinks, file));
    }
  });

  await getBooks(filesWithCatalogLinks);
}

async function getBooksFromErrors() {
  const writeDebug = writeLog.setDebug('g');
  const filesWithCatalogLinks = [];

  const catalogsWithError = importExcelFile(FILE_WITH_GET_ERRORS).data;
  writeLog.log('--------------------');

  catalogsWithError.forEach((catalogObj) => {
    const file = findFileByName(
      catalogObj.catalog,
      ll.folderWithCatalogLinks,
      { displayLogs: false },
    );
    filesWithCatalogLinks.push(file);
  });
  writeDebug(`filesWithCatalogLinks: ${JSON.stringify(filesWithCatalogLinks, null, 2)}`);
  writeDebug('--------------------');

  await getBooks(filesWithCatalogLinks);
}

async function getBooksFromFile() {
  const file = process.argv.length >= 4 && process.argv[3];
  if (!file) {
    writeLog.error('Error: No file provided');
    await exitProcess();
  }

  await getBooks([file]);
}

module.exports = {
  getBooksFromCat,
  getBooksFromAll,
  getBooksFromErrors,
  getBooksFromFile,
};
