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
  isTableKey: function(key) {
    log(this.TAG, 'isTableKey  typeof key = ' + (typeof key));
    return key != null && /^[A-Z][A-Za-z0-9_]*$/.test(key);
  },
  /**判断key是否为数组名
   * @param key
   * @return
   */
  isArrayKey: function(key) {
    log(this.TAG, 'isArrayKey  typeof key = ' + (typeof key));
    return key != null && key.endsWith('[]');
  }

}

//TODO 取消注释  Object.freeze(JSONObject) //不可修改