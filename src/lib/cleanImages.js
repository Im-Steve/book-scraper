const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {
  showFormattedTime,
  showElapsedTime,
  importMultipleJson,
  exitProcess,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { FOLDER_WITH_BOOK_DATA_PUBLIC } = require('../constants');

async function cleanImages(folderWithImages, imageKey) {
  // Start
  writeLog.step('Start cleanImages()');
  writeLog.info('folder:', folderWithImages);
  writeLog.info('key:', imageKey);

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // List existing images in book data
  writeLog.step('List existing books');
  const existingImages = new Set();

  const { data } = importMultipleJson(FOLDER_WITH_BOOK_DATA_PUBLIC, { displayLogs: false });

  data.forEach((book) => {
    existingImages.add(book[imageKey]);
  });

  if (existingImages.size !== 0) {
    writeLog.success('Existing books imported successfully');
  } else {
    writeLog.alert('No existing books with images');
    await exitProcess();
  }
  writeLog.log('--------------------');

  // Clean images
  writeLog.step('Remove images that are no longer used');
  writeLog.log('cleaning...');

  const imageFiles = fs.readdirSync(folderWithImages);
  if (imageFiles.length === 0) {
    writeLog.alert('No images');
  }

  let totalImagesRemoved = 0;

  for (const image of imageFiles) {
    if (image !== '.git') {
      const imagePath = path.join(folderWithImages, image);

      if (!existingImages.has(imagePath) && !existingImages.has(image)) {
        const stats = fs.statSync(imagePath);

        if (stats.isDirectory()) {
          rimraf.sync(imagePath);
        } else {
          await fs.promises.unlink(imagePath);
        }

        writeLog.alert('image/folder removed:', imagePath);
        totalImagesRemoved += 1;
      }
    }
  }
  writeLog.log('--------------------');

  // End
  showElapsedTime(startTime);
  writeLog.error('Total of images/folders removed:', totalImagesRemoved);
  writeLog.success('Cleaning finished!');
  await happyStickFigure();
}

module.exports = cleanImages;
