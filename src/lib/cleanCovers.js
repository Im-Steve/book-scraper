const fs = require('fs');
const path = require('path');
const {
  showFormattedTime,
  showElapsedTime,
  importMultipleJson,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { FOLDER_WITH_BOOK_DATA, FOLDER_WITH_BOOK_COVERS } = require('../constants');

async function cleanCovers() {
  // Start
  writeLog.step('Start cleanCovers()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // List existing books
  writeLog.step('List existing books');
  const existingBooks = new Set();

  const { data } = importMultipleJson(FOLDER_WITH_BOOK_DATA, { displayLogs: false });

  data.forEach((book) => {
    existingBooks.add(book.cover);
  });

  if (existingBooks.size !== 0) {
    writeLog.success('Existing books imported successfully');
  } else {
    writeLog.error('No existing books');
    writeLog.error('process.exit();');
    process.exit();
  }
  writeLog.log('--------------------');

  // Clean covers
  writeLog.step('Remove covers that are no longer used');

  let totalCoversRemoved = 0;

  const coverFolders = fs.readdirSync(FOLDER_WITH_BOOK_COVERS);

  for (const folder of coverFolders) {
    const folderPath = path.join(FOLDER_WITH_BOOK_COVERS, folder);
    writeLog.info('folder:', folder);

    const coverFiles = fs.readdirSync(folderPath);

    for (const cover of coverFiles) {
      if (cover !== '.git') {
        const coverPath = path.join(FOLDER_WITH_BOOK_COVERS, folder, cover);

        if (!existingBooks.has(coverPath)) {
          writeLog.alert('cover removed:', coverPath);
          totalCoversRemoved += 1;
          await fs.promises.unlink(coverPath);
        }
      }
    }
  }
  writeLog.log('--------------------');

  // End
  showElapsedTime(startTime);
  writeLog.error('Total of covers removed:', totalCoversRemoved);
  writeLog.success('Cleaning finished!');
  await happyStickFigure();
}

module.exports = cleanCovers;
