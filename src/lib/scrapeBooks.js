const fs = require('fs');
const path = require('path');
const {
  ll,
  aa,
  ar,
  rc,
} = require('my-scrapers');
const {
  showFormattedTime,
  showElapsedTime,
  importExcelFile,
  exportExcelFile,
  importJsonFile,
  exportJsonFile,
  launchBrowser,
  saveImage,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const {
  bookLimit,
  imageStorageOn,
  splitAuthorFolder,
  timeoutOff,
} = require('../../config.json');
const createFolder = require('../func/createFolder');
const {
  FOLDER_WITH_BOOK_DATA,
  FOLDER_WITH_PUBLIC_DATA,
  FOLDER_WITH_BOOK_COVERS,
  FOLDER_WITH_AUTHOR_IMAGES,
  FOLDER_WITH_AUTHOR_IMAGES_AI,
  FOLDER_WITH_AUTHOR_IMAGES_JR,
  FOLDER_WITH_AUTHOR_IMAGES_SZ,
  LETTERS_AI,
  LETTERS_JR,
  LETTERS_SZ,
} = require('../constants');
const { formatPath } = require('../func/formatData');

const tempFilePrefix = '01WIP-';

async function scrapeBooks(bookLinkFiles) {
  // Start
  writeLog.step('Start scrapeBooks()');
  writeLog.debug(`bookLinkFiles: ${JSON.stringify(bookLinkFiles, null, 2)}`);

  // Set options
  let loadExistingBooks = true;

  const scrapingOptions = {
    isForUpdate: false,
    isForImages: false,
    searchUnfound: false,
    savePage: false,
    useSavedPage: false,
    timeoutOff,
  };

  const modulesToScrape = {
    ll: true,
    aa: true,
    ar: true,
    rc: true,
  };

  process.argv.forEach((processArg) => {
    if (processArg === 'not-load' || processArg === '--not-load') {
      loadExistingBooks = false;
    } else if (processArg === 'update' || processArg === '--update') {
      scrapingOptions.isForUpdate = true;
    } else if (processArg === 'images' || processArg === '--images') {
      scrapingOptions.isForImages = true;
    } else if (processArg === 'not-found' || processArg === '--not-found') {
      scrapingOptions.searchUnfound = true;
    } else if (processArg === 'save-pages' || processArg === '--save-pages') {
      scrapingOptions.savePage = true;
    } else if (processArg === 'use-saved-pages' || processArg === '--use-saved-pages') {
      scrapingOptions.useSavedPage = true;
    } else if (processArg === 'only' || processArg.includes('--only')) {
      Object.keys(modulesToScrape).forEach((key) => {
        modulesToScrape[key] = false;
      });

      process.argv.forEach((arg) => {
        Object.keys(modulesToScrape).forEach((key) => {
          if (arg === key || (arg.includes('--only') && arg.includes(key))) {
            modulesToScrape[key] = true;
          }
        });
      });
    }
  });

  const {
    isForUpdate,
    isForImages,
    searchUnfound,
    savePage,
    useSavedPage,
  } = scrapingOptions;

  writeLog.debug(`loadExistingBooks: ${loadExistingBooks}`);
  writeLog.debug(`scrapingOptions: ${JSON.stringify(scrapingOptions, null, 2)}`);
  writeLog.debug(`modulesToScrape: ${JSON.stringify(modulesToScrape, null, 2)}`);

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folders
  await createFolder(FOLDER_WITH_BOOK_DATA);
  await createFolder(FOLDER_WITH_PUBLIC_DATA);
  if (imageStorageOn) {
    await createFolder(FOLDER_WITH_BOOK_COVERS);
    if (!splitAuthorFolder) {
      await createFolder(FOLDER_WITH_AUTHOR_IMAGES);
    } else {
      await createFolder(FOLDER_WITH_AUTHOR_IMAGES_AI);
      await createFolder(FOLDER_WITH_AUTHOR_IMAGES_JR);
      await createFolder(FOLDER_WITH_AUTHOR_IMAGES_SZ);
    }
  }
  writeLog.log('--------------------');

  // Launch the browser
  const { browser, page } = await launchBrowser();
  await page.close();
  writeLog.log('--------------------');

  // Scrape each file with book links
  writeLog.log('--------------------');
  writeLog.step('Scrape each file with book links');
  writeLog.log('--------------------');

  let nbBooksWithError = 0;

  // For each files
  for (const linkFile of bookLinkFiles) {
    const fileStartTime = new Date();
    showFormattedTime(fileStartTime);
    writeLog.info('file with book links:', linkFile);
    const bookLinks = importExcelFile(linkFile).data;
    writeLog.log('--------------------');

    const catalog = path.basename(linkFile, path.extname(linkFile));
    const jsonToExportName = path.basename(linkFile).replace('.xlsx', '.json');
    const jsonToExportPath = path.join(FOLDER_WITH_BOOK_DATA, jsonToExportName);
    const tempFilePath = path.join(FOLDER_WITH_BOOK_DATA, `${tempFilePrefix}${jsonToExportName}`);

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
        if (fs.existsSync(tempFilePath)) {
          tempBooks = importJsonFile(tempFilePath).data;
        }

        const mergedBooks = tempBooks.concat(books);

        mergedBooks.forEach((book) => {
          if (!existingBooks[book.link]) {
            existingBooks[book.link] = book;
          }
        });

        if (Object.keys(existingBooks).length !== 0) {
          writeLog.success('Existing books imported successfully');
        } else {
          writeLog.log('no existing books');
        }
      } catch (error) {
        writeLog.error('An error occurred while loading existing books');
        writeLog.error(error);
        writeLog.error('process.exit();');
        process.exit();
      }
      writeLog.log('--------------------');
    }

    // For each book link in the file
    const allDataFromThisFile = [];
    const allDataToExcel = [];

    for (let bookIndex = 0; bookIndex < bookLimit && bookIndex < bookLinks.length; bookIndex += 1) {
      let initialData = bookLinks[bookIndex];
      writeLog.step('link:', initialData.link);

      let hasError = '';

      // Set data
      if (existingBooks && existingBooks[initialData.link]) {
        initialData = {
          ...initialData,
          ...existingBooks[initialData.link],
        };
        writeLog.info('The book already exists');
      }

      let {
        dataFromLl = {},
        dataFromAa = {},
        dataFromAr = {},
        dataFromRc = {},
      } = initialData;

      // Go to scrape
      if (modulesToScrape.ll && (
        !dataFromLl.searched
        || !dataFromLl.ISBN
        || dataFromLl.error
        || isForUpdate
        || (isForImages && !dataFromLl.image)
        || (searchUnfound && !dataFromLl.found))
      ) {
        const pageLl = await browser.newPage();
        dataFromLl = await ll
          .scrapeItem(pageLl, initialData.link, dataFromLl, scrapingOptions)
          || {};
        hasError = dataFromLl.error || hasError;
        await pageLl.close();
      }

      const { ISBN } = dataFromLl;

      if (!ISBN) {
        writeLog.alert('No ISBN found with:', initialData.link);
      } else {
        writeLog.info('ISBM:', dataFromLl.ISBN);

        if (modulesToScrape.aa && (
          !dataFromAa.searched
          || dataFromAa.error
          || (dataFromAa.images && dataFromAa.images.includes('https://m.media-amazon.com/images/G/15/ui/loadIndicators/loading-large_labeled._CB485921383_.gif'))
          || isForUpdate
          || (isForImages && !dataFromAa.image)
          || (searchUnfound && !dataFromAa.found))
        ) {
          const pageAaSearch = await browser.newPage();
          const pageAaItem = await browser.newPage();
          dataFromAa = await aa
            .scrapeItem(pageAaSearch, pageAaItem, ISBN, dataFromAa, scrapingOptions)
            || {};
          hasError = dataFromAa.error || hasError;
          await pageAaSearch.close();
          await pageAaItem.close();
        }

        if (modulesToScrape.ar && (
          !dataFromAr.searched
          || dataFromAr.error
          || isForUpdate
          || (isForImages && !dataFromAr.image)
          || (searchUnfound && !dataFromAr.found))
        ) {
          const pageAr = await browser.newPage();
          dataFromAr = await ar
            .scrapeItem(pageAr, ISBN, dataFromAr, scrapingOptions)
            || {};
          hasError = dataFromAr.error || hasError;
          await pageAr.close();
        }

        if (modulesToScrape.rc && (
          !dataFromRc.searched
          || dataFromRc.error
          || isForUpdate
          || (searchUnfound && !dataFromRc.found))
        ) {
          const pageRating = await browser.newPage();
          const pageComments = await browser.newPage();
          dataFromRc = await rc
            .scrapeOpinions(pageRating, pageComments, ISBN, dataFromRc, scrapingOptions)
            || {};
          hasError = dataFromRc.error || hasError;
          await pageRating.close();
          await pageComments.close();
        }
      }

      let sellers = [dataFromLl.link, dataFromAa.link, dataFromAr.link];
      sellers = sellers.filter((link) => (link != null));

      // Save the cover
      let cover;
      let coverSrc;
      if (!imageStorageOn) {
        cover = dataFromAa.image;
        coverSrc = dataFromAa.image;
      } else {
        writeLog.info('save the cover...');
        cover = initialData.cover;
        coverSrc = initialData.coverSrc;
        const imageFound = dataFromLl.image || dataFromAa.image || null;

        try {
          // Check the initial cover
          writeLog.debug(`ISBN: ${ISBN}`);
          writeLog.debug(`initialData.cover: ${cover}`);
          writeLog.debug(`imageFound: ${imageFound}`);

          if (cover && !cover.includes(catalog)) {
            writeLog.debug('change cover catalog');
            cover = path.join(
              FOLDER_WITH_BOOK_COVERS,
              catalog,
              path.basename(initialData.cover),
            );
            writeLog.debug(`cover: ${cover}`);
          }

          const imageExists = fs.existsSync(cover);
          writeLog.debug(`imageExists: ${imageExists}`);

          if (cover && !imageExists) {
            writeLog.debug('delete the cover path since the image does not exist');
            cover = null;
            coverSrc = null;
            writeLog.debug(`cover: ${cover}`);
            writeLog.debug(`coverSrc: ${coverSrc}`);
          }

          if (!cover && !imageFound) {
            writeLog.alert('No cover found for:', ISBN || 'no ISBN');
          }

          // Set and save the cover
          if (ISBN && !cover && imageFound) {
            const pageImage = await browser.newPage();
            const savedImage = await saveImage({
              page: pageImage,
              imageUrl: imageFound,
              folderPath: path.join(FOLDER_WITH_BOOK_COVERS, catalog),
              fileName: ISBN,
            });
            await pageImage.close();

            writeLog.debug(`savedImage: ${JSON.stringify(savedImage, null, 2)}`);
            cover = !savedImage.error ? savedImage.imagePath : null;
            coverSrc = cover ? imageFound : null;
          } else {
            writeLog.log('no need to save the cover');
          }
        } catch (error) {
          writeLog.error('An error occurred while saving the cover');
          writeLog.error(error);
          cover = null;
          coverSrc = null;
          hasError = error;
        }
        writeLog.debug(`cover: ${JSON.stringify(cover, null, 2)}`);
        writeLog.debug(`coverSrc: ${JSON.stringify(coverSrc, null, 2)}`);
        writeLog.debug('--------------------');
      }

      // Save the author image
      let authorImg;
      if (!imageStorageOn) {
        if (dataFromAa.authorImg && dataFromLl.authors && dataFromLl.authors.length === 1) {
          authorImg = dataFromAa.authorImg;
        }
      } else {
        writeLog.info('save the author image...');
        try {
          writeLog.debug(`dataFromAa.authorImg: ${dataFromAa.authorImg}`);
          writeLog.debug(`dataFromLl.authors: ${JSON.stringify(dataFromLl.authors, null, 2)}`);

          if (dataFromAa.authorImg && dataFromLl.authors && dataFromLl.authors.length === 1) {
            const authorImgUrl = dataFromAa.authorImg;
            const authorFormatted = formatPath(dataFromLl.authors[0]);
            const authorImgFile = `${authorFormatted}${path.extname(authorImgUrl.split('&')[0])}`;
            let authorFolder;
            let authorImgPath;

            if (!splitAuthorFolder) {
              authorFolder = FOLDER_WITH_AUTHOR_IMAGES;
              authorImgPath = path.join(authorFolder, authorImgFile);
            }

            if (splitAuthorFolder) {
              if (LETTERS_AI.includes(authorFormatted.charAt(0))) {
                authorFolder = FOLDER_WITH_AUTHOR_IMAGES_AI;
                authorImgPath = path.join(authorFolder, authorImgFile);
              } else if (LETTERS_JR.includes(authorFormatted.charAt(0))) {
                authorFolder = FOLDER_WITH_AUTHOR_IMAGES_JR;
                authorImgPath = path.join(authorFolder, authorImgFile);
              } else if (LETTERS_SZ.includes(authorFormatted.charAt(0))) {
                authorFolder = FOLDER_WITH_AUTHOR_IMAGES_SZ;
                authorImgPath = path.join(authorFolder, authorImgFile);
              } else {
                hasError = `Unable to catalog the author image with ${authorFormatted}`;
                writeLog.alert(hasError);
              }
            }

            if (authorFolder && !fs.existsSync(authorImgPath)) {
              const pageImage = await browser.newPage();
              const savedImage = await saveImage({
                page: pageImage,
                imageUrl: authorImgUrl,
                folderPath: authorFolder,
                fileName: authorFormatted,
              });
              await pageImage.close();

              writeLog.debug(`savedImage: ${JSON.stringify(savedImage, null, 2)}`);
              authorImg = !savedImage.error ? savedImage.imagePath : null;
            } else {
              writeLog.log('the image already exists');
              authorImg = authorImgPath;
            }
          } else {
            writeLog.log('no need to save the author image');
          }
        } catch (error) {
          writeLog.error('An error occurred while saving the author image');
          writeLog.error(error);
          authorImg = null;
          hasError = error;
        }
        writeLog.debug(`authorImg: ${JSON.stringify(authorImg, null, 2)}`);
        writeLog.debug('--------------------');
      }

      if ((!dataFromLl.ISBN && dataFromLl.found) || hasError) {
        nbBooksWithError += 1;
      }

      const mergedData = {
        link: initialData.link,
        ISBN: dataFromLl.ISBN,
        ISBNs: dataFromLl.ISBNs,
        title: dataFromLl.title,
        authors: dataFromLl.authors,
        cover,
        coverSrc,
        description: dataFromLl.description || dataFromAa.description || dataFromAr.description,
        mainCategories: dataFromLl.mainCategories,
        subcategories: dataFromLl.subcategories,
        releaseDate: dataFromLl.releaseDate || dataFromAa.releaseDate || dataFromAr.releaseDate,
        language: dataFromLl.language || dataFromAa.language || dataFromAr.language,
        publisher: dataFromLl.publisher || dataFromAa.publisher || dataFromAr.publisher,
        collection: dataFromLl.collection,
        targetAudience: dataFromLl.targetAudience || dataFromAa.targetAudience,
        nbOfPages: dataFromLl.nbOfPages || dataFromAa.nbOfPages || dataFromAr.nbOfPages,
        dimensions: dataFromAa.dimensions || dataFromAr.dimensions,
        excerptLink: dataFromLl.excerptLink,
        downloadLink: dataFromLl.downloadLink,
        authorBio: dataFromAa.authorBio,
        authorImg,
        rating: dataFromRc.rating,
        nbOfVotes: dataFromRc.nbOfVotes,
        nbOfLikes: dataFromRc.nbOfLikes,
        nbOfComments: dataFromRc.nbOfComments,
        commentIframeSrc: dataFromRc.commentIframeSrc,
        ratingLink: dataFromRc.link,
        sellers,
        dataFromLl: { ...dataFromLl, pageContent: '' },
        dataFromAa: { ...dataFromAa, pageContent: '' },
        dataFromAr: { ...dataFromAr, pageContent: '' },
        dataFromRc: { ...dataFromRc, pageContent: '' },
        hasError,
      };

      const dataToExcel = {};
      Object.keys(mergedData).forEach((key) => {
        const value = mergedData[key];
        dataToExcel[key] = value ? JSON.stringify(value, null, 2) : '';
      });
      dataToExcel.link = mergedData.link;

      if (savePage || useSavedPage) {
        mergedData.dataFromLl = dataFromLl;
        mergedData.dataFromAa = dataFromAa;
        mergedData.dataFromAr = dataFromAr;
        mergedData.dataFromRc = dataFromRc;
      }

      allDataFromThisFile.push(mergedData);
      allDataToExcel.push(dataToExcel);
      existingBooks[initialData.link] = mergedData;

      // Save data to a temporary file
      exportJsonFile(allDataFromThisFile, tempFilePath);

      showElapsedTime(fileStartTime, 'this file');
      writeLog.log(bookIndex + 1, '/', bookLinks.length < bookLimit ? bookLinks.length : bookLimit, 'processed links for', path.basename(linkFile));
      writeLog.log('--------------------');
    }

    writeLog.info('Save the final files');
    exportJsonFile(allDataFromThisFile, jsonToExportPath);
    exportExcelFile(
      allDataToExcel,
      path.join(FOLDER_WITH_BOOK_DATA, path.basename(linkFile)),
    );
    writeLog.log('clean data for the public JSON...');
    const dataToPublic = [];
    allDataFromThisFile.forEach((book) => {
      const publicBook = { ...book };
      delete publicBook.link;
      delete publicBook.dataFromLl;
      delete publicBook.dataFromAa;
      delete publicBook.dataFromAr;
      delete publicBook.dataFromRc;
      delete publicBook.hasError;
      delete publicBook.coverSrc;
      if (Object.keys(publicBook).length > 0) {
        dataToPublic.push(publicBook);
      }
    });
    exportJsonFile(
      dataToPublic,
      path.join(FOLDER_WITH_PUBLIC_DATA, jsonToExportName),
    );
    writeLog.log('delete the temporary file...');
    try {
      await fs.promises.unlink(tempFilePath);
    } catch (error) {
      writeLog.error('An error occurred while deleting the temporary file:', tempFilePath);
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
  writeLog.info('Folder with book data:', FOLDER_WITH_BOOK_DATA);
  writeLog.info('Folder with public data:', FOLDER_WITH_PUBLIC_DATA);
  if (imageStorageOn) {
    writeLog.info('Folder with covers:', FOLDER_WITH_BOOK_COVERS);
    if (!splitAuthorFolder) {
      writeLog.info('Folder with author images:', FOLDER_WITH_AUTHOR_IMAGES);
    } else {
      writeLog.info('Folders with author images:', FOLDER_WITH_AUTHOR_IMAGES_AI, FOLDER_WITH_AUTHOR_IMAGES_JR, FOLDER_WITH_AUTHOR_IMAGES_SZ);
    }
  }
  if (nbBooksWithError > 0) {
    writeLog.error('Number of books with error:', nbBooksWithError);
  }
  writeLog.success('Scraping finished!');
  await happyStickFigure();
}

module.exports = scrapeBooks;
