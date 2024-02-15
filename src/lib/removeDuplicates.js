const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {
  showFormattedTime,
  showElapsedTime,
  importExcelFile,
  exportExcelFile,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const createFolder = require('../func/createFolder');
const { FOLDER_WITH_BOOK_LINKS } = require('../constants');

async function removeDuplicates() {
  const exportFolder = `${FOLDER_WITH_BOOK_LINKS}--cleaned`;

  // Start
  writeLog.step('Start removeDuplicates()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folder
  writeLog.step('Delete the export folder');
  rimraf.sync(exportFolder);
  await createFolder(exportFolder);
  writeLog.log('--------------------');

  // Clean each file
  writeLog.step('Remove duplicate books in each file');

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

    exportExcelFile(dataCleaned, path.join(exportFolder, file), { displayLogs: false });
  });
  writeLog.log('--------------------');

  // End
  showElapsedTime(startTime);
  writeLog.error('Total of books removed:', totalBooksRemoved);
  writeLog.info('Folder with cleaned books:', exportFolder);
  writeLog.success('Cleaning finished!');
  await happyStickFigure();
}

module.exports = removeDuplicates;
