const {
  startRecordingLogs,
  stopRecordingLogs,
  showFileLogs,
  writeLog,
} = require('useful-toolbox-js');

const {
  getBooksFromNewBooks,
  getBooksFromBestsellers,
  getBooksFromMainCat,
  getBooksFromAllCatalogs,
  getBooksFromErrors,
  getBooksFromFile,
} = require('./lib/handleGetBooks');

const {
  scrapeBooksFromNewBooks,
  scrapeBooksFromBestsellers,
  scrapeBooksFromCat,
  scrapeBooksFromMainCat,
  scrapeBooksFromAllCatalogs,
  scrapeBookData,
  scrapeBooksFromFile,
} = require('./lib/handleScrapeBooks');

const cleanAuthors = require('./lib/cleanAuthors');
const cleanCovers = require('./lib/cleanCovers');
const getCategories = require('./lib/getCategories');
const removeDuplicates = require('./lib/removeDuplicates');
const showUsage = require('./showUsage');

async function scrapeBooks() {
  const actionArg = process.argv.length >= 3 && process.argv[2];

  if (actionArg === 'show-logs') {
    await showFileLogs();
    process.exit();
  }

  if (actionArg === 'show-errors') {
    await showFileLogs({ onlyErrors: true });
    process.exit();
  }

  await startRecordingLogs();

  switch (actionArg) {
    case 'get-news':
      await getBooksFromNewBooks();
      break;
    case 'get-bests':
      await getBooksFromBestsellers();
      break;
    case 'get-main-cat':
      await getBooksFromMainCat();
      break;
    case 'get-all':
      await getBooksFromAllCatalogs();
      break;
    case 'get-errors':
      await getBooksFromErrors();
      break;
    case 'get':
      await getBooksFromFile();
      break;
    case 'scrape-news':
      await scrapeBooksFromNewBooks();
      break;
    case 'scrape-bests':
      await scrapeBooksFromBestsellers();
      break;
    case 'scrape-cat':
      await scrapeBooksFromCat();
      break;
    case 'scrape-main-cat':
      await scrapeBooksFromMainCat();
      break;
    case 'scrape-all':
      await scrapeBooksFromAllCatalogs();
      break;
    case 'scrape-errors':
      await scrapeBookData();
      break;
    case 'scrape-data':
      await scrapeBookData();
      break;
    case 'scrape':
      await scrapeBooksFromFile();
      break;
    case 'remove-doubles':
      await removeDuplicates();
      break;
    case 'clean-covers':
      await cleanCovers();
      break;
    case 'clean-authors':
      await cleanAuthors();
      break;
    case 'get-cat':
      await getCategories();
      break;
    case 'usage':
      showUsage();
      break;
    default:
      writeLog.error('Error: Invalid use of arguments');
      showUsage();
  }

  stopRecordingLogs();
}

module.exports = scrapeBooks;
