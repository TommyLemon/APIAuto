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
    return StringUtil.get(s).trim();
  },

  /**获取去掉所有空格后的string,为null则返回''
   * @param s
   * @return
   */
  noBlank: function(s) {
    return StringUtil.get(s).replace(/ /g, '');
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
    if (s == '') {
      return true;
    }

    return false;
  },

  /**判断是否为代码名称，只能包含字母，数字或下划线
   * @param s
   * @return
   */
  isName(s) {
    return s != null && /^[0-9a-zA-Z_]+$/.test(s);
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

  split: function (s, separator) {
    if (s == null) {
      return null;
    }

    if (separator == null) {
      separator = ',';
    }

    if (s.indexOf(separator) < 0) {
      return [s];
    }

    return s.split(separator)
  }

}

//校正（自动补全等）字符串>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>