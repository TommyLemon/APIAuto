/**
 * 解析 Charles .chls（Java 序列化）并转成 APIAuto Document 记录。
 * 会话树按 Host/Path 分组，调用顺序以 Transaction.startTime 为准。
 */
var CHARLES_SESSION_FILE = 'Charles_apijson_session.chls'

var TC_NULL = 0x70
var TC_REFERENCE = 0x71
var TC_CLASSDESC = 0x72
var TC_OBJECT = 0x73
var TC_STRING = 0x74
var TC_ARRAY = 0x75
var TC_CLASS = 0x76
var TC_BLOCKDATA = 0x77
var TC_ENDBLOCKDATA = 0x78
var TC_RESET = 0x79
var TC_BLOCKDATALONG = 0x7A
var TC_LONGSTRING = 0x7C
var TC_ENUM = 0x7E
var SC_WRITE_METHOD = 0x01
var SC_SERIALIZABLE = 0x02
var SC_EXTERNALIZABLE = 0x04
var SC_BLOCK_DATA = 0x08
var BASE_WIRE_HANDLE = 0x7E0000

function CharlesJavaIn(bytes) {
  this.bytes = bytes
  this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  this.pos = 0
  this.nextHandle = BASE_WIRE_HANDLE
  this.handles = {}
}

CharlesJavaIn.prototype.assign = function (obj) {
  var handle = this.nextHandle++
  this.handles[handle] = obj
  return handle
}

CharlesJavaIn.prototype.u8 = function () {
  if (this.pos >= this.bytes.length) {
    throw new Error('Charles 会话意外结束，位置 ' + this.pos)
  }
  return this.bytes[this.pos++]
}

CharlesJavaIn.prototype.u16 = function () {
  var n = this.view.getUint16(this.pos, false)
  this.pos += 2
  return n
}

CharlesJavaIn.prototype.i16 = function () {
  var n = this.view.getInt16(this.pos, false)
  this.pos += 2
  return n
}

CharlesJavaIn.prototype.i32 = function () {
  var n = this.view.getInt32(this.pos, false)
  this.pos += 4
  return n
}

CharlesJavaIn.prototype.u32 = function () {
  var n = this.view.getUint32(this.pos, false)
  this.pos += 4
  return n
}

CharlesJavaIn.prototype.i64 = function () {
  var hi = this.i32()
  var lo = this.u32()
  return hi * 4294967296 + lo
}

CharlesJavaIn.prototype.f32 = function () {
  var n = this.view.getFloat32(this.pos, false)
  this.pos += 4
  return n
}

CharlesJavaIn.prototype.f64 = function () {
  var n = this.view.getFloat64(this.pos, false)
  this.pos += 8
  return n
}

CharlesJavaIn.prototype.readBytes = function (len) {
  if (len < 0 || this.pos + len > this.bytes.length) {
    throw new Error('Charles 会话长度不足，需要 ' + len + ' 字节，位置 ' + this.pos)
  }
  var slice = this.bytes.subarray(this.pos, this.pos + len)
  this.pos += len
  return new Uint8Array(slice)
}

CharlesJavaIn.prototype.readUtfRaw = function () {
  var len = this.u16()
  return decodeModifiedUtf8(this.readBytes(len))
}

CharlesJavaIn.prototype.readUtfString = function (isLong) {
  var len = isLong ? this.i64() : this.u16()
  var text = decodeModifiedUtf8(this.readBytes(len))
  this.assign(text)
  return text
}

CharlesJavaIn.prototype.readClassDesc = function () {
  var tc = this.u8()
  if (tc === TC_NULL) {
    return null
  }
  if (tc === TC_REFERENCE) {
    return this.handles[this.i32()]
  }
  if (tc === TC_CLASSDESC) {
    return this.readClassDescBody()
  }
  throw new Error('无法识别的类描述 0x' + tc.toString(16) + '，位置 ' + this.pos)
}

