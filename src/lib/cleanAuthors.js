const fs = require('fs');
const path = require('path');
const {
  showFormattedTime,
  showElapsedTime,
  importMultipleJson,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const {
  FOLDER_WITH_BOOK_DATA,
  FOLDER_WITH_AUTHOR_IMAGES,
  FOLDER_WITH_AUTHOR_IMAGES_AI,
  FOLDER_WITH_AUTHOR_IMAGES_JR,
  FOLDER_WITH_AUTHOR_IMAGES_SZ,
} = require('../constants');

async function cleanAuthors() {
  // Start
  writeLog.step('Start cleanAuthors()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // List existing books
  writeLog.step('List existing books');
  const existingBooks = new Set();

  const { data } = importMultipleJson(FOLDER_WITH_BOOK_DATA, { displayLogs: false });

  data.forEach((book) => {
    existingBooks.add(book.authorImg);
  });

  if (existingBooks.size !== 0) {
    writeLog.success('Existing books imported successfully');
  } else {
    writeLog.error('No existing books');
    writeLog.error('process.exit();');
    process.exit();
  }
  writeLog.log('--------------------');

  // Clean author images
  writeLog.step('Remove author images that are no longer used');
  writeLog.log('cleaning...');

  let totalImagesRemoved = 0;

  const authorFolders = [
    FOLDER_WITH_AUTHOR_IMAGES,
    FOLDER_WITH_AUTHOR_IMAGES_AI,
    FOLDER_WITH_AUTHOR_IMAGES_JR,
    FOLDER_WITH_AUTHOR_IMAGES_SZ,
  ];
  for (const folder of authorFolders) {
    if (fs.existsSync(folder)) {
      writeLog.info('folder:', folder);
      const folderImages = fs.readdirSync(folder);

      for (const image of folderImages) {
        if (image !== '.git') {
          const imagePath = path.join(folder, image);

          if (!existingBooks.has(imagePath)) {
            writeLog.alert('image removed:', imagePath);
            totalImagesRemoved += 1;
            await fs.promises.unlink(imagePath);
          }
        }
      }
    }
  }
  writeLog.log('--------------------');

  // End
  showElapsedTime(startTime);
  writeLog.error('Total of images removed:', totalImagesRemoved);
  writeLog.success('Cleaning finished!');
  await happyStickFigure();
}

module.exports = cleanAuthors;
