const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {
  exitProcess,
  findFileByName,
  importExcelFile,
  writeLog,
} = require('useful-toolbox-js');

const extractSeriesLinks = require('./extractSeriesLinks');
const getBooks = require('./getBooks');
const scrapeBooks = require('./scrapeBooks');

const {
  TEMP_FOLDER,
  FILE_WITH_GET_ERRORS,
  FOLDER_WITH_BOOK_DATA,
  FOLDER_WITH_SERIES_LINKS,
  FOLDER_WITH_SERIES_DATA,
} = require('../constants');

async function getSeriesFromCat() {
  const writeDebug = writeLog.setDebug('g');

  const catalog = process.argv.length >= 4 && process.argv[3];
  if (!catalog) {
    writeLog.error('Error: No catalog provided');
    await exitProcess();
  }
  const bookDataFile = findFileByName(catalog, FOLDER_WITH_BOOK_DATA);
  writeLog.log('--------------------');
  writeLog.log('--------------------');

  const seriesLinksFiles = await extractSeriesLinks([bookDataFile]);
  writeDebug('--------------------');
  writeDebug(`seriesLinksFiles: ${JSON.stringify(seriesLinksFiles, null, 2)}`);
  writeLog.log('--------------------');
  writeLog.log('--------------------');

  if (Array.isArray(seriesLinksFiles) && seriesLinksFiles.length === 1) {
    await getBooks(seriesLinksFiles, FOLDER_WITH_SERIES_LINKS);
  } else {
    writeLog.alert('No series links');
  }

  try {
    if (fs.existsSync(TEMP_FOLDER)) {
      rimraf.sync(TEMP_FOLDER);
    }
  } catch (error) {
    writeLog.alert('An error occurred while deleting the temporary folder:', TEMP_FOLDER);
    writeLog.error(error);
  }
}

async function getSeriesFromAll() {
  const writeDebug = writeLog.setDebug('g');

  const bookDataFiles = [];
  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_DATA);
  folderFiles.forEach((file) => {
    if (file.includes('.json')) {
      bookDataFiles.push(path.join(FOLDER_WITH_BOOK_DATA, file));
    }
  });

  const seriesLinksFiles = await extractSeriesLinks(bookDataFiles);
  writeDebug('--------------------');
  writeDebug(`seriesLinksFiles: ${JSON.stringify(seriesLinksFiles, null, 2)}`);
  writeLog.log('--------------------');
  writeLog.log('--------------------');

  if (Array.isArray(seriesLinksFiles) && seriesLinksFiles.length > 0) {
    await getBooks(seriesLinksFiles, FOLDER_WITH_SERIES_LINKS);
  } else {
    writeLog.alert('No series links');
  }

  try {
    if (fs.existsSync(TEMP_FOLDER)) {
      rimraf.sync(TEMP_FOLDER);
    }
  } catch (error) {
    writeLog.alert('An error occurred while deleting the temporary folder:', TEMP_FOLDER);
    writeLog.error(error);
  }
}

async function getSeriesFromErrors() {
  const writeDebug = writeLog.setDebug('g');

  const catalogsWithError = importExcelFile(FILE_WITH_GET_ERRORS).data;

  const bookDataFiles = [];
  catalogsWithError.forEach((catalogObj) => {
    const bookDataFile = catalogObj.catalog.replace('.xlsx', '.json');
    const file = findFileByName(
      bookDataFile,
      FOLDER_WITH_BOOK_DATA,
      { displayLogs: false },
    );
    bookDataFiles.push(file);
  });
  writeDebug('--------------------');
  writeDebug(`bookDataFiles: ${JSON.stringify(bookDataFiles, null, 2)}`);
  writeLog.log('--------------------');
  writeLog.log('--------------------');

  const seriesLinksFiles = await extractSeriesLinks(bookDataFiles);
  writeDebug('--------------------');
  writeDebug(`seriesLinksFiles: ${JSON.stringify(seriesLinksFiles, null, 2)}`);
  writeLog.log('--------------------');
  writeLog.log('--------------------');

  if (Array.isArray(seriesLinksFiles) && seriesLinksFiles.length > 0) {
    await getBooks(seriesLinksFiles, FOLDER_WITH_SERIES_LINKS);
  } else {
    writeLog.alert('No series links');
  }

  try {
    if (fs.existsSync(TEMP_FOLDER)) {
      rimraf.sync(TEMP_FOLDER);
    }
  } catch (error) {
    writeLog.alert('An error occurred while deleting the temporary folder:', TEMP_FOLDER);
    writeLog.error(error);
  }
}

async function scrapeSeriesFromCat() {
  const catalog = process.argv.length >= 4 && process.argv[3];
  if (!catalog) {
    writeLog.error('Error: No catalog provided');
    await exitProcess();
  }
  const fileWithBookLinks = findFileByName(catalog, FOLDER_WITH_SERIES_LINKS);
  writeLog.log('--------------------');

  await scrapeBooks([fileWithBookLinks], FOLDER_WITH_SERIES_DATA, false);
}

async function scrapeSeriesFromAll() {
  const filesWithBookLinks = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_SERIES_LINKS);
  folderFiles.forEach((file) => {
    if (file.includes('.xlsx')) {
      filesWithBookLinks.push(path.join(FOLDER_WITH_SERIES_LINKS, file));
    }
  });

  if (Array.isArray(filesWithBookLinks) && filesWithBookLinks.length > 0) {
    await scrapeBooks(filesWithBookLinks, FOLDER_WITH_SERIES_DATA, false);
  } else {
    writeLog.alert(`No files with book links in the folder ${FOLDER_WITH_SERIES_LINKS}`);
  }
}

async function scrapeSeriesData() {
  const filesWithBookLinks = [];

  const folderFiles = fs.readdirSync(FOLDER_WITH_SERIES_DATA);
  folderFiles.forEach((file) => {
    if (file.includes('.json') && !file.includes('WIP')) {
      filesWithBookLinks.push(path.join(FOLDER_WITH_SERIES_DATA, file));
    }
  });

  if (Array.isArray(filesWithBookLinks) && filesWithBookLinks.length > 0) {
    await scrapeBooks(filesWithBookLinks, FOLDER_WITH_SERIES_DATA, false);
  } else {
    writeLog.alert(`No JSON files in the folder ${FOLDER_WITH_SERIES_DATA}`);
  }
}

module.exports = {
  getSeriesFromCat,
  getSeriesFromAll,
  getSeriesFromErrors,
  scrapeSeriesFromCat,
  scrapeSeriesFromAll,
  scrapeSeriesData,
};