CharlesJavaIn.prototype.readClassDescBody = function () {
  var name = this.readUtfRaw()
  var desc = {
    name: name,
    suid: this.i64(),
    flags: 0,
    fields: [],
    super: null
  }
  this.assign(desc)
  desc.flags = this.u8()
  var count = this.u16()
  for (var i = 0; i < count; i++) {
    var typeCode = String.fromCharCode(this.u8())
    var fieldName = this.readUtfRaw()
    // 对象/数组字段的类型名是 TC_STRING（会占用 handle），不是裸 UTF
    if (typeCode === 'L' || typeCode === '[') {
      this.readContent()
    }
    desc.fields.push({ type: typeCode, name: fieldName })
  }
  this.readContentsUntilEndBlock()
  desc.super = this.readClassDesc()
  return desc
}

CharlesJavaIn.prototype.readContent = function (tc) {
  if (tc == null) {
    tc = this.u8()
  }
  if (tc === TC_NULL) {
    return null
  }
  if (tc === TC_REFERENCE) {
    var handle = this.i32()
    if (!Object.prototype.hasOwnProperty.call(this.handles, handle)) {
      throw new Error('无效的对象引用 ' + handle + '，位置 ' + this.pos)
    }
    return this.handles[handle]
  }
  if (tc === TC_OBJECT) {
    return this.readObject()
  }
  if (tc === TC_STRING) {
    return this.readUtfString(false)
  }
  if (tc === TC_LONGSTRING) {
    return this.readUtfString(true)
  }
  if (tc === TC_ARRAY) {
    return this.readArray()
  }
  if (tc === TC_CLASS) {
    return this.readClassDesc()
  }
  if (tc === TC_CLASSDESC) {
    return this.readClassDescBody()
  }
  if (tc === TC_ENUM) {
    return this.readEnum()
  }
  if (tc === TC_RESET) {
    this.handles = {}
    this.nextHandle = BASE_WIRE_HANDLE
    return this.readContent()
  }
  throw new Error('无法识别的序列化类型 0x' + tc.toString(16) + '，位置 ' + this.pos)
}

CharlesJavaIn.prototype.readEnum = function () {
  var desc = this.readClassDesc()
  var value = { $class: desc == null ? '' : desc.name, $enum: true, name: null }
  var handle = this.assign(value)
  value.name = this.readContent()
  this.handles[handle] = value.name
  return value.name
}

CharlesJavaIn.prototype.readArray = function () {
  var desc = this.readClassDesc()
  var len = this.i32()
  var comp = desc == null ? '' : desc.name.substring(1)
  var arr = []
  var handle = this.assign(arr)
  if (comp === 'B') {
    arr = this.readBytes(len)
  } else if (comp === 'C') {
    var chars = []
    for (var c = 0; c < len; c++) {
      chars.push(String.fromCharCode(this.u16()))
    }
    arr = chars.join('')
  } else if (comp === 'I') {
    for (var i = 0; i < len; i++) arr.push(this.i32())
  } else if (comp === 'J') {
    for (var j = 0; j < len; j++) arr.push(this.i64())
  } else if (comp === 'S') {
    for (var s = 0; s < len; s++) arr.push(this.i16())
  } else if (comp === 'Z') {
    for (var z = 0; z < len; z++) arr.push(this.u8() !== 0)
  } else if (comp === 'F') {
    for (var f = 0; f < len; f++) arr.push(this.f32())
  } else if (comp === 'D') {
    for (var d = 0; d < len; d++) arr.push(this.f64())
  } else {
    for (var o = 0; o < len; o++) arr.push(this.readContent())
  }
  this.handles[handle] = arr
  return arr
}

CharlesJavaIn.prototype.readObject = function () {
  var desc = this.readClassDesc()
  var bag = { $class: desc == null ? '' : desc.name }
  var handle = this.assign(bag)
  this.readClassFields(desc, bag)
  var value = finishJavaObject(bag)
  this.handles[handle] = value
  return value
}

