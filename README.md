# The Amazing Book-Scraper
![Static Badge](https://img.shields.io/badge/JavaScript-f7df1e?logo=JavaScript&logoColor=000)

This JavaScript application provides an efficient solution for collecting information about books from various websites. It is designed to automatically and systematically extract essential details such as titles, authors, descriptions, and more from diverse online sources.

## Requirements
- Have access to the "my-scrapers" package.
- Copy "config_template.json", rename it "config.json" and fill it.

## Usage
```bash
node book-scraper.js usage
```

### Notes
- When acquiring book links, all catalogs where an error occurred are logged in a file named "errorsWithGet.xlsx". These catalogs can be revisited using the "get-errors" command. The operation is similar for Wp (see usage).

- During the scraping process, books that have already been found are not searched for again unless they have missing information. Discovered books are saved in a temporary file and will be automatically resumed when the program restarts after a crash.

## Test
```bash
npm run lint
npm run pre-release
```
