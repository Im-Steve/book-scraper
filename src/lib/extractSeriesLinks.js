const path = require('path');
const {
  showFormattedTime,
  showElapsedTime,
  createFolder,
  importJsonFile,
  exportExcelFile,
  writeLog,
} = require('useful-toolbox-js');

const { TEMP_FOLDER } = require('../constants');

async function extractSeriesLinks(bookDataFiles) {
  // Start
  writeLog.step('Start extractSeriesLinks()');

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folder
  await createFolder(TEMP_FOLDER);
  writeLog.log('--------------------');

  // Extract series links from each catalog
  writeLog.step('Extract series links from each catalog');
  writeLog.log('--------------------');

  const seriesLinksFiles = [];
  let catalogIndex = 0;

  // For each catalog
  for (const bookDataFile of bookDataFiles) {
    writeLog.info('catalog:', bookDataFile);

    const bookData = importJsonFile(bookDataFile).data;
    let bookIndex = 0;

    // For each book in the catalog
    const seriesObject = {};
    for (const book of bookData) {
      if (book.dataFromLl
      && book.dataFromLl.seriesLink
      && !seriesObject[book.dataFromLl.seriesLink]) {
        seriesObject[book.dataFromLl.seriesLink] = {
          link: `${book.dataFromLl.seriesLink}?sort=part_number`,
          catalog: book.catalog,
          subcategory: book.subcategory,
          language: book.language,
          seriesName: book.seriesName,
        };
      }

      bookIndex += 1;
      writeLog.rewrite(`${bookIndex} / ${bookData.length} processed books`);
    }
    writeLog.log();

    const seriesLinks = [];
    Object.keys(seriesObject).forEach((seriesLink) => {
      seriesLinks.push(seriesObject[seriesLink]);
    });

    if (seriesLinks.length > 0) {
      const { pathToExport } = exportExcelFile(
        seriesLinks,
        path.join(TEMP_FOLDER, path.basename(bookDataFile).replace('.json', '')),
      );
      seriesLinksFiles.push(pathToExport);
    } else {
      writeLog.info('No series');
    }

    catalogIndex += 1;
    writeLog.log(`${catalogIndex} / ${bookDataFiles.length} processed catalogs`);
    writeLog.log('--------------------');
  }

  // End
  showElapsedTime(startTime);
  writeLog.success('Extraction finished!');
  return seriesLinksFiles;
}

module.exports = extractSeriesLinks;