CharlesJavaIn.prototype.readClassFields = function (desc, bag) {
  if (desc == null) {
    return
  }
  this.readClassFields(desc.super, bag)
  if (desc.flags & SC_EXTERNALIZABLE) {
    if (desc.flags & SC_BLOCK_DATA) {
      bag.$external = this.readContentsUntilEndBlock()
    } else {
      throw new Error('不支持旧版 Externalizable：' + desc.name)
    }
    return
  }
  if (desc.flags & SC_SERIALIZABLE) {
    var fields = desc.fields || []
    for (var i = 0; i < fields.length; i++) {
      bag[fields[i].name] = this.readField(fields[i].type)
    }
  }
  if (desc.flags & SC_WRITE_METHOD) {
    var custom = this.readContentsUntilEndBlock()
    if (desc.name === 'java.util.ArrayList' || desc.name === 'java.util.HashSet' || desc.name === 'java.util.LinkedHashSet') {
      bag.$items = javaCollectionItems(custom)
    } else if (desc.name === 'java.util.HashMap' || desc.name === 'java.util.Hashtable') {
      bag.$map = javaMapEntries(custom)
    } else if (desc.name === 'java.util.Date') {
      bag.$time = javaDateMillis(custom)
    } else if (custom.length > 0) {
      bag.$custom = (bag.$custom || []).concat(custom)
    }
  }
}

CharlesJavaIn.prototype.readField = function (typeCode) {
  if (typeCode === 'B') return this.view.getInt8(this.pos++)
  if (typeCode === 'C') return this.u16()
  if (typeCode === 'D') return this.f64()
  if (typeCode === 'F') return this.f32()
  if (typeCode === 'I') return this.i32()
  if (typeCode === 'J') return this.i64()
  if (typeCode === 'S') return this.i16()
  if (typeCode === 'Z') return this.u8() !== 0
  if (typeCode === 'L' || typeCode === '[') return this.readContent()
  throw new Error('不支持的字段类型 ' + typeCode)
}

CharlesJavaIn.prototype.readContentsUntilEndBlock = function () {
  var out = []
  while (true) {
    var tc = this.u8()
    if (tc === TC_ENDBLOCKDATA) {
      return out
    }
    if (tc === TC_BLOCKDATA) {
      out.push(this.readBytes(this.u8()))
      continue
    }
    if (tc === TC_BLOCKDATALONG) {
      out.push(this.readBytes(this.i32()))
      continue
    }
    out.push(this.readContent(tc))
  }
}

function finishJavaObject(bag) {
  var name = bag.$class
  if (name === 'java.util.ArrayList' || name === 'java.util.HashSet' || name === 'java.util.LinkedHashSet') {
    return bag.$items || []
  }
  if (name === 'java.util.HashMap' || name === 'java.util.LinkedHashMap' || name === 'java.util.Hashtable') {
    return bag.$map || {}
  }
  if (name === 'java.util.Date') {
    return bag.$time || 0
  }
  if (name === 'java.lang.Boolean' || name === 'java.lang.Byte' || name === 'java.lang.Short'
      || name === 'java.lang.Integer' || name === 'java.lang.Long' || name === 'java.lang.Float'
      || name === 'java.lang.Double') {
    return bag.value
  }
  if (name === 'com.xk72.proxy.http.HttpFields') {
    return {
      $class: name,
      firstLine: pickHttpFirstLine(bag),
      names: bag.fieldNames || [],
      values: bag.fieldValues || []
    }
  }
  return bag
}

function pickHttpFirstLine(bag) {
  if (typeof bag.firstLine === 'string' && bag.firstLine.indexOf('HTTP') >= 0) {
    return bag.firstLine
  }
  var custom = bag.$custom || []
  for (var i = 0; i < custom.length; i++) {
    if (typeof custom[i] === 'string' && custom[i].indexOf('HTTP') >= 0) {
      return custom[i]
    }
  }
  return typeof bag.firstLine === 'string' ? bag.firstLine : ''
}

