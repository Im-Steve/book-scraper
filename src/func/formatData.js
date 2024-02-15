function normalize(text) {
  if (typeof text !== 'string') {
    return text;
  }

  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatPath(path) {
  if (typeof path !== 'string') {
    return path;
  }

  return path
    .trim()
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/\//g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

module.exports = {
  formatPath,
  normalize,
};
