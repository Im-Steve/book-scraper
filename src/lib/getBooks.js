const path = require('path');
const { ll } = require('my-scrapers');
const {
  showFormattedTime,
  showElapsedTime,
  importMultipleExcel,
  exportExcelFile,
  launchBrowser,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const createFolder = require('../func/createFolder');
const { FILE_WITH_GET_ERRORS, FOLDER_WITH_BOOK_LINKS } = require('../constants');
const { formatPath } = require('../func/formatData');

async function getBooks(catalogLinkFiles) {
  // Start
  writeLog.step('Start getBooks()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Import the catalog link files
  const catalogLinks = importMultipleExcel(catalogLinkFiles).data;
  writeLog.log('--------------------');

  // Create the export folder
  await createFolder(FOLDER_WITH_BOOK_LINKS);
  writeLog.log('--------------------');

  // Scrape each catalog
  writeLog.log('--------------------');
  writeLog.step('Scrape each catalog link');
  writeLog.log('--------------------');

  const catalogsWithError = [];

  for (let linkIndex = 0; linkIndex < catalogLinks.length; linkIndex += 1) {
    const catalogStartTime = new Date();
    showFormattedTime(catalogStartTime);

    const { catalog, link } = catalogLinks[linkIndex];
    const formattedCatalog = formatPath(catalog);

    writeLog.info('catalog:', catalog);

    const { browser, page } = await launchBrowser();
    await page.close();
    const { bookLinks, error } = await ll.getBooksFromCatalog(browser, link, formattedCatalog);
    if (browser) {
      await browser.close();
    }

    if (!error) {
      exportExcelFile(
        bookLinks,
        path.join(FOLDER_WITH_BOOK_LINKS, `${formattedCatalog}.xlsx`),
      );
    } else {
      catalogsWithError.push(catalogLinks[linkIndex]);
      writeLog.error('Export the catalog link with the error');
      exportExcelFile(catalogsWithError, FILE_WITH_GET_ERRORS);
    }

    showElapsedTime(catalogStartTime, 'this catalog');
    writeLog.log(linkIndex + 1, '/', catalogLinks.length, 'processed catalogs');
    writeLog.log('--------------------');
  }

  // End
  writeLog.log('--------------------');
  showElapsedTime(startTime);
  writeLog.info('Folder with book links:', FOLDER_WITH_BOOK_LINKS);
  writeLog.success('Scraping finished!');
  await happyStickFigure();
}

module.exports = getBooks;
