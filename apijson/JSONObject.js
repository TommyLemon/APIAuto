/*Copyright ©2017 TommyLemon(https://github.com/TommyLemon/APIAuto)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.*/


/**common keys and functions for APIJSON object
 * @author Lemon
 */
var JSONObject = {
  TAG: 'JSONObject',

  /**判断key是否为表名
   * @param key
   * @return
   */
  isTableKey: function(key, value, isRestful) {
    log(this.TAG, 'isTableKey  typeof key = ' + (typeof key));
    if (key == null) {
      return false;
    }

    if (value != null && typeof value != 'object') {
      return false;
    }

    if (isRestful == true) {
      return true;
    }

    return  /^[A-Z][A-Za-z0-9_]*$/.test(key);
  },
  /**判断key是否为数组名
   * @param key
   * @return
   */
  isArrayKey: function(key, value, isRestful) {
    log(this.TAG, 'isArrayKey  typeof key = ' + (typeof key));

    if (key == null) {
      return false;
    }

    if (isRestful == true) {
      return value == null || typeof value == 'array';
    }

    if (value != null && value instanceof Object == false) {
      return false;
    }

    return key.endsWith('[]');
  },

  isAPIJSONPath: function (method) {
    var info = JSONObject.parseUri(method, true)
    return info != null && info.isRestful != true;
  },

  parseUri: function (method, isReq) {
    method = method || 'get';
    var isRestful = true;

    if (method.startsWith("/")) {
      method = method.substring(1);
    }

    if (method.endsWith("/")) {
      method = method.substring(0, method.length - 1);
    }

    var startName = null;
    var tag = null;

    var mIndex = method.lastIndexOf('/');
    if (mIndex < 0) {
      isRestful = APIJSON_METHODS.indexOf(method) < 0;
    }
    else if (APIJSON_METHODS.indexOf(method.substring(mIndex+1)) >= 0) {
      isRestful = false;
      method = method.substring(mIndex+1);
    }
    else {
      var suffix = method.substring(mIndex + 1);
      method = method.substring(0, mIndex);

      mIndex = method.lastIndexOf("/");
      if (mIndex >= 0) {
        method = method.substring(mIndex+1);
      }

      isRestful = APIJSON_METHODS.indexOf(method) < 0;

      if (isReq && ! isRestful) {
        tag = suffix;
        var tbl = tag.endsWith("[]") ? tag.substring(0, tag.length - 2) : tag;
        if (JSONObject.isTableKey(tbl)) {
          startName = method == 'put' || method == 'delete' ? tbl : tag;
        }
      }
    }

    return {
      method,
      isRestful,
      tag,
      table: startName
    }
  }

}

//TODO 取消注释  Object.freeze(JSONObject) //不可修改