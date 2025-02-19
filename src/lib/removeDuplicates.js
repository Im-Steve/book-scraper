const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {
  showFormattedTime,
  showElapsedTime,
  importExcelFile,
  exportExcelFile,
  createFolder,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { FOLDER_WITH_BOOK_LINKS, FOLDER_WITH_BOOK_LINKS_CLEANED } = require('../constants');

async function removeDuplicates() {
  // Start
  writeLog.step('Start removeDuplicates()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folder
  if (fs.existsSync(FOLDER_WITH_BOOK_LINKS_CLEANED)) {
    writeLog.step('Delete the export folder');
    rimraf.sync(FOLDER_WITH_BOOK_LINKS_CLEANED);
  }
  await createFolder(FOLDER_WITH_BOOK_LINKS_CLEANED);
  writeLog.log('--------------------');

  // Clean each file
  writeLog.step('Remove duplicate book links in each file');

  let totalBooksRemoved = 0;

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_LINKS);
  const filesToClean = folderFiles.filter((fileName) => fileName.endsWith('.xlsx'));

  filesToClean.forEach((file) => {
    const filePath = path.join(FOLDER_WITH_BOOK_LINKS, file);
    writeLog.info('file:', file);
    const { data } = importExcelFile(filePath, { displayLogs: false });

    const seen = new Set();
    const dataCleaned = data.filter((book) => {
      const { link } = book;
      if (!seen.has(link)) {
        seen.add(link);
        return true;
      }
      return false;
    });

    const nbBooksRemoved = data.length - dataCleaned.length;
    totalBooksRemoved += nbBooksRemoved;
    if (nbBooksRemoved > 0) {
      writeLog.error(`Number of books removed for ${file}:`, nbBooksRemoved);
    }

    exportExcelFile(
      dataCleaned,
      path.join(FOLDER_WITH_BOOK_LINKS_CLEANED, file),
      { displayLogs: false },
    );
  });
  writeLog.log('--------------------');

  // End
  showElapsedTime(startTime);
  writeLog.error('Total of books removed:', totalBooksRemoved);
  writeLog.info('Folder with cleaned book links:', FOLDER_WITH_BOOK_LINKS_CLEANED);
  writeLog.success('Cleaning finished!');
  await happyStickFigure();
}

module.exports = removeDuplicates;