function javaCollectionItems(custom) {
  var items = []
  for (var i = 0; i < custom.length; i++) {
    if (!(custom[i] instanceof Uint8Array)) {
      items.push(custom[i])
    }
  }
  return items
}

function javaMapEntries(custom) {
  var map = {}
  var entries = javaCollectionItems(custom)
  for (var i = 0; i + 1 < entries.length; i += 2) {
    map[String(entries[i])] = entries[i + 1]
  }
  return map
}

function javaDateMillis(custom) {
  var bytes = null
  for (var i = 0; i < custom.length; i++) {
    if (custom[i] instanceof Uint8Array && custom[i].length >= 8) {
      bytes = custom[i]
      break
    }
  }
  if (bytes == null) {
    return 0
  }
  var view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return view.getInt32(0, false) * 4294967296 + view.getUint32(4, false)
}

function decodeModifiedUtf8(bytes) {
  var out = []
  var i = 0
  var n = bytes.length
  while (i < n) {
    var c = bytes[i++]
    if (c < 0x80) {
      out.push(String.fromCharCode(c))
    } else if ((c & 0xE0) === 0xC0) {
      var c2 = bytes[i++] & 0x3F
      out.push(String.fromCharCode(((c & 0x1F) << 6) | c2))
    } else if ((c & 0xF0) === 0xE0) {
      var b2 = bytes[i++] & 0x3F
      var b3 = bytes[i++] & 0x3F
      var u = ((c & 0x0F) << 12) | (b2 << 6) | b3
      if (u >= 0xD800 && u <= 0xDBFF && i + 2 < n && (bytes[i] & 0xF0) === 0xE0) {
        var b4 = bytes[i]
        var b5 = bytes[i + 1] & 0x3F
        var b6 = bytes[i + 2] & 0x3F
        var u2 = ((b4 & 0x0F) << 12) | (b5 << 6) | b6
        if (u2 >= 0xDC00 && u2 <= 0xDFFF) {
          i += 3
          var cp = ((u - 0xD800) << 10) + (u2 - 0xDC00) + 0x10000
          out.push(String.fromCharCode(0xD800 + ((cp - 0x10000) >> 10), 0xDC00 + ((cp - 0x10000) & 0x3FF)))
          continue
        }
      }
      out.push(String.fromCharCode(u))
    } else {
      out.push(String.fromCharCode(c))
    }
  }
  return out.join('')
}

function decodeUtf8(bytes) {
  if (bytes == null) {
    return ''
  }
  if (typeof bytes === 'string') {
    return bytes
  }
  if (!(bytes instanceof Uint8Array)) {
    return ''
  }
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8').decode(bytes)
  }
  return decodeModifiedUtf8(bytes)
}

function headerPairs(httpFields) {
  if (httpFields == null) {
    return []
  }
  var names = httpFields.names || []
  var values = httpFields.values || []
  var pairs = []
  for (var i = 0; i < names.length; i++) {
    pairs.push({
      name: names[i] == null ? '' : String(names[i]),
      value: values[i] == null ? '' : String(values[i])
    })
  }
  return pairs
}

function transactionToCall(node, index) {
  var requestLine = node.requestHeader ? node.requestHeader.firstLine : ''
  var responseLine = node.responseHeader ? node.responseHeader.firstLine : ''
  var method = node.scheme || ''
  var target = node.file || '/'
  if (typeof requestLine === 'string' && requestLine) {
    var parts = requestLine.trim().split(/\s+/)
    if (parts.length >= 2) {
      method = parts[0]
      target = parts[1]
    }
  }
  var status = 0
  var statusMatch = String(responseLine || '').match(/HTTP\/\d+(?:\.\d+)?\s+(\d{3})/)
  if (statusMatch) {
    status = parseInt(statusMatch[1], 10)
  }
  return {
    index: index,
    time: typeof node.startTime === 'number' ? node.startTime : 0,
    method: String(method || '').toUpperCase(),
    target: target,
    protocol: node.protocol || 'http',
    host: node.host || '',
    port: node.port || node.actualPort || 0,
    requestLine: requestLine || '',
    responseLine: responseLine || '',
    status: status,
    requestHeaders: headerPairs(node.requestHeader),
    responseHeaders: headerPairs(node.responseHeader),
    requestBody: decodeUtf8(node.requestBody),
    responseBody: decodeUtf8(node.responseBody)
  }
}

