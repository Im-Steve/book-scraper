const path = require('path');
const {
  importJsonFile,
  exportJsonFile,
  exitProcess,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const {
  FOLDER_WITH_BOOK_DATA_PUBLIC,
  FOLDER_WITH_BOOK_DATA_PUBLIC_WP,
} = require('../constants');

const fileWithSelfpromotionBooks = 'fr_livres-en-autopromotion.json';
const fileWithWattpadBooks = 'fr_en-autopromotion.json';

async function mixSelfpromotions() {
  // Start
  writeLog.step('Start mixSelfpromotions()');
  writeLog.log('---');

  // Import files
  let selfpromotionBooks = importJsonFile(
    path.join(FOLDER_WITH_BOOK_DATA_PUBLIC, fileWithSelfpromotionBooks),
  ).data;
  writeLog.log('---');
  const wattpadBooks = importJsonFile(
    path.join(FOLDER_WITH_BOOK_DATA_PUBLIC_WP, fileWithWattpadBooks),
  ).data;
  writeLog.log('---');

  // Combine
  writeLog.step('Add Wattpad books to self-promotions');
  if (Array.isArray(selfpromotionBooks) && Array.isArray(wattpadBooks)) {
    selfpromotionBooks = selfpromotionBooks.concat(wattpadBooks);
  } else {
    writeLog.alert('Error: Incorrect data format');
    writeLog.error(`typeof selfpromotionBooks: ${typeof selfpromotionBooks}`);
    writeLog.error(`typeof wattpadBooks: ${typeof wattpadBooks}`);
    await exitProcess();
  }

  // Remove duplicate books
  writeLog.step('Remove duplicate books');
  const seen = new Set();
  const uniqueBooks = selfpromotionBooks.filter((book) => {
    const { id } = book;
    if (id && !seen.has(id)) {
      seen.add(id);
      return true;
    }
    return false;
  });
  writeLog.log('---');

  // Export the file
  exportJsonFile(
    uniqueBooks,
    path.join(FOLDER_WITH_BOOK_DATA_PUBLIC, fileWithSelfpromotionBooks),
  );
  writeLog.log('---');

  // End
  writeLog.success('Adding finished!');
  await happyStickFigure();
}

module.exports = mixSelfpromotions;
