const fs = require('fs');
const path = require('path');
const {
  createFolder,
  importJsonFile,
  exportJsonFile,
  exportExcelFile,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { formatBookToExcel, formatBookToPublic } = require('./formatBook');

const {
  FOLDER_WITH_BOOK_DATA,
  FOLDER_WITH_BOOK_DATA_PUBLIC,
  FOLDER_WITH_SERIES_DATA,
} = require('../constants');

async function addSeries() {
  // Start
  writeLog.step('Start addSeries()');
  writeLog.log('--------------------');

  // Create an export folder
  await createFolder(FOLDER_WITH_BOOK_DATA_PUBLIC);
  writeLog.log('--------------------');

  // Add series books in each data file
  writeLog.log('--------------------');
  writeLog.step('Add series books in data files');
  writeLog.log('--------------------');

  const seriesBooksFiles = [];
  const allSeriesBooksFiles = fs.readdirSync(FOLDER_WITH_SERIES_DATA);
  allSeriesBooksFiles.forEach((file) => {
    if (file.includes('.json')) {
      seriesBooksFiles.push(path.join(FOLDER_WITH_SERIES_DATA, file));
    }
  });
  if (seriesBooksFiles.length === 0) {
    writeLog.alert('No series books files');
    writeLog.log('--------------------');
  }

  let fileIndex = 0;

  // For each series books file
  for (const seriesBooksFile of seriesBooksFiles) {
    writeLog.info('file with series books:', seriesBooksFile);
    const seriesBooks = importJsonFile(seriesBooksFile).data;

    const bookDataFile = path.join(FOLDER_WITH_BOOK_DATA, path.basename(seriesBooksFile));
    writeLog.info('file with book data:', bookDataFile);
    const bookData = importJsonFile(bookDataFile).data;
    writeLog.log('---');

    writeLog.info('Add series');
    const bookDataWithSeries = bookData.concat(seriesBooks);

    writeLog.info('Remove duplicate books');
    const seen = new Set();
    const uniqueBooks = bookDataWithSeries.filter((book) => {
      const { link } = book;
      if (!seen.has(link)) {
        seen.add(link);
        return true;
      }
      return false;
    });
    writeLog.log('---');

    // to json file
    writeLog.info('Export the JSON file');
    exportJsonFile(uniqueBooks, bookDataFile);

    // to excel file
    writeLog.info('Export the Excel file');
    const dataToExcel = [];
    uniqueBooks.forEach((book) => {
      const bookToExcel = formatBookToExcel(book);
      dataToExcel.push(bookToExcel);
    });
    exportExcelFile(
      dataToExcel,
      path.join(bookDataFile.replace('.json', '')),
    );

    // to public file
    writeLog.info('Export the public file');
    const dataToPublic = [];
    uniqueBooks.forEach((book) => {
      const publicBook = formatBookToPublic(book);
      if (Object.keys(publicBook).length > 0) {
        dataToPublic.push(publicBook);
      }
    });
    exportJsonFile(
      dataToPublic,
      path.join(FOLDER_WITH_BOOK_DATA_PUBLIC, path.basename(bookDataFile)),
    );

    fileIndex += 1;
    writeLog.log(fileIndex, '/', seriesBooksFiles.length, 'processed files');
    writeLog.log('--------------------');
  }
  writeLog.log('--------------------');

  // End
  writeLog.success('Adding finished!');
  await happyStickFigure();
}

module.exports = addSeries;
