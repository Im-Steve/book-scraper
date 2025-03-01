const { writeLog } = require('useful-toolbox-js');

function showUsage() {
  writeLog.log(
    'Usage: node book-scraper.js <ACTION> <OPTIONS>\n',
    '\n',
    'Actions:\n',
    '\tget-cat <CATALOG> --l-500: Get book links from a catalog with a limit per subcategory\n',
    '\tget-all --l-500: Get book links from all catalogs with a limit per subcategory\n',
    '\tget-errors: Get book links from the error file\n',
    '\tget-file <EXCEL FILE>: Get book links from an Excel file (to test)\n',
    '\n',
    '\tremove-doubles: Remove duplicate book links found with get\n',
    '\n',
    '\tscrape-cat <CATALOG>: Scrape data with book links from a catalog\n',
    '\tscrape-all: Scrape data with book links from all catalogs\n',
    '\tscrape-errors: Re-scrape data with errors\n',
    '\tscrape-data: Re-scrape data already found according to the given options\n',
    '\tscrape-file <EXCEL FILE>: Scrape data with books links from an Excel file (to test)\n',
    '\n',
    '\tget-series-cat <CATALOG>: Get book links from series in a catalog\n',
    '\tget-series-all: Get book links from series in all catalogs\n',
    '\tget-series-errors: Get book links from series with the error file\n',
    '\tscrape-series-cat: Scrape data with book links from an series catalog\n',
    '\tscrape-series-all: Scrape data with book links from all series catalogs\n',
    '\tscrape-series-errors: Re-scrape series data with errors\n',
    '\tscrape-series-data: Re-scrape series data already found according to the given options\n',
    '\tadd-series: Add series books to book data\n',
    '\n',
    '\tclean-covers: Remove cover images that are no longer used\n',
    '\tclean-authors: Remove author images that are no longer used\n',
    '\tclean-images: Remove book images that are no longer used\n',
    '\tclean-all-img: Remove all images that are no longer used\n',
    '\n',
    '\tget-wp-all: Get wp book links from all catalogs\n',
    '\tget-wp-errors: Get wp book links from the error file\n',
    '\tget-wp-file <EXCEL FILE>: Get wp book links from an Excel file (to test)\n',
    '\n',
    '\tscrape-wp-cat <CATALOG>: Scrape wp data with book links from a catalog\n',
    '\tscrape-wp-all: Scrape wp data with book links from all catalogs\n',
    '\tscrape-wp-errors: Re-scrape wp data with errors\n',
    '\tscrape-wp-data: Re-scrape wp data already found according to the given options\n',
    '\tscrape-wp-file <EXCEL FILE>: Scrape wp data with book links from an Excel file (to test)\n',
    '\n',
    '\tmix-promo: Mix self-promotion books\n',
    '\n',
    '\tshow-logs --s-<MS>: Show file logs with a speed in milliseconds\n',
    '\tshow-errors --s-<MS>: Show error logs with a speed in milliseconds\n',
    '\n',
    'Options:\n',
    '\t--delete-<WEBSITES>: Delete data from websites (for an update)\n',
    '\t--only-<WEBSITES>: Scrape only given websites (for an update)\n',
    '\t--images: Update the images of books that don\'t have one\n',
    '\t--not-found: Update books that were not found\n',
    '\n',
    '\t--not-load: Do not load existing books (especially to test)\n',
    '\t--use-saved-page: Save and use the saved page to speed up testing\n',
    '\n',
    '\t--dev: Display dev logs\n',
    '\t--debug: Display debug logs\n',
    '\t--debug-g: Only display general debug logs\n',
    '\t--debug-<WEBSITES>: Only display debug logs from given websites\n',
    '\n',
    'Websites: ll, aa, ar, rc, wp, ma\n',
  );
}

module.exports = showUsage;
