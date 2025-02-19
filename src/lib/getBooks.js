const fs = require('fs');
const path = require('path');
const { ll } = require('my-scrapers');
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

const { bookLimitPerSubcat } = require('../../config.json');
const { FILE_WITH_GET_ERRORS, FOLDER_WITH_BOOK_LINKS } = require('../constants');

const tempFilePrefix1 = '01WIP-';
const tempFilePrefix2 = '02WIP-';

async function getBooks(filesWithCatalogLinks, exportFolder = FOLDER_WITH_BOOK_LINKS) {
  const writeDebug = writeLog.setDebug('g');

  // Start
  writeLog.step('Start getBooks()');

  // Set options
  let currentLimitPerSubcat = bookLimitPerSubcat;

  process.argv.forEach((processArg) => {
    if (processArg.includes('limit-') || processArg.includes('l-')) {
      let limit = processArg.replace('--', '').replace('limit-', '').replace('l-', '');
      limit = parseInt(limit, 10);
      currentLimitPerSubcat = !Number.isNaN(limit) ? limit : bookLimitPerSubcat;
    }
  });

  writeDebug(`currentLimitPerSubcat: ${currentLimitPerSubcat}`);

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folder
  await createFolder(exportFolder);
  writeLog.log('--------------------');

  // Scrape each file with catalog links
  writeLog.log('--------------------');
  writeLog.step('Scrape each file with catalog links');
  writeLog.log('--------------------');

  const filesWithError = [];
  let fileIndex = 0;

  // For each file
  for (const catalogFile of filesWithCatalogLinks) {
    const fileStartTime = new Date();
    showFormattedTime(fileStartTime);
    writeLog.info('file with catalog links:', catalogFile);

    const catalogLinks = importExcelFile(catalogFile).data;
    writeLog.log('--------------------');

    let allBookLinksFromThisFile = [];
    let tempBookLinks = {};
    const tempFilePath1 = path.join(exportFolder, `${tempFilePrefix1}${path.basename(catalogFile).replace('.xlsx', '.json')}`);
    const tempFilePath2 = path.join(exportFolder, `${tempFilePrefix2}${path.basename(catalogFile).replace('.xlsx', '.json')}`);

    writeLog.step('Load existing book links');
    try {
      if (fs.existsSync(tempFilePath2)) {
        tempBookLinks = importJsonFile(tempFilePath2).data;
      }
      if (Object.keys(tempBookLinks).length !== 0) {
        writeLog.success('Existing book links imported successfully');
      } else {
        writeLog.log('no existing book links');
      }
    } catch (error) {
      writeLog.alert('An error occurred while loading existing book links');
      writeLog.error(error);
      await exitProcess();
    }
    writeLog.log('--------------------');

    const browser = await launchBrowser();
    writeLog.log('--------------------');

    // For each link in the file
    for (let linkIndex = 0; linkIndex < catalogLinks.length; linkIndex += 1) {
      const linkStartTime = new Date();
      showFormattedTime(linkStartTime);

      const {
        link,
        catalog,
        subcategory,
        language,
        seriesName,
      } = catalogLinks[linkIndex];

      if (link.includes('/catalogue/') && subcategory) {
        writeLog.info('subcategory:', subcategory);
      } else if (link.includes('/catalogue/') && !subcategory && catalog) {
        writeLog.info('catalog:', catalog);
      } else if (link.includes('/serie/') && seriesName) {
        writeLog.info('series name:', seriesName);
      }

      let linkError = null;
      if (!tempBookLinks[link] || tempBookLinks[link].length === 0) {
        const { bookLinks, error } = await ll.getBooksFromCatalog(
          browser,
          link,
          seriesName || subcategory || catalog,
          { approxMaxBooks: currentLimitPerSubcat },
        );
        linkError = error;

        writeDebug(`error: ${error}`);
        if (!error) {
          if (Array.isArray(bookLinks) && bookLinks.length > 0) {
            writeLog.log('add info to book links...');
            const bookLinkObjs = bookLinks.map((bookLink) => ({
              link: bookLink,
              catalog,
              subcategory,
              language,
            }));
            writeDebug(`bookLinkObjs[0]: ${JSON.stringify(bookLinkObjs[0], null, 2)}`);
            allBookLinksFromThisFile = allBookLinksFromThisFile.concat(bookLinkObjs);
            tempBookLinks[link] = bookLinkObjs;

            exportJsonFile(tempBookLinks, tempFilePath1, { displayLogs: false });
            exportJsonFile(tempBookLinks, tempFilePath2, { displayLogs: false });
            writeLog.success('Data saved in temporary files');
          }
        } else {
          linkIndex = catalogLinks.length;
          allBookLinksFromThisFile = [];
        }
      } else {
        writeLog.info('The book links already exists');
        writeLog.info('books found for the catalog:', tempBookLinks[link].length);
        allBookLinksFromThisFile = allBookLinksFromThisFile.concat(tempBookLinks[link]);
      }

      showElapsedTime(linkStartTime, 'this research');
      if (!linkError) {
        writeLog.log(linkIndex + 1, '/', catalogLinks.length, 'processed researches');
      }
      writeLog.log('--------------------');
    }

    writeDebug(`allBookLinksFromThisFile.length: ${allBookLinksFromThisFile.length}`);
    if (allBookLinksFromThisFile && allBookLinksFromThisFile.length > 0) {
      writeLog.info('Save the file with book links');
      exportExcelFile(
        allBookLinksFromThisFile,
        path.join(exportFolder, path.basename(catalogFile)),
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
    } else {
      filesWithError.push({ catalog: path.basename(catalogFile) });
      writeLog.alert('Export the catalog with the error');
      exportExcelFile(filesWithError, FILE_WITH_GET_ERRORS);
    }

    if (browser) {
      await browser.close();
    }

    showElapsedTime(fileStartTime, 'this file');
    writeLog.log(fileIndex + 1, '/', filesWithCatalogLinks.length, 'processed files');
    fileIndex += 1;
    writeLog.log('--------------------');
    writeLog.log('--------------------');
  }

  // End
  showElapsedTime(startTime);
  writeLog.info('Folder with book links:', exportFolder);
  if (filesWithError && filesWithError.length > 0) {
    writeLog.error('Number of files with error:', filesWithError.length);
    writeLog.error('File with errors:', FILE_WITH_GET_ERRORS);
  }
  writeLog.success('Scraping finished!');
  await happyStickFigure();
}

module.exports = getBooks;