function walkCharlesNode(node, out) {
  if (node == null || typeof node !== 'object') {
    return
  }
  if (node.$class === 'com.xk72.charles.model.Transaction') {
    out.push(transactionToCall(node, out.length))
    return
  }
  var children = node.children
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      walkCharlesNode(children[i], out)
    }
  }
}

function parseCharlesSession(buffer) {
  var bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  var reader = new CharlesJavaIn(bytes)
  if (reader.u16() !== 0xACED || reader.u16() !== 5) {
    throw new Error('不是 Charles Java 会话文件')
  }
  var root = reader.readContent()
  var calls = []
  walkCharlesNode(root, calls)
  return calls
}

function splitHttpTarget(target) {
  target = target || '/'
  var hash = ''
  var query = ''
  var hashAt = target.indexOf('#')
  if (hashAt >= 0) {
    hash = target.substring(hashAt + 1)
    target = target.substring(0, hashAt)
  }
  var queryAt = target.indexOf('?')
  if (queryAt >= 0) {
    query = target.substring(queryAt + 1)
    target = target.substring(0, queryAt)
  }
  if (target.length > 1 && target.charAt(target.length - 1) === '/') {
    target = target.substring(0, target.length - 1)
  }
  if (!target || target.charAt(0) !== '/') {
    target = '/' + (target || '')
  }
  return { path: target, query: query, hash: hash }
}

function charlesBaseUrl(call) {
  var protocol = call.protocol || 'http'
  var port = parseInt(call.port, 10) || 0
  var omit = !port || (protocol === 'http' && port === 80) || (protocol === 'https' && port === 443)
  return protocol + '://' + call.host + (omit ? '' : ':' + port)
}

function charlesHeaderText(pairs) {
  var skip = {
    'content-length': true,
    'accept-encoding': true,
    'connection': true,
    'keep-alive': true
  }
  var lines = []
  for (var i = 0; i < pairs.length; i++) {
    var name = pairs[i].name
    var value = pairs[i].value
    if (!name || value == null || value === '') {
      continue
    }
    if (skip[String(name).toLowerCase()]) {
      continue
    }
    lines.push(name + ': ' + value)
  }
  return lines.join('\n')
}

function charlesContentType(pairs) {
  for (var i = 0; i < pairs.length; i++) {
    if (String(pairs[i].name).toLowerCase() === 'content-type') {
      return String(pairs[i].value || '').toLowerCase()
    }
  }
  return ''
}

function charlesRequestType(call) {
  var contentType = charlesContentType(call.requestHeaders)
  if (contentType.indexOf('json') >= 0 || contentType.indexOf('grpc') >= 0) {
    return 'JSON'
  }
  if (contentType.indexOf('multipart/form-data') >= 0) {
    return 'DATA'
  }
  if (contentType.indexOf('application/x-www-form-urlencoded') >= 0) {
    return 'FORM'
  }
  var method = call.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return 'PARAM'
  }
  var body = String(call.requestBody || '').trim()
  if (body.charAt(0) === '{' || body.charAt(0) === '[') {
    return 'JSON'
  }
  return 'JSON'
}

