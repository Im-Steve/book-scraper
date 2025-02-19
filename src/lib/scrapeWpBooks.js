const fs = require('fs');
const path = require('path');
const { wp } = require('my-scrapers');
const {
  showFormattedTime,
  showElapsedTime,
  importExcelFile,
  exportExcelFile,
  importJsonFile,
  exportJsonFile,
  launchBrowser,
  createFolder,
  exitProcess,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { timeoutOff } = require('../../config.json');
const { FOLDER_WITH_BOOK_DATA_WP, FOLDER_WITH_BOOK_DATA_PUBLIC_WP } = require('../constants');

const tempFilePrefix1 = '01WIP-';
const tempFilePrefix2 = '02WIP-';

async function scrapeWpBooks(filesWithBookLinks) {
  const writeDebug = writeLog.setDebug('g');

  // Start
  writeLog.step('Start scrapeWpBooks()');
  writeDebug(`filesWithBookLinks: ${JSON.stringify(filesWithBookLinks, null, 2)}`);

  // Set options
  let loadExistingBooks = true;
  let deleteData = false;

  const scrapingOptions = {
    useSavedPage: false,
    timeoutOff,
  };

  process.argv.forEach((processArg) => {
    if (processArg === 'not-load' || processArg === '--not-load') {
      loadExistingBooks = false;
    } else if (processArg.includes('delete')) {
      deleteData = true;
    } else if (processArg === 'use-saved-page' || processArg === '--use-saved-page') {
      scrapingOptions.useSavedPage = true;
    }
  });

  const {
    useSavedPage,
  } = scrapingOptions;

  writeDebug(`loadExistingBooks: ${loadExistingBooks}`);
  writeDebug(`deleteData: ${deleteData}`);
  writeDebug(`scrapingOptions: ${JSON.stringify(scrapingOptions, null, 2)}`);

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folders
  await createFolder(FOLDER_WITH_BOOK_DATA_WP);
  await createFolder(FOLDER_WITH_BOOK_DATA_PUBLIC_WP);
  writeLog.log('--------------------');

  // Launch the browser
  const browser = await launchBrowser();
  writeLog.log('--------------------');

  // Scrape each file with book links
  writeLog.log('--------------------');
  writeLog.step('Scrape each file with book links');
  writeLog.log('--------------------');

  let nbBooksWithError = 0;

  // For each file
  for (const linkFile of filesWithBookLinks) {
    const fileStartTime = new Date();
    showFormattedTime(fileStartTime);
    writeLog.info('file with book links:', linkFile);

    let bookLinks = [];
    if (linkFile.includes('.xlsx')) {
      bookLinks = importExcelFile(linkFile).data;
    } else if (linkFile.includes('.json')) {
      bookLinks = importJsonFile(linkFile).data;
    }
    writeLog.log('--------------------');

    const jsonToExportName = path.basename(linkFile).replace('.xlsx', '.json');
    const jsonToExportPath = path.join(FOLDER_WITH_BOOK_DATA_WP, jsonToExportName);
    const tempFilePath1 = path.join(FOLDER_WITH_BOOK_DATA_WP, `${tempFilePrefix1}${jsonToExportName}`);
    const tempFilePath2 = path.join(FOLDER_WITH_BOOK_DATA_WP, `${tempFilePrefix2}${jsonToExportName}`);

    // Load existing books
    const existingBooks = {};

    if (loadExistingBooks) {
      writeLog.step('Load existing books');
      try {
        let books = [];
        if (fs.existsSync(jsonToExportPath)) {
          books = importJsonFile(jsonToExportPath).data;
        }

        let tempBooks = [];
        if (fs.existsSync(tempFilePath2)) {
          tempBooks = importJsonFile(tempFilePath2).data;
        }

        const mergedBooks = books.concat(tempBooks);

        mergedBooks.forEach((book) => {
          existingBooks[book.link] = book;
        });

        if (Object.keys(existingBooks).length !== 0) {
          writeLog.success('Existing books imported successfully');
        } else {
          writeLog.log('no existing books');
        }
      } catch (error) {
        writeLog.alert('An error occurred while loading existing books');
        writeLog.error(error);
        await exitProcess();
      }
      writeLog.log('--------------------');
    }

    // For each book link in the file
    const allDataFromThisFile = [];
    const allDataToExcel = [];
    let toSaveInTempFile = true;

    for (let bookIndex = 0; bookIndex < bookLinks.length; bookIndex += 1) {
      let initialData = {
        link: bookLinks[bookIndex].link,
        catalog: bookLinks[bookIndex].catalog,
        subcategory: bookLinks[bookIndex].subcategory,
        language: bookLinks[bookIndex].language,
        dateAdded: bookLinks[bookIndex].dateAdded,
      };
      writeLog.step('link:', initialData.link);

      let hasError = '';

      // Set data
      if (existingBooks && existingBooks[initialData.link]) {
        writeLog.info('The book already exists');
        initialData = {
          ...existingBooks[initialData.link],
          ...initialData,
        };
        toSaveInTempFile = false;
      }

      let {
        dataFromWp = {},
      } = initialData;

      // Go to scrape
      if ((!dataFromWp.searched
        || dataFromWp.error
        || useSavedPage)
        && !deleteData) {
        const pageWpBook = await browser.newPage();
        const pageWpAuthor = await browser.newPage();
        dataFromWp = await wp
          .scrapeItem(pageWpBook, pageWpAuthor, initialData.link, dataFromWp, scrapingOptions)
          || {};
        hasError = dataFromWp.error || hasError;
        await pageWpBook.close();
        await pageWpAuthor.close();
        toSaveInTempFile = true;
      }
      if (deleteData) {
        writeLog.step('Delete wp');
        dataFromWp = {
          link: initialData.link,
          catalog: initialData.catalog,
          subcategory: initialData.subcategory,
          language: initialData.language,
        };
        writeDebug(`dataFromWp: ${JSON.stringify(dataFromWp, null, 2)}`);
      }

      const sellers = [{
        title: 'Wattpad',
        link: initialData.link,
      }];

      if (hasError) {
        nbBooksWithError += 1;
      }

      writeLog.dev('merge data...');
      const mergedData = {
        link: initialData.link,
        id: dataFromWp.id,
        isWattpadBook: true,
        title: dataFromWp.title,
        authors: dataFromWp.author ? [dataFromWp.author] : [],
        authorsWithLink: dataFromWp.authorWithLink ? [dataFromWp.authorWithLink] : [],
        cover: dataFromWp.image,
        description: dataFromWp.description,
        mainCategories: initialData.catalog ? [initialData.catalog] : [],
        subcategories: initialData.subcategory ? [initialData.subcategory] : [],
        catalog: initialData.catalog,
        subcategory: initialData.subcategory,
        language: initialData.language,
        targetAudience: dataFromWp.targetAudience,
        authorBio: dataFromWp.authorBio,
        authorImg: dataFromWp.authorImg,
        dateAdded: initialData.dateAdded || '',
        sellers,
        dataFromWp: { ...dataFromWp, pageContent: '' },
        hasError,
      };
      const debugMergedData = { ...mergedData };
      delete debugMergedData.dataFromWp;
      writeDebug(`debugMergedData: ${JSON.stringify(debugMergedData, null, 2)}`);
      writeDebug('--------------------');

      const dataToExcel = {};
      Object.keys(mergedData).forEach((key) => {
        const value = mergedData[key];
        dataToExcel[key] = value ? JSON.stringify(value, null, 2) : '';
      });
      dataToExcel.link = mergedData.link;

      if (useSavedPage) {
        mergedData.dataFromWp = dataFromWp;
      }

      allDataFromThisFile.push(mergedData);
      allDataToExcel.push(dataToExcel);
      existingBooks[initialData.link] = mergedData;

      // Save data to temporary files
      writeDebug(`toSaveInTempFile: ${JSON.stringify(toSaveInTempFile, null, 2)}`);
      if (toSaveInTempFile) {
        exportJsonFile(allDataFromThisFile, tempFilePath1, { displayLogs: false });
        exportJsonFile(allDataFromThisFile, tempFilePath2, { displayLogs: false });
        writeLog.success('Data saved in temporary files');
      }

      showElapsedTime(fileStartTime, 'this file');
      writeLog.log(bookIndex + 1, '/', bookLinks.length, 'processed links for', path.basename(linkFile));
      writeLog.log('--------------------');
    }

    writeLog.info('Save the final files');
    exportJsonFile(allDataFromThisFile, jsonToExportPath);
    exportExcelFile(
      allDataToExcel,
      path.join(FOLDER_WITH_BOOK_DATA_WP, path.basename(linkFile.replace('.json', '.xlsx'))),
    );

    writeLog.log('clean data for the public JSON...');
    const dataToPublic = [];
    allDataFromThisFile.forEach((book) => {
      const publicBook = { ...book };
      delete publicBook.link;
      delete publicBook.catalog;
      delete publicBook.subcategory;
      delete publicBook.dataFromWp;
      delete publicBook.hasError;
      if (Object.keys(publicBook).length > 0) {
        dataToPublic.push(publicBook);
      }
    });
    exportJsonFile(
      dataToPublic,
      path.join(FOLDER_WITH_BOOK_DATA_PUBLIC_WP, jsonToExportName),
    );

    writeLog.log('delete temporary files...');
    try {
      if (fs.existsSync(tempFilePath1)) {
        await fs.promises.unlink(tempFilePath1);
      }
      if (fs.existsSync(tempFilePath2)) {
        await fs.promises.unlink(tempFilePath2);
      }
    } catch (error) {
      writeLog.alert('An error occurred while deleting a temporary file');
      writeLog.error(error);
    }

    writeLog.log('--------------------');
    writeLog.success('File with book links completed:', linkFile);
    showElapsedTime(fileStartTime, 'this file');
    writeLog.log('--------------------');
  }
  writeLog.log('--------------------');

  // End
  if (browser) {
    await browser.close();
  }
  showElapsedTime(startTime);
  writeLog.info('Folder with book data:', FOLDER_WITH_BOOK_DATA_WP);
  writeLog.info('Folder with public data:', FOLDER_WITH_BOOK_DATA_PUBLIC_WP);
  if (nbBooksWithError > 0) {
    writeLog.error('Number of books with error:', nbBooksWithError);
  }
  writeLog.success('Scraping finished!');
  await happyStickFigure();
}

module.exports = scrapeWpBooks;
