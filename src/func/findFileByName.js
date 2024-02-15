const fs = require('fs');
const path = require('path');
const { writeLog } = require('useful-toolbox-js');

const { normalize } = require('./formatData');

function findFileByName(name, folderPath) {
  writeLog.step('Find a file by name:', name);
  writeLog.step('in the folder:', folderPath);

  let fileFound = null;

  const normalizedName = normalize(name);
  writeLog.debug(`normalizedName: ${normalizedName}`);

  try {
    const folderFiles = fs.readdirSync(folderPath);

    folderFiles.forEach((file) => {
      const normalizedFile = normalize(file);

      if (normalizedFile.includes(normalizedName)) {
        fileFound = path.join(folderPath, file);
        writeLog.debug(`normalizedFile.includes(normalizedName): ${file}`);
      }
    });
  } catch (error) {
    writeLog.error('An error occurred while reading the folder:', folderPath);
    writeLog.error(error);
    writeLog.error('process.exit();');
    process.exit();
  }

  if (fileFound) {
    writeLog.success('File found:', fileFound);
  } else {
    writeLog.error('No file found for:', normalizedName);
    writeLog.error('process.exit();');
    process.exit();
  }

  return fileFound;
}

module.exports = findFileByName;
