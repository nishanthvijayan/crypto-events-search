function isNonEmptyArray(arr) {
  return arr && Array.isArray(arr) && arr.length > 0;
}

module.exports = { isNonEmptyArray };