function charlesOperation(path) {
  var name = String(path || '').split('?')[0].replace(/^\/+/, '').toLowerCase()
  if (/^(insert|post|add|pub|write)/.test(name)) return 'INSERT'
  if (/^(update|edit|put|patch|mutate|mod)/.test(name)) return 'UPDATE'
  if (/^(del|remove|rmv|clear|clean|release)/.test(name)) return 'DELETE'
  if (/^(get|find|query|list|search|select|read|retrieve|fetch)/.test(name)) return 'SELECT'
  return null
}

function charlesFormatTime(ms) {
  var date = new Date(ms)
  function fill(n) {
    return (n < 10 ? '0' : '') + n
  }
  return date.getFullYear() + '-' + fill(date.getMonth() + 1) + '-' + fill(date.getDate())
      + ' ' + fill(date.getHours()) + ':' + fill(date.getMinutes()) + ':' + fill(date.getSeconds())
}

function charlesRequestTag(body, type) {
  if (type !== 'JSON' || !body) {
    return null
  }
  try {
    var obj = JSON.parse(body)
    return obj && typeof obj.tag === 'string' ? obj.tag : null
  } catch (e) {
    return null
  }
}

/**
 * 按 startTime 升序提取接口，生成 Document + TestRecord。
 * response 不在 Document 表里，放在关联的 TestRecord，供场景用例上传对比。
 */
function charlesSessionToDocuments(buffer, ctx) {
  ctx = ctx || {}
  var calls = parseCharlesSession(buffer).filter(function (call) {
    return call.method && call.method !== 'CONNECT' && call.target && call.responseBody
  })
  calls.sort(function (a, b) {
    if (a.time !== b.time) {
      return a.time < b.time ? -1 : 1
    }
    return a.index - b.index
  })
  var hostLabel = calls.length > 0 ? calls[0].host : 'session'
  var groupName = ctx.groupName || ('Charles ' + hostLabel)
  if (groupName.length > 45) {
    groupName = groupName.substring(0, 45)
  }
  var project = /apijson/i.test(hostLabel) ? 'APIJSON' : (ctx.project || 'APIJSON')
  var userId = ctx.userId || 0
  var testAccountId = ctx.testAccountId || 0
  var list = []
  for (var i = 0; i < calls.length; i++) {
    var call = calls[i]
    var target = splitHttpTarget(call.target)
    var url = target.path + (target.query ? '?' + target.query : '') + (target.hash ? '#' + target.hash : '')
    if (url.length > 250) {
      url = url.substring(0, 250)
    }
    var type = charlesRequestType(call)
    var tag = charlesRequestTag(call.requestBody, type)
    var name = (i + 1) + '. ' + call.method + ' ' + target.path + (tag ? ' ' + tag : '')
    if (name.length > 100) {
      name = name.substring(0, 100)
    }
    var request = call.requestBody || ''
    list.push({
      Document: {
        deleted: 0,
        debug: 0,
        from: 2,
        userId: userId,
        project: project,
        testAccountId: testAccountId,
        version: 3,
        tagList: tag ? [tag] : null,
        group: groupName,
        name: name,
        operation: charlesOperation(target.path),
        method: call.method,
        type: type,
        url: url,
        request: request,
        apijson: type === 'JSON' ? request : null,
        sqlauto: null,
        standard: null,
        header: charlesHeaderText(call.requestHeaders),
        date: charlesFormatTime(call.time || Date.now()),
        path: null,
        deleteTime: null,
        deleterId: 0,
        detail: String(call.requestLine || '').trim() + ' -> ' + String(call.responseLine || '').trim()
      },
      TestRecord: {
        userId: userId,
        testAccountId: testAccountId,
        host: charlesBaseUrl(call),
        response: call.responseBody,
        header: charlesHeaderText(call.responseHeaders),
        status: call.status || 200
      }
    })
  }
  return { groupName: groupName, list: list }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseCharlesSession: parseCharlesSession,
    charlesSessionToDocuments: charlesSessionToDocuments,
    CHARLES_SESSION_FILE: CHARLES_SESSION_FILE
  }
}
