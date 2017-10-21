var Parse = {

  // 压缩JSON
  compress: function (source) {
    var index = 0, length = source.length, symbol, position, result = ""
    while (index < length) {
      symbol = source[index];
      if ("\t\r\n ".indexOf(symbol) > -1) {
        // Skip whitespace tokens.
        index++;
      } else if (symbol == "/") {
        symbol = source[++index];
        if (symbol == "/") {
          // Line comment.
          position = source.indexOf("\n", index);
          if (position < 0) {
            position = source.indexOf("\r", index);
          }
          index = position < 0 ? length : position;
        } else if (symbol == "*") {
          // Block comment.
          position = source.indexOf("*/", index);
          if (position < 0) {
            throw SyntaxError("Unterminated block comment.");
          }
          // Advance the scanner position past the end of the comment.
          index = position += 2;
        } else {
          throw SyntaxError("Invalid comment.");
        }
      } else if (symbol == '"') {
        // Save the current scanner position.
        position = index;
        // Parse JavaScript strings separately to ensure that comment tokens
        // within them are preserved correctly.
        while (index < length) {
          symbol = source[++index];
          if (symbol == "\\") {
            // Advance the scanner past escaped characters.
            index++;
          } else if (symbol == '"') {
            // An unescaped double-quote character marks the end of the string.
            break;
          }
        }
        if (source[index] == '"') {
          result += source.slice(position, ++index);
        } else {
          throw SyntaxError("Unterminated string.");
        }
      } else {
        result += symbol;
        index++;
      }
    }
    return result;
  }
}