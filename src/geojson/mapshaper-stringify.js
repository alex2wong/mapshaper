/* @requires mapshaper-common */

MapShaper.getFormattedStringify = function(numArrayKeys) {
  var keyIndex = utils.arrayToIndex(numArrayKeys);
  var sentinel = '\u1000\u2FD5\u0310';
  var stripRxp = new RegExp('"' + sentinel + '|' + sentinel + '"', 'g');
  var indentChars = '\t';

  function replace(key, val) {
    // We want to format numerical arrays like [1, 2, 3] instead of
    // the way JSON.stringify() behaves when applying indentation.
    // This kludge converts arrays to strings with sentinel strings inside the
    // surrounding quotes. At the end, the sentinel strings and quotes
    // are replaced by array brackets.
    if (key in keyIndex && utils.isArray(val)) {
      var str = JSON.stringify(val);
      // make sure the array does not contain any strings
      if (str.indexOf('"' == -1)) {
        return sentinel + str.replace(/,/g, ', ') + sentinel;
      }
    }
    return val;
  }

  return function(obj) {
    var json = JSON.stringify(obj, replace, indentChars);
    return json.replace(stripRxp, '');
  };
};
