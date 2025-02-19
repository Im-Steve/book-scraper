const {
  startRecordingLogs,
  stopRecordingLogs,
  showFileLogs,
  writeLog,
} = require('useful-toolbox-js');

const {
  getBooksFromCat,
  getBooksFromAll,
  getBooksFromErrors,
  getBooksFromFile,
} = require('./lib/handleGetBooks');

const {
  scrapeBooksFromCat,
  scrapeBooksFromAll,
  scrapeBookData,
  scrapeBooksFromFile,
} = require('./lib/handleScrapeBooks');

const {
  getSeriesFromCat,
  getSeriesFromAll,
  getSeriesFromErrors,
  scrapeSeriesFromCat,
  scrapeSeriesFromAll,
  scrapeSeriesData,
} = require('./lib/handleSeries');

const {
  getWpBooksFromAll,
  getWpBooksFromErrors,
  getWpBooksFromFile,
} = require('./lib/handleGetWp');

const {
  scrapeWpBooksFromCat,
  scrapeWpBooksFromAll,
  scrapeWpBookData,
  scrapeWpBooksFromFile,
} = require('./lib/handleScrapeWp');

const addSeries = require('./lib/addSeries');
const cleanImages = require('./lib/cleanImages');
const listCategories = require('./lib/listCategories');
const mixSelfpromotions = require('./lib/mixSelfpromotions');
const removeDuplicates = require('./lib/removeDuplicates');
const showUsage = require('./showUsage');

const {
  FOLDER_WITH_BOOK_COVERS,
  FOLDER_WITH_AUTHOR_IMAGES,
  FOLDER_WITH_BOOK_IMAGES,
} = require('./constants');

async function scraper() {
  const actionArg = process.argv.length >= 3 && process.argv[2];

  switch (actionArg) {
    case 'get-cat':
      await startRecordingLogs();
      await getBooksFromCat();
      stopRecordingLogs();
      break;
    case 'get-all':
      await startRecordingLogs();
      await getBooksFromAll();
      stopRecordingLogs();
      break;
    case 'get-errors':
      await startRecordingLogs();
      await getBooksFromErrors();
      stopRecordingLogs();
      break;
    case 'get-file':
      await startRecordingLogs();
      await getBooksFromFile();
      stopRecordingLogs();
      break;
    case 'scrape-cat':
      await startRecordingLogs();
      await scrapeBooksFromCat();
      stopRecordingLogs();
      break;
    case 'scrape-all':
      await startRecordingLogs();
      await scrapeBooksFromAll();
      stopRecordingLogs();
      break;
    case 'scrape-errors':
      await startRecordingLogs();
      await scrapeBookData();
      stopRecordingLogs();
      break;
    case 'scrape-data':
      await startRecordingLogs();
      await scrapeBookData();
      stopRecordingLogs();
      break;
    case 'scrape-file':
      await startRecordingLogs();
      await scrapeBooksFromFile();
      stopRecordingLogs();
      break;
    case 'get-series-cat':
      await startRecordingLogs();
      await getSeriesFromCat();
      stopRecordingLogs();
      break;
    case 'get-series-all':
      await startRecordingLogs();
      await getSeriesFromAll();
      stopRecordingLogs();
      break;
    case 'get-series-errors':
      await startRecordingLogs();
      await getSeriesFromErrors();
      stopRecordingLogs();
      break;
    case 'scrape-series-cat':
      await startRecordingLogs();
      await scrapeSeriesFromCat();
      stopRecordingLogs();
      break;
    case 'scrape-series-all':
      await startRecordingLogs();
      await scrapeSeriesFromAll();
      stopRecordingLogs();
      break;
    case 'scrape-series-errors':
      await startRecordingLogs();
      await scrapeSeriesData();
      stopRecordingLogs();
      break;
    case 'scrape-series-data':
      await startRecordingLogs();
      await scrapeSeriesData();
      stopRecordingLogs();
      break;
    case 'add-series':
      await startRecordingLogs();
      await addSeries();
      stopRecordingLogs();
      break;
    case 'remove-doubles':
      await startRecordingLogs();
      await removeDuplicates();
      stopRecordingLogs();
      break;
    case 'clean-covers':
      await startRecordingLogs();
      await cleanImages(FOLDER_WITH_BOOK_COVERS, 'cover');
      stopRecordingLogs();
      break;
    case 'clean-authors':
      await startRecordingLogs();
      await cleanImages(FOLDER_WITH_AUTHOR_IMAGES, 'authorImg');
      stopRecordingLogs();
      break;
    case 'clean-images':
      await startRecordingLogs();
      await cleanImages(FOLDER_WITH_BOOK_IMAGES, 'id');
      stopRecordingLogs();
      break;
    case 'clean-all-img':
      await startRecordingLogs();
      await cleanImages(FOLDER_WITH_BOOK_COVERS, 'cover');
      writeLog.log('--------------------');
      writeLog.log('--------------------');
      await cleanImages(FOLDER_WITH_AUTHOR_IMAGES, 'authorImg');
      writeLog.log('--------------------');
      writeLog.log('--------------------');
      await cleanImages(FOLDER_WITH_BOOK_IMAGES, 'id');
      stopRecordingLogs();
      break;
    case 'list-cat':
      await startRecordingLogs();
      await listCategories();
      stopRecordingLogs();
      break;
    case 'get-wp-all':
      await startRecordingLogs();
      await getWpBooksFromAll();
      stopRecordingLogs();
      break;
    case 'get-wp-errors':
      await startRecordingLogs();
      await getWpBooksFromErrors();
      stopRecordingLogs();
      break;
    case 'get-wp-file':
      await startRecordingLogs();
      await getWpBooksFromFile();
      stopRecordingLogs();
      break;
    case 'scrape-wp-cat':
      await startRecordingLogs();
      await scrapeWpBooksFromCat();
      stopRecordingLogs();
      break;
    case 'scrape-wp-all':
      await startRecordingLogs();
      await scrapeWpBooksFromAll();
      stopRecordingLogs();
      break;
    case 'scrape-wp-errors':
      await startRecordingLogs();
      await scrapeWpBookData();
      stopRecordingLogs();
      break;
    case 'scrape-wp-data':
      await startRecordingLogs();
      await scrapeWpBookData();
      stopRecordingLogs();
      break;
    case 'scrape-wp-file':
      await startRecordingLogs();
      await scrapeWpBooksFromFile();
      stopRecordingLogs();
      break;
    case 'mix-promo':
      await startRecordingLogs();
      await mixSelfpromotions();
      stopRecordingLogs();
      break;
    case 'show-logs':
      await showFileLogs();
      break;
    case 'show-errors':
      await showFileLogs({ onlyErrors: true });
      break;
    case 'usage':
      showUsage();
      break;
    default:
      writeLog.error('Error: Invalid use of arguments');
      showUsage();
  }
}

module.exports = scraper;
