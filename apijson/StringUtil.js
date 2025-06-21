/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/CVAuto)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use StringUtil file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.*/


/**util for string
 * @author Lemon
 */
var StringUtil = {
  TAG: 'StringUtil',

  /**获取string,为null则返回''
   * @param s
   * @return
   */
  get: function(s) {
    return s == null ? '' : (JSONResponse.isString(s) ? s : JSON.stringify(s));
  },

  /**获取去掉前后空格后的string,为null则返回''
   * @param s
   * @return
   */
  trim: function(s) {
    return StringUtil.get(s).trim();
  },

  /**获取去掉所有空格后的string,为null则返回''
   * @param s
   * @return
   */
  noBlank: function(s) {
    return s == null ? '' : s.replace(/ /g, '');
  },

  /**判断字符是否为空
   * @param s
   * @param trim
   * @return
   */
  isEmpty: function(s, trim) {
    if (s == null) {
      return true;
    }
    if (s instanceof Array) {
      return s.length <= 0;
    }
    if (s instanceof Object) {
      return Object.keys(s).length <= 0;
    }
    if (typeof s == 'boolean') {
      return s != true;
    }
    if (typeof s == 'number') {
      return s <= 0;
    }

    if (trim) {
      s = s.trim();
    }
    return s.length <= 0;
  },

  isNotEmpty: function(s, trim) {
    return ! this.isEmpty(s, trim);
  },

  /**判断是否为代码名称，只能包含字母，数字或下划线
   * @param s
   * @return
   */
  isName(s) {
    return s != null && s.length > 0 && /[a-zA-Z_]/.test(s.substring(0, 1)) && /^[0-9a-zA-Z_]+$/.test(s);
  },

  /**判断是否为代码名称，只能包含字母，数字或下划线
   * @param s
   * @return
   */
  isBigName(s) {
    return s != null && s.length > 0 && /[A-Z]/.test(s.substring(0, 1)) && /^[0-9a-zA-Z_]+$/.test(s);
  },

  /**判断是否为代码名称，只能包含字母，数字或下划线
   * @param s
   * @return
   */
  isSmallName(s) {
    return s != null && s.length > 0 && /[a-z]/.test(s.substring(0, 1)) && /^[0-9a-zA-Z_]+$/.test(s);
  },

  isConstName(s) {
    return s != null && s.length > 0 && /[A-Z_]/.test(s.substring(0, 1)) && /^[0-9A-Z_]+$/.test(s);
  },


  /**添加后缀
   * @param key
   * @param suffix
   * @return key + suffix，第一个字母小写
   */
  addSuffix: function(key, suffix) {
    key = StringUtil.noBlank(key);
    if (key == '') {
      return StringUtil.firstCase(suffix);
    }
    return StringUtil.firstCase(key) + StringUtil.firstCase(suffix, true);
  },

  /**首字母大写或小写
   * TODO upper == null 时不处理，false 小写，true 大写
   * @param key
   * @param upper
   * @return
   */
  firstCase: function(key, upper) {
    key = StringUtil.get(key);
    if (key == '') {
      return '';
    }

    const first = key.substring(0, 1);
    key = (upper ? first.toUpperCase() : first.toLowerCase()) + key.substring(1, key.length);

    return key;
  },

  /**全部大写
   * @param s
   * @param trim
   * @return
   */
  toUpperCase: function(s, trim) {
    s = trim ? StringUtil.trim(s) : StringUtil.get(s);
    return s.toUpperCase();
  },
  /**全部小写
   * @param s
   * @return
   */
  toLowerCase: function(s, trim) {
    s = trim ? StringUtil.trim(s) : StringUtil.get(s);
    return s.toLowerCase();
  },

  split: function (s, separator, trim) {
    if (StringUtil.isEmpty(s, trim)) {
      return null;
    }

    if (trim) {
      s = s.trim();
    }

    if (separator == null) {
      separator = ',';
    }

    if (trim) {
      while (s.startsWith(separator)) {
        s = s.substring(1);
      }
      while (s.endsWith(separator)) {
        s = s.substring(0, s.length - 1);
      }
    }

    if (s.indexOf(separator) < 0) {
      return [s];
    }

    return s.split(separator);
  },

  isNumber: function (s) {
    return typeof s == 'string' && /^[0-9]+$/.test(s);
  },

  join: function (arr, separator) {
    return arr == null ? '' : arr.join(separator);
  },
  length: function (s) {
    return s == null ? 0 : s.length;
  },
  limitLength: function (s, maxLen, ellipsize) {
    var l = StringUtil.length(s);
    if (maxLen == null || maxLen <= 0 || l <= maxLen) {
      return s;
    }
    if (ellipsize == 'start') {
      return '..' + s.substring(l - maxLen);
    }
    if (ellipsize == 'middle') {
      var m = Math.floor(maxLen/2);
      return s.substring(0, m) + '..' + s.substring(l - m);
    }
    return s.substring(0, maxLen) + '..';
  },

  isUri: function (s) {
    var ind = s == null ? -1 : s.indexOf('://');
    return ind > 0;
  },
  isUrl: function (s, schemas) {
    var ind = s == null ? -1 : s.indexOf('://');
    if (ind <= 0) {
      return false;
    }
    var schema = s.substring(0, ind);
    if (schemas != null && schemas.indexOf(schema) < 0) {
      return false;
    }

    var rest = s.substring(ind + 3);
    var ind2 = rest.indexOf('/');
    ind2 = ind2 >= 0 ? ind2 : rest.indexOf('?');
    var host = ind2 < 0 ? rest : rest.substring(0, ind2);
    var arr = StringUtil.split(host, '.');
    if (arr == null || arr.length <= 1) {
      return false;
    }

    for (var i = 0; i < arr.length; i ++) {
      if (StringUtil.isName(arr[i]) != true) {
        return false;
      }
    }

    return true;
  },

  isHttpUrl: function (s) {
    return StringUtil.isUrl(s, ['http', 'https']);
  },
  isRpcUrl: function (s) {
    return StringUtil.isUrl(s) && ! this.isHttpUrl(s);
  },
  isFileUrl: function (s) {
    return StringUtil.isUrl(s, ['file']);
  },
  isPath: function (s) {
    var arr = StringUtil.split(s, '/');
    if (arr == null || arr.length <= 1) {
      return false;
    }

    for (var i = 0; i < arr.length; i ++) {
      if (StringUtil.isName(arr[i]) != true) {
        return false;
      }
    }

    return true;
  },
  isPackage: function (s) {
    var arr = StringUtil.split(s, '.');
    if (arr == null || arr.length <= 1) {
      return false;
    }

    for (var i = 0; i < arr.length; i ++) {
      if (StringUtil.isName(arr[i]) != true) {
        return false;
      }
    }

    return true;
  },
  isMonth: function (s) {
    try {
      if (/\d{4}-\d{1,2}/g.test(s) != true) {
        return false;
      }

      var date = new Date(s);
      return date.getMonth() > 0 && date.getDay() == 0 && date.getHours() == 0
          && date.getMinutes() == 0 && date.getSeconds() == 0 && date.getMilliseconds() == 0;
    }
    catch (e) {
      log(e)
    }
    return false;
  },
  isDate: function (s) {
    try {
      if (/\d{4}-\d{1,2}-\d{1,2}/g.test(s) != true) {
        return false;
      }

      var arr = StringUtil.split(s, '-');
      if (arr == null || arr.length != 3) {
        return false;
      }

      for (var i = 0; i < arr.length; i ++) {
        if ([null, 0].indexOf(Number.parseInt(arr[i])) >= 0) {
          return false;
        }
      }

      var date = new Date(s);
      return date.getDay() > 0 && date.getHours() == 0
          && date.getMinutes() == 0 && date.getSeconds() == 0 && date.getMilliseconds() == 0;
    }
    catch (e) {
      log(e)
    }
    return false;
  },
  isMinute: function (s) {
    try {
      if (/\d{1,2}:\d{1,2}/g.test(s) != true) {
        return false;
      }

      var date = new Date(s);
      return date.getDay() <= 0 && date.getTime() % 60*1000 == 0;
    }
    catch (e) {
      log(e)
    }
    return false;
  },
  isTime: function (s) {
    try {
      if (/\d{1,2}:\d{1,2}:\d{1,2}/g.test(s) != true) {
        return false;
      }

      var date = new Date(s);
      return date.getDay() <= 0 && date.getTime() % 1000 > 0;
    }
    catch (e) {
      log(e)
    }
    return false;
  },
  isDatetime: function (s) {
    try {
      var date = new Date(s);
      return date.getDay() > 0 && date.getTime() % 1000 > 0;
    }
    catch (e) {
      log(e)
    }
    return false;
  },
  isFileUri: function (s) {
    return s != null && s.startsWith('file://') && StringUtil.isPath(s.substring('file://'.length));
  },
  isFile: function (s) {
    var ind = s == null ? -1 : s.lastIndexOf('.');
    var prefix = s.substring(0, ind);
    var suffix = StringUtil.toLowerCase(s.substring(ind + 1));
    return StringUtil.isName(suffix) && StringUtil.isNotEmpty(prefix, true);
  },
  isImage: function (s) {
    var ind = s == null ? -1 : s.lastIndexOf('.');
    var prefix = s.substring(0, ind);
    var suffix = StringUtil.toLowerCase(s.substring(ind + 1));

    return ['jpg', 'jpeg', 'png', 'bmp', 'gif'].indexOf(suffix) >= 0 && StringUtil.isNotEmpty(prefix, true);
  },
  isAudio: function (s) {
    var ind = s == null ? -1 : s.lastIndexOf('.');
    var prefix = s.substring(0, ind);
    var suffix = StringUtil.toLowerCase(s.substring(ind + 1));

    return ['mp3', 'wav', 'flac', 'ogg', 'aiff'].indexOf(suffix) >= 0 && StringUtil.isNotEmpty(prefix, true);
  },
  isVideo: function (s) {
    var ind = s == null ? -1 : s.lastIndexOf('.');
    var prefix = s.substring(0, ind);
    var suffix = StringUtil.toLowerCase(s.substring(ind + 1));

    return ['mp4', 'mov', 'flv', 'rm', 'fmvb', 'wmv', 'asf', 'asx', '3gp', 'dvd', 'avi'].indexOf(suffix) >= 0 && StringUtil.isNotEmpty(prefix, true);
  },
  isImageHttpUrl: function (s) {
    return StringUtil.isImage(s) && StringUtil.isHttpUrl(s);
  },
  isAudioHttpUrl: function (s) {
    return StringUtil.isAudio(s) && StringUtil.isHttpUrl(s);
  },
  isVideoHttpUrl: function (s) {
    return StringUtil.isVideo(s) && StringUtil.isHttpUrl(s);
  },
  isImageFilePath: function (s) {
    return StringUtil.isImage(s) && StringUtil.isFileUrl(s);
  },
  isAudioFilePath: function (s) {
    return StringUtil.isAudio(s) && StringUtil.isFileUrl(s);
  },
  isVideoFilePath: function (s) {
    return StringUtil.isVideo(s) && StringUtil.isFileUrl(s);
  },

  isBoolKey: function (key) {
     if (StringUtil.isEmpty(key, true) || key.length < 3) {
        return false;
     }
     if (key.toLowerCase().startsWith('enable') || key.toLowerCase().startsWith('disable')
       || StringUtil.isKeyOfCategory(key, 'bool') || StringUtil.isKeyOfCategory(key, 'boolean')) {
        return true;
     }

     var k = key.substring(2, 3);
     if (StringUtil.isEmpty(k, true)) {
       return false;
     }

     return ((key.startsWith('is') || key.startsWith('Is')) && /[a-z]/g.test(k) != true)
      || (key.startsWith('IS') && /[A-Za-z]/g.test(k) != true);
  },
  isIntKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Int') || StringUtil.isKeyOfCategory(key, 'Integer');
  },
  isLongKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Long');
  },
  isFloatKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Float');
  },
  isDoubleKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Double');
  },
  isDecimalKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Decimal');
  },
  isNumKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Num') || StringUtil.isKeyOfCategory(key, 'Number') || StringUtil.isKeyOfCategory(key, 'No');
  },
  isStrKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Str') || StringUtil.isKeyOfCategory(key, 'String')
      || StringUtil.isKeyOfCategory(key, 'Txt') || StringUtil.isKeyOfCategory(key, 'Text')
      || StringUtil.isKeyOfCategory(key, 'Msg') || StringUtil.isKeyOfCategory(key, 'Message')
      || StringUtil.isKeyOfCategory(key, 'Title') || StringUtil.isKeyOfCategory(key, 'Content')
      || StringUtil.isKeyOfCategory(key, 'Hint') || StringUtil.isKeyOfCategory(key, 'Alert')
      || StringUtil.isKeyOfCategory(key, 'Remind') || StringUtil.isKeyOfCategory(key, 'Description')
      || StringUtil.isKeyOfCategory(key, 'Detail') || StringUtil.isKeyOfCategory(key, 'Annotation');
  },
  isObjKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Obj') || StringUtil.isKeyOfCategory(key, 'Object');
  },
  isMapKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Map') || StringUtil.isKeyOfCategory(key, 'Table');
  },
  isDictKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Dict') || StringUtil.isKeyOfCategory(key, 'Dictionary');
  },
  isArrKey: function (key) {
     if (StringUtil.isKeyOfCategory(key, 'Arr') || StringUtil.isKeyOfCategory(key, 'Array')) {
       return true;
     }

     var k = key == null || key.length < 3 ? null : key.substring(key.length - 3, key.length - 1);
     if (StringUtil.isEmpty(k, true)) {
       return false;
     }

     return (key.endsWith('s') && /^[a-z]+$/g.test(k)) || (key.endsWith('S') && /^[A-Z]+$/g.test(k));
  },
  isListKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'List');
  },
  isSetKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Set');
  },
  isCollectionKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Collection') || StringUtil.isArrKey(key) || StringUtil.isListKey(key) || StringUtil.isSetKey(key);
  },
  isHashKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Hash');
  },
  isIdKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Id');
  },
  isSizeKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Size');
  },
  isCountKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Count');
  },
  isPageKey: function (key) {
    return StringUtil.isKeyOfCategory(key, 'Page');
  },
  isTotalKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Total');
  },
  isCapKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Cap') || StringUtil.isKeyOfCategory(key, 'Capacity');
  },
  isLevelKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Level');
  },
  isGradeKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Grade');
  },
  isScoreKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Score');
  },
  isSexKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Sex');
  },
  isGenderKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Gender');
  },
  isAmountKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Amount');
  },
  isMoneyKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Money');
  },
  isBalanceKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Balance');
  },
  isLoanKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Loan');
  },
  isPriceKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Price');
  },
  isPercentKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Percent');
  },
  isRevenueKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Revenue');
  },
  isProfitKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Profit');
  },
  isCashKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Cash');
  },
  isDiscountKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Discount');
  },
  isLongitudeKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Longitude');
  },
  isLatitudeKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Latitude');
  },
  isNameKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Name');
  },
  isPathKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Path');
  },
  isUrlKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Url');
  },
  isUriKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Uri');
  },
  isDateKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Date');
  },
  isTimeKey: function (key) {
     return StringUtil.isKeyOfCategory(key, 'Time');
  },
  isKeyOfCategory: function (key, category) {
     if (StringUtil.isEmpty(key, true) || StringUtil.isEmpty(category, true) || key.length < category.length) {
       return false;
     }

     var lowerCate = category.toLowerCase();
     var upperCate = category.toUpperCase();
     var bigCate = StringUtil.firstCase(lowerCate, true);
     if (key.endsWith(bigCate) || key == lowerCate || key == upperCate) {
       return true;
     }

     var len = key.length;
     var k = len <= category.length ? null : key.substring(len - 3, len - 2);
     if (StringUtil.isEmpty(k, true)) {
       return false;
     }

     return (key.endsWith(lowerCate) && /[a-z]/g.test(k) != true)
      || (key.endsWith(upperCate) && /[A-Z]/g.test(k) != true);
  },
  TYPE_CATEGORY_KEYS: {
     'boolean': ['bool', 'boolean'],
     'integer': ['count', 'page', 'size', 'num', 'number', 'no', 'cap', 'capacity', 'height', 'width', 'depth'],
     'number': ['float', 'double', 'price', 'amount', 'money', 'rest', 'balance', 'loan', 'discount', 'cash', 'cashback', 'weight', 'longitude', 'latitude'],
     'string': [
       'str', 'string', 'txt', 'text', 'title', 'detail'
     ],
     'array': [
       'arr', 'array', 'list', 'set', 'collection', 'slice'
     ],
     'object': [
       'obj', 'object', 'dict', 'map', 'table'
     ]
  },
  CATEGORY_MAP: { // from TYPE_CATEGORY_KEYS
//    'count': 'integer'
  }

};

if (typeof module == 'object') {
  module.exports = StringUtil;
}

//校正（自动补全等）字符串>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
