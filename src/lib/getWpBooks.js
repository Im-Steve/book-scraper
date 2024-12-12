const path = require('path');
const { wp } = require('my-scrapers');
const {
  showFormattedTime,
  showElapsedTime,
  importExcelFile,
  exportExcelFile,
  launchBrowser,
  createFolder,
  formatFileName,
  normalizeText,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { FILE_WITH_GET_ERRORS_WP, FOLDER_WITH_BOOK_LINKS_WP } = require('../constants');

async function getWpBooks(fileWithCatalogLinks) {
  const writeDebug = writeLog.setDebug('g');

  // Start
  writeLog.step('Start getWpBooks()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Import the file with catalog links
  const catalogLinks = importExcelFile(fileWithCatalogLinks).data;
  writeLog.log('--------------------');

  // Create the export folder
  await createFolder(FOLDER_WITH_BOOK_LINKS_WP);
  writeLog.log('--------------------');

  // Scrape each catalog link
  writeLog.log('--------------------');
  writeLog.step('Scrape each catalog link');
  writeLog.log('--------------------');

  const catalogsWithError = [];

  for (let linkIndex = 0; linkIndex < catalogLinks.length; linkIndex += 1) {
    const catalogStartTime = new Date();
    showFormattedTime(catalogStartTime);

    const {
      link,
      catalog,
      language,
    } = catalogLinks[linkIndex];
    let formattedCatalog = formatFileName(catalog);

    if (normalizeText(language).includes('fr')) {
      formattedCatalog = `fr_${formattedCatalog}`;
    } else if (normalizeText(language).includes('eng')) {
      formattedCatalog = `eng_${formattedCatalog}`;
    }

    writeLog.info('catalog:', catalog);

    const browser = await launchBrowser({ protocolTimeout: 1800000 });
    const page = await browser.newPage();
    const { bookLinks, error } = await wp.getBooksFromCatalog(page, link, catalog, language);
    if (browser) {
      await browser.close();
    }

    if (!error) {
      writeLog.log('add info to book links...');
      const bookLinkObjs = bookLinks.map((bookLink) => ({
        link: bookLink,
        catalog: 'Wattpad',
        subcategory: catalog,
        language,
      }));
      writeDebug(`bookLinkObjs[0]: ${JSON.stringify(bookLinkObjs[0], null, 2)}`);

      exportExcelFile(
        bookLinkObjs,
        path.join(FOLDER_WITH_BOOK_LINKS_WP, `${formattedCatalog}.xlsx`),
      );
    } else {
      catalogsWithError.push(catalogLinks[linkIndex]);
      writeLog.alert('Export the catalog link with the error');
      exportExcelFile(catalogsWithError, FILE_WITH_GET_ERRORS_WP);
    }

    showElapsedTime(catalogStartTime, 'this catalog');
    writeLog.log(linkIndex + 1, '/', catalogLinks.length, 'processed catalogs');
    writeLog.log('--------------------');
  }
  writeLog.log('--------------------');

  // End
  showElapsedTime(startTime);
  writeLog.info('Folder with book links:', FOLDER_WITH_BOOK_LINKS_WP);
  if (catalogsWithError && catalogsWithError.length > 0) {
    writeLog.error('Number of catalogs with error:', catalogsWithError.length);
    writeLog.error('File with errors:', FILE_WITH_GET_ERRORS_WP);
  }
  writeLog.success('Scraping finished!');
  await happyStickFigure();
}

module.exports = getWpBooks;
