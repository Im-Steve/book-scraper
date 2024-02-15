const fs = require('fs');
const path = require('path');
const {
  showFormattedTime,
  showElapsedTime,
  importJsonFile,
  exportExcelFile,
  exportJsonFile,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const createFolder = require('../func/createFolder');
const {
  FOLDER_WITH_BOOK_DATA,
  FOLDER_WITH_CATEGORIES,
  FILE_WITH_CATEGORIES,
} = require('../constants');

async function getCategories() {
  // Start
  writeLog.step('Start getCategories()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folder
  await createFolder(FOLDER_WITH_CATEGORIES);
  writeLog.log('--------------------');

  // List the book files
  writeLog.step('List the book files');
  const bookFiles = [];
  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_DATA);

  folderFiles.forEach((file) => {
    if (file.includes('.json')) {
      bookFiles.push(file);
    }
  });

  if (bookFiles.length > 0) {
    writeLog.success('Files listed successfully');
  } else {
    writeLog.error('No existing files');
    writeLog.error('process.exit();');
    process.exit();
  }
  writeLog.log('--------------------');

  // Get categories
  writeLog.log('--------------------');
  writeLog.step('Get the categories of each file');
  writeLog.log('--------------------');

  const existingCategories = {};

  bookFiles.forEach((file) => {
    const books = importJsonFile(path.join(FOLDER_WITH_BOOK_DATA, file)).data;

    const mainCategory = file.replace('.json', '');
    existingCategories[mainCategory] = existingCategories[mainCategory] || {};

    books.forEach((book) => {
      if (book.subcategories && book.subcategories.length > 0) {
        book.subcategories.forEach((subcategory) => {
          existingCategories[mainCategory][subcategory] = subcategory;
        });
      }
    });
    writeLog.info('categories listed');
    writeLog.log('--------------------');
  });

  writeLog.log('sort the categories...');
  const sortedCategories = [];
  Object.keys(existingCategories).forEach((mainCategory) => {
    const catObject = { mainCategory, subcategories: [] };

    Object.keys(existingCategories[mainCategory]).forEach((subcategory) => {
      catObject.subcategories.push(subcategory);
    });

    sortedCategories.push(catObject);
  });
  writeLog.log('--------------------');

  // Convert for Excel
  const categoriesToExcel = [];
  sortedCategories.forEach((catObject) => {
    const data = {};
    Object.keys(catObject).forEach((key) => {
      const value = catObject[key];
      data[key] = value ? JSON.stringify(value, null, 2) : '';
    });
    categoriesToExcel.push(data);
  });

  exportJsonFile(sortedCategories, path.join(FOLDER_WITH_CATEGORIES, FILE_WITH_CATEGORIES));
  exportExcelFile(categoriesToExcel, path.join(FOLDER_WITH_CATEGORIES, FILE_WITH_CATEGORIES));
  writeLog.log('--------------------');

  writeLog.log('--------------------');
  // End
  showElapsedTime(startTime);
  writeLog.success('The categories have been obtained!');
  await happyStickFigure();
}

module.exports = getCategories;
