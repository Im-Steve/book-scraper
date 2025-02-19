const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const {
  ll,
  aa,
  ar,
  // rc,
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
  createFolder,
  formatFileName,
  exitProcess,
  normalizeText,
  happyStickFigure,
  writeLog,
} = require('useful-toolbox-js');

const { formatBookToExcel, formatBookToPublic } = require('./formatBook');
const { imageStorageOn, timeoutOff } = require('../../config.json');
const {
  FOLDER_WITH_BOOK_DATA,
  FOLDER_WITH_BOOK_DATA_PUBLIC,
  FOLDER_WITH_BOOK_COVERS,
  FOLDER_WITH_AUTHOR_IMAGES,
  FOLDER_WITH_BOOK_IMAGES,
} = require('../constants');

const tempFilePrefix1 = '01WIP-';
const tempFilePrefix2 = '02WIP-';

async function scrapeBooks(
  filesWithBookLinks,
  folderWithBookData = FOLDER_WITH_BOOK_DATA,
  exportToPublic = true,
) {
  const writeDebug = writeLog.setDebug('g');

  // Start
  writeLog.step('Start scrapeBooks()');
  writeDebug(`filesWithBookLinks: ${JSON.stringify(filesWithBookLinks, null, 2)}`);

  // Set options
  let loadExistingBooks = true;
  let isForImages = false;
  let searchUnfound = false;
  let deleteData = false;
  const dataToDelete = {
    ll: false,
    aa: false,
    ar: false,
    rc: false,
    ma: false,
  };
  const websitesToScrape = {
    ll: true,
    aa: true,
    ar: true,
    rc: true,
  };

  const scrapingOptions = {
    useSavedPage: false,
    timeoutOff,
  };

  process.argv.forEach((processArg) => {
    if (processArg === 'not-load' || processArg === '--not-load') {
      loadExistingBooks = false;
    } else if (processArg === 'images' || processArg === '--images') {
      isForImages = true;
    } else if (processArg === 'not-found' || processArg === '--not-found') {
      searchUnfound = true;
    } else if (processArg === 'use-saved-page' || processArg === '--use-saved-page') {
      scrapingOptions.useSavedPage = true;
    } else if (processArg.includes('delete-')) {
      deleteData = true;
      Object.keys(dataToDelete).forEach((key) => {
        if (processArg.includes(key)) {
          dataToDelete[key] = true;
        }
      });
    } else if (processArg.includes('only-')) {
      Object.keys(websitesToScrape).forEach((key) => {
        websitesToScrape[key] = false;
      });

      Object.keys(websitesToScrape).forEach((key) => {
        if (processArg.includes(key)) {
          websitesToScrape[key] = true;
        }
      });
    }
  });

  const {
    useSavedPage,
  } = scrapingOptions;

  writeDebug(`loadExistingBooks: ${loadExistingBooks}`);
  writeDebug(`isForImages: ${isForImages}`);
  writeDebug(`searchUnfound: ${searchUnfound}`);
  writeDebug(`deleteData: ${deleteData}`);
  writeDebug(`dataToDelete: ${JSON.stringify(dataToDelete, null, 2)}`);
  writeDebug(`websitesToScrape: ${JSON.stringify(websitesToScrape, null, 2)}`);
  writeDebug(`scrapingOptions: ${JSON.stringify(scrapingOptions, null, 2)}`);

  // Set time
  const startTime = new Date();
  showFormattedTime(startTime);
  writeLog.log('--------------------');

  // Create the export folders
  await createFolder(folderWithBookData);
  if (exportToPublic) {
    await createFolder(FOLDER_WITH_BOOK_DATA_PUBLIC);
  }
  if (imageStorageOn) {
    await createFolder(FOLDER_WITH_BOOK_COVERS);
    await createFolder(FOLDER_WITH_AUTHOR_IMAGES);
    await createFolder(FOLDER_WITH_BOOK_IMAGES);
  }
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
    const jsonToExportPath = path.join(folderWithBookData, jsonToExportName);
    const tempFilePath1 = path.join(folderWithBookData, `${tempFilePrefix1}${jsonToExportName}`);
    const tempFilePath2 = path.join(folderWithBookData, `${tempFilePrefix2}${jsonToExportName}`);

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
      };
      writeLog.step('link:', initialData.link);

      const hasErrors = [];

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
        dataFromLl = {},
        dataFromAa = {},
        dataFromAr = {},
        dataFromRc = {},
        manualAddition = {},
      } = initialData;

      if (bookLinks[bookIndex].hasManualAdd) {
        const manualISBN = bookLinks[bookIndex].ISBN;
        manualAddition = {
          ...bookLinks[bookIndex],
          authors: typeof bookLinks[bookIndex].authors === 'string'
            ? JSON.parse(bookLinks[bookIndex].authors)
            : bookLinks[bookIndex].authors,
          images: typeof bookLinks[bookIndex].images === 'string'
            ? JSON.parse(bookLinks[bookIndex].images)
            : bookLinks[bookIndex].images,
          nbOfPages: parseInt(bookLinks[bookIndex].nbOfPages, 10) || null,
          seriesPosition: parseInt(bookLinks[bookIndex].seriesPosition, 10) || null,
        };
        if (!Array.isArray(manualAddition.authors) || manualAddition.authors.length === 0) {
          manualAddition.authors = null;
        }
        if (!Array.isArray(manualAddition.images) || manualAddition.images.length === 0) {
          manualAddition.images = null;
        }
        if (manualISBN) {
          if (normalizeText(initialData.language).includes('fr')) {
            manualAddition.ISBNs = [{ isbn: manualISBN, format: 'Livre' }];
          }
          if (normalizeText(initialData.language).includes('eng')) {
            manualAddition.ISBNs = [{ isbn: manualISBN, format: 'Book' }];
          }
        }
      }

      // Go to scrape
      if (websitesToScrape.ll && !deleteData && initialData.link.includes('/livres/') && (
        !dataFromLl.searched
        || (!dataFromLl.ISBN && dataFromLl.found)
        || dataFromLl.error
        || useSavedPage
        || (isForImages && !dataFromLl.image)
        || (searchUnfound && !dataFromLl.found))
      ) {
        const pageLl = await browser.newPage();
        dataFromLl = await ll
          .scrapeItem(pageLl, initialData.link, dataFromLl, scrapingOptions)
          || {};
        await pageLl.close();
        if (dataFromLl.error) {
          hasErrors.push(dataFromLl.error);
        }
        toSaveInTempFile = true;
      }
      if (normalizeText(initialData.language).includes('eng')) {
        if (Array.isArray(dataFromLl.ISBNs)) {
          dataFromLl.ISBNs = dataFromLl.ISBNs.map((ISBN) => (
            {
              ...ISBN,
              format: ISBN.format === 'Papier' ? 'Paper' : ISBN.format,
            }
          ));
        }
      }

      const ISBN = manualAddition.ISBN || dataFromLl.ISBN;
      const id = manualAddition.id || manualAddition.ISBN || dataFromLl.ISBN || manualAddition.ASIN;

      if (!ISBN && !manualAddition.ASIN) {
        writeLog.alert('No ISBN found with:', initialData.link);
      } else {
        if (ISBN) {
          writeLog.info('ISBM:', ISBN);
        }
        if (manualAddition.ASIN) {
          writeLog.info('ASIN:', manualAddition.ASIN);
        }

        if (websitesToScrape.aa && !deleteData && (
          !dataFromAa.searched
          || dataFromAa.error
          || useSavedPage
          || (dataFromAa.images && dataFromAa.images.includes('https://m.media-amazon.com/images/G/15/ui/loadIndicators/loading-large_labeled._CB485921383_.gif'))
          || (isForImages && !dataFromAa.image)
          || (searchUnfound && !dataFromAa.found))
        ) {
          const pageAaSearch = await browser.newPage();
          const pageAaItem = await browser.newPage();
          dataFromAa = await aa.scrapeItem(
            pageAaSearch,
            pageAaItem,
            manualAddition.ASIN || ISBN,
            dataFromAa,
            scrapingOptions,
          ) || {};
          await pageAaSearch.close();
          await pageAaItem.close();
          if (dataFromAa.error) {
            hasErrors.push(dataFromAa.error);
          }
          toSaveInTempFile = true;
        }
        if (dataFromAa.found && !dataFromAa.error
        && !dataFromAa.nbOfPages && !dataFromAa.publisher && !dataFromAa.releaseDate) {
          dataFromAa = {
            searched: true,
            found: false,
            error: null,
          };
        }

        if (websitesToScrape.ar && !deleteData && ISBN && (
          !dataFromAr.searched
          || dataFromAr.error
          || useSavedPage
          || (isForImages && !dataFromAr.image)
          || (searchUnfound && !dataFromAr.found))
        ) {
          const pageAr = await browser.newPage();
          dataFromAr = await ar
            .scrapeItem(pageAr, ISBN, dataFromAr, scrapingOptions)
            || {};
          await pageAr.close();
          if (dataFromAr.error) {
            hasErrors.push(dataFromAr.error);
          }
          toSaveInTempFile = true;
        }

        // if (websitesToScrape.rc && !deleteData && (
        //   !dataFromRc.searched
        //   || dataFromRc.error
        //   || useSavedPage
        //   || (searchUnfound && !dataFromRc.found))
        // ) {
        //   const pageRating = await browser.newPage();
        //   const pageComments = await browser.newPage();
        //   dataFromRc = await rc
        //     .scrapeOpinions(pageRating, pageComments, ISBN, dataFromRc, scrapingOptions)
        //     || {};
        //   await pageRating.close();
        //   await pageComments.close();
        //   if (dataFromRc.error) {
        //     hasErrors.push(dataFromRc.error);
        //   }
        //   toSaveInTempFile = true;
        // }
      }
      if (dataToDelete.ll) {
        writeLog.step('Delete ll');
        dataFromLl = {};
        writeDebug(`dataFromLl: ${JSON.stringify(dataFromLl, null, 2)}`);
      }
      if (dataToDelete.aa) {
        writeLog.step('Delete aa');
        dataFromAa = {};
        writeDebug(`dataFromAa: ${JSON.stringify(dataFromAa, null, 2)}`);
      }
      if (dataToDelete.ar) {
        writeLog.step('Delete ar');
        dataFromAr = {};
        writeDebug(`dataFromAr: ${JSON.stringify(dataFromAr, null, 2)}`);
      }
      if (dataToDelete.rc) {
        writeLog.step('Delete rc');
        dataFromRc = {};
        writeDebug(`dataFromRc: ${JSON.stringify(dataFromRc, null, 2)}`);
      }
      if (dataToDelete.ma) {
        writeLog.step('Delete ma');
        manualAddition = {};
        writeDebug(`manualAddition: ${JSON.stringify(manualAddition, null, 2)}`);
      }
      writeDebug('--------------------');

      // Sellers
      const sellers = [];

      if (dataFromLl.link) {
        sellers.push({
          title: 'Les libraires',
          link: dataFromLl.link,
        });
      }

      if (dataFromAr.link) {
        const RBmatch = dataFromAr.link.match(/\?id=(\d+)&/);
        if (RBmatch) {
          sellers.push({
            title: 'Renaud-Bray',
            link: `https://www.renaud-bray.com/Livres_Produit.aspx?id=${RBmatch[1]}`,
          });
        }
        sellers.push({
          title: 'Archambault',
          link: dataFromAr.link,
        });
      }

      // if (sellers.length > 0) {
      //   if (!initialData.language || normalizeText(initialData.language).includes('fr')) {
      //     sellers.push({
      //       title: 'Fuck Amazon',
      //       link: 'https://www.ledevoir.com/economie/835159/amazon-canada-ferme-sept-entrepots-quebec',
      //     });
      //   }

      //   if (normalizeText(initialData.language).includes('eng')) {
      //     sellers.push({
      //       title: 'Fuck Amazon',
      //       link: 'https://www.ctvnews.ca/montreal/article/amazon-is-ceasing-operations-in-quebec',
      //     });
      //   }
      // }

      if (sellers.length === 0 && dataFromAa.link) {
        if (!initialData.language || normalizeText(initialData.language).includes('fr')) {
          sellers.push({
            title: 'Amazon Canada',
            link: dataFromAa.link,
          });
          sellers.push({
            title: 'Amazon France',
            link: dataFromAa.link.replace('www.amazon.ca', 'www.amazon.fr'),
          });
        }

        if (normalizeText(initialData.language).includes('eng')) {
          sellers.push({
            title: 'Amazon USA',
            link: dataFromAa.link.replace('www.amazon.ca/-/fr', 'www.amazon.com'),
          });
          sellers.push({
            title: 'Amazon Canada',
            link: dataFromAa.link.replace('www.amazon.ca/-/fr', 'www.amazon.ca'),
          });
          sellers.push({
            title: 'Amazon France',
            link: dataFromAa.link.replace('www.amazon.ca/-/fr', 'www.amazon.fr'),
          });
        }
      }

      // Save the cover
      let cover;
      let coverSrc;
      writeDebug(`imageStorageOn: ${imageStorageOn}`);
      if (!imageStorageOn) {
        cover = dataFromAa.image;
        coverSrc = dataFromAa.image;
      } else {
        writeLog.info('save the cover...');
        cover = initialData.cover;
        coverSrc = initialData.coverSrc;
        const coverFound = dataFromLl.image || dataFromAa.image || dataFromAr.image || null;

        try {
          writeDebug(`id: ${id}`);
          writeDebug(`initialData.cover: ${cover}`);
          writeDebug(`initialData.coverSrc: ${coverSrc}`);
          writeDebug(`coverFound: ${coverFound}`);

          let coverExists = fs.existsSync(cover);
          writeDebug(`coverExists: ${coverExists}`);

          if (!id
          || !coverFound
          || !(cover && coverExists)
          || coverSrc !== coverFound) {
            writeDebug('delete the cover path since the image does not exist or has been changed');
            cover = null;
            coverSrc = null;
            coverExists = false;
            writeDebug(`cover: ${cover}`);
            writeDebug(`coverSrc: ${coverSrc}`);
            writeDebug(`coverExists: ${coverExists}`);
          }

          if (id && coverFound) {
            if (!coverExists) {
              const pageImage = await browser.newPage();
              const savedImage = await saveImage({
                page: pageImage,
                imageUrl: coverFound,
                folderPath: FOLDER_WITH_BOOK_COVERS,
                fileName: id,
              });
              await pageImage.close();

              writeDebug(`savedImage: ${JSON.stringify(savedImage, null, 2)}`);
              cover = !savedImage.error ? savedImage.imagePath : null;
              coverSrc = cover ? coverFound : null;
              toSaveInTempFile = true;
              if (savedImage.error) {
                hasErrors.push(savedImage.error);
              }
            } else {
              writeLog.log('the cover already exists');
            }
          } else {
            writeLog.log('lack of info to save the cover');
          }
        } catch (catchError) {
          const coverError = `An error occurred while saving the cover for: ${id || 'no ID'}`;
          hasErrors.push(coverError);
          writeLog.alert(coverError);
          writeLog.error(catchError);
          cover = null;
          coverSrc = null;
        }
      }
      writeDebug(`cover: ${JSON.stringify(cover, null, 2)}`);
      writeDebug(`coverSrc: ${JSON.stringify(coverSrc, null, 2)}`);
      writeDebug('--------------------');

      // Save the author image
      let authorImg;
      let authorImgSrc;
      writeDebug(`imageStorageOn: ${imageStorageOn}`);
      if (!imageStorageOn) {
        authorImg = dataFromAa.authorImg;
        authorImgSrc = dataFromAa.authorImg;
      } else {
        writeLog.info('save the author image...');
        authorImg = initialData.authorImg;
        authorImgSrc = initialData.authorImgSrc;
        const authorImgFound = dataFromAa.authorImg;
        let authorFormatted = null;
        if (Array.isArray(dataFromLl.authors) && dataFromLl.authors.length === 1) {
          authorFormatted = formatFileName(dataFromLl.authors[0]);
        }
        if (!authorFormatted
        && Array.isArray(dataFromAa.authors) && dataFromAa.authors.length === 1) {
          authorFormatted = formatFileName(dataFromAa.authors[0]);
        }

        try {
          writeDebug(`initialData.authorImg: ${authorImg}`);
          writeDebug(`initialData.authorImgSrc: ${authorImgSrc}`);
          writeDebug(`authorImgFound: ${authorImgFound}`);
          writeDebug(`dataFromLl.authors: ${JSON.stringify(dataFromLl.authors, null, 2)}`);
          writeDebug(`dataFromAa.authors: ${JSON.stringify(dataFromAa.authors, null, 2)}`);
          writeDebug(`authorFormatted: ${authorFormatted}`);

          let authorImgExists = fs.existsSync(authorImg);
          writeDebug(`authorImgExists: ${authorImgExists}`);

          if (!authorFormatted
          || !authorImgFound
          || !(authorImg && authorImgExists)
          || authorImgSrc !== authorImgFound) {
            writeDebug('delete the author img path since the image does not exist or has been changed');
            authorImg = null;
            authorImgSrc = null;
            authorImgExists = false;
            writeDebug(`authorImg: ${authorImg}`);
            writeDebug(`authorImgSrc: ${authorImgSrc}`);
            writeDebug(`authorImgExists: ${authorImgExists}`);
          }

          if (authorFormatted && authorImgFound) {
            if (!authorImgExists) {
              const pageImage = await browser.newPage();
              const savedImage = await saveImage({
                page: pageImage,
                imageUrl: authorImgFound,
                folderPath: FOLDER_WITH_AUTHOR_IMAGES,
                fileName: authorFormatted,
              });
              await pageImage.close();

              writeDebug(`savedImage: ${JSON.stringify(savedImage, null, 2)}`);
              authorImg = !savedImage.error ? savedImage.imagePath : null;
              authorImgSrc = authorImg ? authorImgFound : null;
              toSaveInTempFile = true;
              if (savedImage.error) {
                hasErrors.push(savedImage.error);
              }
            } else {
              writeLog.log('the author image already exists');
            }
          } else {
            writeLog.log('lack of info to save the author image');
          }
        } catch (catchError) {
          const authorImgError = `An error occurred while saving the author image for: ${id || 'no ID'}`;
          hasErrors.push(authorImgError);
          writeLog.alert(authorImgError);
          writeLog.error(catchError);
          authorImg = null;
          authorImgSrc = null;
        }
      }
      writeDebug(`authorImg: ${JSON.stringify(authorImg, null, 2)}`);
      writeDebug(`authorImgSrc: ${JSON.stringify(authorImgSrc, null, 2)}`);
      writeDebug('--------------------');

      // Save the images
      let images;
      let imagesSrc;
      const imageFolderPath = path.join(FOLDER_WITH_BOOK_IMAGES, id || 'null');
      writeDebug(`imageStorageOn: ${imageStorageOn}`);
      if (!imageStorageOn) {
        images = dataFromAa.images;
        imagesSrc = dataFromAa.images;
      } else {
        writeLog.info('save the images...');
        images = Array.isArray(initialData.images) ? initialData.images : [];
        imagesSrc = Array.isArray(initialData.imagesSrc) ? initialData.imagesSrc : [];
        let imagesFound = null;
        imagesFound = Array.isArray(dataFromAr.images) && dataFromAr.images.length > 1
          ? dataFromAr.images
          : imagesFound;
        imagesFound = Array.isArray(dataFromLl.images) && dataFromLl.images.length > 1
          ? dataFromLl.images
          : imagesFound;
        imagesFound = Array.isArray(dataFromAa.images) && dataFromAa.images.length > 1
          ? dataFromAa.images
          : imagesFound;

        try {
          writeDebug(`id: ${id}`);
          writeDebug(`initialData.images: ${JSON.stringify(images, null, 2)}`);
          writeDebug(`initialData.imagesSrc: ${JSON.stringify(imagesSrc, null, 2)}`);
          writeDebug(`imagesFound: ${JSON.stringify(imagesFound, null, 2)}`);

          writeDebug(`imageFolderPath: ${imageFolderPath}`);
          let imageFolderExists = false;
          let numberOfExistingImages = 0;
          if (id) {
            imageFolderExists = fs.existsSync(imageFolderPath);
            if (imageFolderExists) {
              const allImages = fs.readdirSync(imageFolderPath);
              numberOfExistingImages = allImages.length;
            }
            if (imageFolderExists && numberOfExistingImages === 0) {
              writeDebug('the image folder exists but it is empty');
              imageFolderExists = false;
            }
          }
          writeDebug(`imageFolderExists: ${imageFolderExists}`);
          writeDebug(`numberOfExistingImages: ${numberOfExistingImages}`);
          writeDebug(`imagesFound.length: ${Array.isArray(imagesFound) ? imagesFound.length : null}`);

          if (!id
          || !imagesFound
          || !(images.length > 0 && imageFolderExists)
          || imagesSrc[0] !== imagesFound[0]
          || imagesSrc.length !== imagesFound.length
          || numberOfExistingImages !== imagesFound.length) {
            writeDebug('delete the image paths since the images does not exist or have been changed');
            images = null;
            imagesSrc = null;
            imageFolderExists = false;
            if (fs.existsSync(imageFolderPath)) {
              rimraf.sync(imageFolderPath);
            }
            writeDebug(`images: ${JSON.stringify(images, null, 2)}`);
            writeDebug(`imagesSrc: ${JSON.stringify(imagesSrc, null, 2)}`);
            writeDebug(`imageFolderExists: ${imageFolderExists}`);
          }

          if (id && imagesFound) {
            if (!imageFolderExists) {
              if (fs.existsSync(imageFolderPath)) {
                rimraf.sync(imageFolderPath);
              }
              await createFolder(imageFolderPath, { displayLogs: false });

              const pageImage = await browser.newPage();
              let errorSavingImages = null;
              writeDebug('save the images...');
              for (let imageIndex = 0; imageIndex < imagesFound.length; imageIndex += 1) {
                const savedImage = await saveImage({
                  page: pageImage,
                  imageUrl: imagesFound[imageIndex],
                  folderPath: imageFolderPath,
                  fileName: `${id}~${imageIndex}`,
                  displayLogs: false,
                });
                writeDebug(`savedImage: ${JSON.stringify(savedImage, null, 2)}`);
                if (!savedImage.error) {
                  if (Array.isArray(images)) {
                    images.push(savedImage.imagePath);
                  } else {
                    images = [savedImage.imagePath];
                  }
                  if (Array.isArray(imagesSrc)) {
                    imagesSrc.push(imagesFound[imageIndex]);
                  } else {
                    imagesSrc = [imagesFound[imageIndex]];
                  }
                }
                errorSavingImages = savedImage.error || errorSavingImages;
              }
              await pageImage.close();

              if (!errorSavingImages) {
                writeLog.success('Images saved successfully in:', imageFolderPath);
              } else {
                images = null;
                imagesSrc = null;
                hasErrors.push(errorSavingImages);
                if (fs.existsSync(imageFolderPath)) {
                  rimraf.sync(imageFolderPath);
                }
              }

              toSaveInTempFile = true;
            } else {
              writeLog.log('the images already exist');
            }
          } else {
            writeLog.log('lack of info to save the images');
          }
        } catch (catchError) {
          const imagesError = `An error occurred while saving the images for: ${id || 'no ID'}`;
          hasErrors.push(imagesError);
          writeLog.alert(imagesError);
          writeLog.error(catchError);
          images = null;
          imagesSrc = null;
          if (fs.existsSync(imageFolderPath)) {
            rimraf.sync(imageFolderPath);
          }
        }
      }
      writeDebug(`images: ${JSON.stringify(images, null, 2)}`);
      writeDebug(`imagesSrc: ${JSON.stringify(imagesSrc, null, 2)}`);
      writeDebug('--------------------');

      if (hasErrors.length > 0) {
        nbBooksWithError += 1;
      }

      writeLog.dev('merge data...');
      const mergedData = {
        link: initialData.link,
        id,
        ISBN,
        ISBNs: manualAddition.ISBNs || dataFromLl.ISBNs,
        ASIN: manualAddition.ASIN,
        title: manualAddition.title || dataFromLl.title || dataFromAa.title,
        authors: manualAddition.authors
          || (
            Array.isArray(dataFromLl.authors) && dataFromLl.authors.length > 0
              ? dataFromLl.authors : dataFromAa.authors
          ),
        cover: manualAddition.cover || cover,
        coverSrc: manualAddition.cover || coverSrc,
        images: manualAddition.images || images,
        imagesSrc: manualAddition.images || imagesSrc,
        description: manualAddition.description || dataFromLl.description || dataFromAa.description,
        mainCategories:
            initialData.catalog
              ? [initialData.catalog]
              : [],
        subcategories:
          initialData.subcategory
            ? [initialData.subcategory]
            : [],
        catalog: initialData.catalog,
        subcategory: initialData.subcategory,
        releaseDate: manualAddition.releaseDate
          || dataFromLl.releaseDate || dataFromAr.releaseDate || dataFromAa.releaseDate,
        language: initialData.language || '',
        publisher: manualAddition.publisher || dataFromAr.publisher || dataFromLl.publisher,
        collection: manualAddition.collection || dataFromAr.collection || dataFromLl.collection,
        targetAudience: manualAddition.targetAudience || dataFromLl.targetAudience,
        nbOfPages: manualAddition.nbOfPages
          || dataFromLl.nbOfPages || dataFromAr.nbOfPages || dataFromAa.nbOfPages,
        dimensions: manualAddition.dimensions
          || dataFromAa.dimensions || dataFromAr.dimensions || dataFromLl.dimensions,
        excerptLink: manualAddition.excerptLink || dataFromLl.excerptLink,
        downloadLink: manualAddition.downloadLink || dataFromLl.downloadLink,
        seriesPosition: manualAddition.seriesPosition || dataFromLl.seriesPosition,
        seriesName: manualAddition.seriesName || dataFromLl.seriesName,
        seriesCode: manualAddition.seriesCode || dataFromLl.seriesCode,
        authorBio: manualAddition.authorBio || dataFromAa.authorBio,
        authorImg: manualAddition.authorImg || authorImg,
        authorImgSrc: manualAddition.authorImg || authorImgSrc,
        // rating: dataFromRc.rating,
        // nbOfVotes: dataFromRc.nbOfVotes,
        // nbOfLikes: dataFromRc.nbOfLikes,
        // nbOfComments: dataFromRc.nbOfComments,
        // commentIframeSrc: dataFromRc.commentIframeSrc,
        // ratingLink: dataFromRc.link,
        dateAdded: manualAddition.dateAdded || '',
        sellers,
        dataFromLl: { ...dataFromLl, pageContent: '' },
        dataFromAa: { ...dataFromAa, pageContent: '' },
        dataFromAr: { ...dataFromAr, pageContent: '' },
        manualAddition: { ...manualAddition },
        // dataFromRc: { ...dataFromRc, pageContent: '' },
        hasErrors: hasErrors.length > 0 ? hasErrors : '',
      };
      const debugMergedData = { ...mergedData };
      delete debugMergedData.dataFromLl;
      delete debugMergedData.dataFromAa;
      delete debugMergedData.dataFromAr;
      delete debugMergedData.dataFromRc;
      delete debugMergedData.manualAddition;
      writeDebug(`debugMergedData: ${JSON.stringify(debugMergedData, null, 2)}`);
      writeDebug('--------------------');

      const dataToExcel = formatBookToExcel(mergedData);

      if (useSavedPage) {
        mergedData.dataFromLl = dataFromLl;
        mergedData.dataFromAa = dataFromAa;
        mergedData.dataFromAr = dataFromAr;
        // mergedData.dataFromRc = dataFromRc;
        mergedData.manualAddition = manualAddition;
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
      path.join(folderWithBookData, path.basename(linkFile.replace('.json', '.xlsx'))),
    );

    if (exportToPublic) {
      writeLog.log('clean data for the public JSON...');
      const dataToPublic = [];
      allDataFromThisFile.forEach((book) => {
        const publicBook = formatBookToPublic(book);
        if (Object.keys(publicBook).length > 0) {
          dataToPublic.push(publicBook);
        }
      });
      exportJsonFile(
        dataToPublic,
        path.join(FOLDER_WITH_BOOK_DATA_PUBLIC, jsonToExportName),
      );
    }

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
  writeLog.info('Folder with book data:', folderWithBookData);
  if (exportToPublic) {
    writeLog.info('Folder with public data:', FOLDER_WITH_BOOK_DATA_PUBLIC);
  }
  if (imageStorageOn) {
    writeLog.info('Folder with cover images:', FOLDER_WITH_BOOK_COVERS);
    writeLog.info('Folder with author images:', FOLDER_WITH_AUTHOR_IMAGES);
    writeLog.info('Folder with book images:', FOLDER_WITH_BOOK_IMAGES);
  }
  if (nbBooksWithError > 0) {
    writeLog.error('Number of books with error:', nbBooksWithError);
  }
  writeLog.success('Scraping finished!');
  await happyStickFigure();
}

module.exports = scrapeBooks;
