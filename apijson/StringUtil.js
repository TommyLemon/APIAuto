/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/APIAuto)

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
    return s == null ? '' : s;
  },

  /**获取去掉前后空格后的string,为null则返回''
   * @param s
   * @return
   */
  trim: function(s) {
    return s == null ? '' : s.trim();
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
    if (s == null) {
      return null;
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

    return s.split(separator)
  },

  isNumber: function (s) {
    return typeof s == 'string' && /^[0-9]+$/.test(s);
  },

  join: function (arr, separator) {
    return arr == null ? '' : arr.join(separator)
  }

};

if (typeof module == 'object') {
  module.exports = StringUtil;
}

//校正（自动补全等）字符串>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
