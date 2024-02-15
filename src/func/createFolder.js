const fs = require('fs');
const { writeLog } = require('useful-toolbox-js');

async function createFolder(folderPath) {
  writeLog.step('Create the folder:', folderPath);

  try {
    if (fs.existsSync(folderPath)) {
      writeLog.success('The folder already exists');
    } else {
      await fs.promises.mkdir(folderPath);
      writeLog.success('Folder created successfully');
    }
  } catch (error) {
    writeLog.error('An error occurred while creating the folder:', folderPath);
    writeLog.error(error);
    writeLog.error('process.exit();');
    process.exit();
  }
}

module.exports = createFolder;
