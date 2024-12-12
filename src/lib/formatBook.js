function formatBookToExcel(book) {
  const dataToExcel = {};
  Object.keys(book).forEach((key) => {
    const value = book[key];
    dataToExcel[key] = value ? JSON.stringify(value, null, 2) : '';
  });
  dataToExcel.link = book.link;
  return dataToExcel;
}

function formatBookToPublic(book) {
  const publicBook = { ...book };
  delete publicBook.link;
  delete publicBook.coverSrc;
  delete publicBook.authorImgSrc;
  delete publicBook.imagesSrc;
  delete publicBook.catalog;
  delete publicBook.subcategory;
  delete publicBook.dataFromLl;
  delete publicBook.dataFromAa;
  delete publicBook.dataFromAr;
  delete publicBook.dataFromRc;
  delete publicBook.hasManualAdd;
  delete publicBook.manualAddition;
  delete publicBook.hasErrors;
  return publicBook;
}

module.exports = {
  formatBookToExcel,
  formatBookToPublic,
};
