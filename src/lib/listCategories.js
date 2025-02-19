const fs = require('fs');
const path = require('path');
const {
  showFormattedTime,
  showElapsedTime,
  importJsonFile,
  exportExcelFile,
  exportJsonFile,
  createFolder,
  exitProcess,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { FOLDER_WITH_BOOK_DATA_PUBLIC } = require('../constants');

const FOLDER_WITH_CATEGORIES = 'categories';
const FILE_WITH_CATEGORIES = 'categories';

async function listCategories() {
  // Start
  writeLog.step('Start listCategories()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folder
  await createFolder(FOLDER_WITH_CATEGORIES);
  writeLog.log('--------------------');

  // Get the book files
  writeLog.step('Get the book files');
  const bookFiles = [];

  if (!fs.existsSync(FOLDER_WITH_BOOK_DATA_PUBLIC)) {
    writeLog.alert('No existing folder:', FOLDER_WITH_BOOK_DATA_PUBLIC);
    await exitProcess();
  }

  const folderFiles = fs.readdirSync(FOLDER_WITH_BOOK_DATA_PUBLIC);
  folderFiles.forEach((file) => {
    if (file.includes('.json')) {
      bookFiles.push(file);
    }
  });

  if (bookFiles.length > 0) {
    writeLog.success('Files obtained successfully');
  } else {
    writeLog.alert('No existing files in:', FOLDER_WITH_BOOK_DATA_PUBLIC);
    await exitProcess();
  }
  writeLog.log('--------------------');

  // List categories
  writeLog.log('--------------------');
  writeLog.step('List the categories of each book file');
  writeLog.log('--------------------');

  const existingCategories = {};

  bookFiles.forEach((file) => {
    const books = importJsonFile(path.join(FOLDER_WITH_BOOK_DATA_PUBLIC, file)).data;

    const mainCategory = file.replace('.json', '');
    existingCategories[mainCategory] = existingCategories[mainCategory] || {};

    books.forEach((book) => {
      if (Array.isArray(book.subcategories) && book.subcategories.length > 0) {
        book.subcategories.forEach((subcategory) => {
          existingCategories[mainCategory][subcategory] = subcategory;
        });
      }
    });
    writeLog.info('categories obtained');
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
    data.mainCategory = catObject.mainCategory;
    data.subcategories = JSON.stringify(catObject.subcategories, null, 2);
    categoriesToExcel.push(data);
  });

  exportJsonFile(sortedCategories, path.join(FOLDER_WITH_CATEGORIES, FILE_WITH_CATEGORIES));
  exportExcelFile(categoriesToExcel, path.join(FOLDER_WITH_CATEGORIES, FILE_WITH_CATEGORIES));
  writeLog.log('--------------------');
  writeLog.log('--------------------');

  // End
  showElapsedTime(startTime);
  writeLog.success('The categories have been listed!');
  await happyStickFigure();
}

module.exports = listCategories;
