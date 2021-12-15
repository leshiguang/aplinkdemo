module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1639556295790, function(require, module, exports) {
const ApLinker = require('/smartaplink_lib/ap-linker.js');
const aplinker = new ApLinker();

/**
 * 初始化
 * return Primiss有可能初始化失败
 */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function init() {
    return aplinker.init();
};exports.init = init

/**
 * 这个就是调用了微信的wx.getConnectedWifi
 * @param callback({
          success: true,
          res: res
        });
 * @returns 
 */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function getConnectedWifi(callback) {
    return aplinker.getConnectedWifi(callback)
};exports.getConnectedWifi = getConnectedWifi

/**
   * 启动发现设备
   * object: {apSsid: string[option], onDeviceFound: function}
   */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function startDeviceDiscovery(obj) {
    return aplinker.startDeviceDiscovery(obj);
};exports.startDeviceDiscovery = startDeviceDiscovery

/**
 * 停止搜索设备
 * @returns 
 */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function stopDeviceDiscovery() {
    return aplinker.stopDeviceDiscovery();
};exports.stopDeviceDiscovery = stopDeviceDiscovery

/**
   * options: {
   *  wifiSsid: string, the ssid of conected wifi
   *  wifiPassword: string, the password of connected wifi
   *  apSsid: string, the ssid of ap
   *  userData: [option]
   * }
   */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function start(options) {
    return aplinker.start(options);
};exports.start = start

/**
 * 停止配网
 * @returns Promiss
 */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function stop() {
    return aplinker.stop
};exports.stop = stop

/**
 * 销毁
 */
if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function destroy() {
    return aplinker.destroy();
};exports.destroy = destroy


if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function listenWifiStateChange(callback) {
    return aplinker.listenWifiStateChange(callback);
};exports.listenWifiStateChange = listenWifiStateChange

if (!exports.__esModule) Object.defineProperty(exports, "__esModule", { value: true });function unlistenWifiStateChange() {
    return aplinker.unlistenWifiStateChange();
};exports.unlistenWifiStateChange = unlistenWifiStateChange

module.exports = {
    init: init,
    getConnectedWifi: aplinker.getConnectedWifi,
    start: start,
    stop: stop,
    startDeviceDiscovery: startDeviceDiscovery,
    stopDeviceDiscovery: stopDeviceDiscovery,
    destroy: destroy,
    unlistenWifiStateChange: unlistenWifiStateChange,
    listenWifiStateChange: listenWifiStateChange
}
}, function(modId) {var map = {"/smartaplink_lib/ap-linker.js":1639556295791}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295791, function(require, module, exports) {
const Promise = require('es6-promise').Promise;
const logger = require('./logger.js');
const utils = require('./utils.js');
const ApConfiger = require('./ap-configer.js');
const DeviceDiscovery = require('./device-discovery.js');

module.exports = function () {

  var TAG = 'smartaplink_lib.commons.ap-linker.{0}:'

  var apSsid;
  var wifiSsid;
  var wifiPasssword;
  var userData = '';
  var successCallback;
  var progressCallback;
  var getConnectedWifiInterval = -1;
  var self = this;
  var started = false;
  var apConfiger = new ApConfiger();
  var deviceDiscovery = new DeviceDiscovery();

  var startWifi = function () {

    return new Promise(function (resolve, reject) {

      wx.startWifi({

        success: function (res) {

          logger.log(TAG.format('startWifi'), 'start wifi success -', JSON.stringify(res));
          resolve(true);
        },
        fail: function (res) {

          logger.warn(TAG.format('startWifi'), 'start wifi fail -', JSON.stringify(res));
          resolve(false);
        }
      })
    });
  };

  var stopWifi = function () {

    return new Promise(function (resolve, reject) {

      wx.stopWifi({

        success: function (res) {

          logger.log(TAG.format('stopWifi'), 'stop wifi success -', JSON.stringify(res));
          resolve(true);
        },
        fail: function (res) {

          logger.warn(TAG.format('stopWifi'), 'stop wifi fail -', JSON.stringify(res));
          resolve(false);
        }
      })
    });
  };

  var checkApConnection = function (wifiInfo) {

    return new Promise(function (resolve, reject) {

      logger.log(TAG.format('checkApConnection'), 'start to check ap connection', JSON.stringify(wifiInfo));

      progress(self.state.CHECK_AP_CONNECTION);

      var count = 0;

      var checkApConnectionInterval = setInterval(function () {

        if (count >= 120) {

          clearInterval(checkApConnectionInterval);
          reject(self.state.CHECK_AP_CONNECTION);
        } else {

          self.getConnectedWifi(function (result) {

            logger.log(TAG.format('checkApConnection'), JSON.stringify(result));

            if (result['success']) {

              if (result['res']['wifi']['SSID'] === wifiInfo.SSID) {

                logger.log(TAG.format('checkApConnection'), 'check ap connection succeed', JSON.stringify(wifiInfo));
                clearInterval(checkApConnectionInterval);
                resolve();
              }
            }

            count++;
          });
        }
      }, 500);
    });
  };

  var configAp = function () {

    logger.info(TAG.format('configAp'));

    return new Promise((resolve, reject) => {

      progress(self.state.CONFIG_AP);

      apConfiger.configAp(apSsid, wifiSsid, wifiPasssword, userData)
        .then(res => {
          logger.info(TAG.format('configAp'), 'config ap succeed:', JSON.stringify(res));
          resolve();
        }).catch(e => {
          logger.error(TAG.format('configAp'), 'catch exception:', JSON.stringify(e));
          reject(self.state.CONFIG_AP);
        });
    });
  };

  var success = function () {

    if (typeof successCallback === 'function') {

      try {
        successCallback();
      } catch (e) { }
    }
  };

  var fail = function (code, message, data) {

    if (typeof failCallback === 'function') {

      try {
        failCallback({
          code: code,
          msg: message,
          data: data
        });
      } catch (e) { }
    }
  };

  var progress = function (state) {

    if (typeof progressCallback === 'function') {

      try {
        progressCallback({
          name: state['name'],
          description: state['description']
        });
      } catch (e) { }
    }
  };

  this.state = {
    VALIDATE_PARAMS: {
      name: 'VALIDATE_PARAMS',
      description: '正在检查参数',
      error: {
        code: -10000,
        msg: '参数错误'
      }
    },
    SCAN_AP: {
      name: 'SCAN_AP',
      description: '正在搜索设备AP',
      error: {
        code: -10001,
        msg: '未搜索到设备AP'
      }
    },
    CONNECT_AP: {
      name: 'CONNECT_AP',
      description: '正在连接设备AP',
      error: {
        code: -10002,
        msg: '连接设备AP失败'
      }
    },
    SCAN_ORIGINAL_WIFI: {
      name: 'SCAN_ORIGINAL_WIFI',
      description: '正在回连手机Wi-Fi',
      error: {
        code: -10003,
        msg: '回连手机Wi-Fi失败'
      }
    },
    CONNECT_ORIGINAL_WIFI: {
      name: 'CONNECT_ORIGINAL_WIFI',
      description: '正在回连手机Wi-Fi',
      error: {
        code: -10004,
        msg: '回连手机Wi-Fi失败'
      }
    },
    CONFIG_AP: {
      name: 'CONFIG_AP',
      description: '正在配置设备',
      error: {
        code: -10005,
        msg: '配置设备信息失败'
      }
    },
    TASK_ALREADY_EXIST: {
      name: 'TASK_ALREADY_EXIST',
      description: '已有一个设备配置任务正在进行中',
      error: {
        code: -10006,
        msg: '已有一个设备配置任务正在进行中'
      }
    },
    TASK_CANCEL: {
      name: 'TASK_CANCEL',
      description: '已取消配置设备',
      error: {
        code: -10007,
        msg: '已取消配置设备'
      }
    },
    CHECK_AP_CONNECTION: {
      name: 'CHECK_AP_CONNECTION',
      description: '正在检测设备AP连接',
      error: {
        code: -10008,
        msg: '检测设备AP连接失败'
      }
    },
    CHECK_ORIGINAL_WIFI_CONNECTION: {
      name: 'CHECK_ORIGINAL_WIFI_CONNECTION',
      description: '正在检测手机Wi-Fi连接',
      error: {
        code: -10009,
        msg: '检测手机Wi-Fi连接失败'
      }
    }
  }

  /**
   * 启动发现设备
   * object: {apSsid: string[option], onDeviceFound: function}
   */
  this.startDeviceDiscovery = function (object) {
    deviceDiscovery.startDeviceDiscovery(object);
  }

  /**
   * 停止发现设备
   */
  this.stopDeviceDiscovery = function () {
    deviceDiscovery.stopDeviceDiscovery();
  }

  /**
   * 已废弃，请使用 stopDeviceDiscovery() 替代
   */
  this.stopScanDeviceDiscovery = this.stopDeviceDiscovery;

  /**
   * options: {
   *  wifiSsid: string, the ssid of conected wifi
   *  wifiPassword: string, the password of connected wifi
   *  apSsid: string, the ssid of ap
   *  userData: [option]
   * }
   */
  this.start = function (options) {

    if (started) {

      fail(self.state.TASK_ALREADY_EXIST.error.code, self.state.TASK_ALREADY_EXIST.error.msg);
      return;
    }

    if (typeof options !== 'object') {
      return;
    }

    wifiSsid = options.wifiSsid;
    wifiPasssword = utils.isEmpty(options.wifiPassword) ? '' : options.wifiPassword;
    apSsid = options.apSsid;
    userData = utils.isEmpty(options.userData) ? '' : options.userData;
    successCallback = options.success;
    progressCallback = options.progress;
    failCallback = options.fail;

    var paramsError = {};
    if (utils.isEmpty(wifiSsid)) {
      paramsError['wifiSsid'] = 'wifiSsid is empty';
    }

    if (utils.isEmpty(apSsid)) {
      paramsError['apSsid'] = 'apSsid is empty';
    }

    if (Object.keys(paramsError).length) {

      logger.info('abort to start AP link, invalid parameters: ', JSON.stringify(paramsError));
      fail(self.state.VALIDATE_PARAMS.error.code, self.state.VALIDATE_PARAMS.error.msg, paramsError);
      return;
    }

    started = true;

    checkApConnection({
      SSID: apSsid
    })
      .then(() => {
        return configAp();
      })
      .then(() => {

        logger.info(TAG.format('start'), 'the whole ap link task is succeed');
        self.stop();
        success();
      })
      .catch(e => {

        logger.warn(TAG.format('start'), 'catch exception', JSON.stringify(e));
        self.stop();
        if (e && e.error && e.error.code != self.state.TASK_CANCEL.error.code) {
          fail(e.error.code, e.error.msg);
        }
      });
  };

  this.stop = function () {
    started = false;
  };

  this.init = async function () {
    return await startWifi();
  };

  this.destroy = async function () {

    this.stop();

    if (getConnectedWifiInterval != -1) {
      clearInterval(getConnectedWifiInterval);
      getConnectedWifiInterval = -1;
    }
    return await stopWifi();
  };

  this.getConnectedWifi = function (callback) {

    wx.getConnectedWifi({
      success: function (res) {
        callback({
          success: true,
          res: res
        });
      },
      fail: function (res) {
        callback({
          success: false,
          res: res
        });
      }
    });
  };

  this.listenWifiStateChange = function (callback) {

    this.unlistenWifiStateChange();
    var previousWifi = null;
    var wifiNotStarted = 0;

    var wifiInfoCallback = function (result) {

      var wifi = false;

      // logger.log(TAG.format('getConnectedWifiInterval'), JSON.stringify(result));

      if (!result['success'] &&
        (result['res']['errCode'] == 12000 || result['res']['errMsg'].indexOf('开发者工具暂时不支持') != -1)) {

        wifiNotStarted++;

        if (wifiNotStarted >= 10) {

          clearInterval(getConnectedWifiInterval);
          getConnectedWifiInterval = -1;
        }

        return;
      }

      if (started) {
        previousWifi = null;
        return;
      }

      wifiNotStarted = 0;

      if (result['success']) {
        wifi = result['res']['wifi']['SSID'];
      }
      if (wifi != previousWifi) {

        if (typeof callback === 'function') {

          try {
            callback(result['success'], result['res']);
          } catch (e) { }
        }

        previousWifi = wifi;
      }
    }

    var action = function () {
      self.getConnectedWifi(wifiInfoCallback);
    };

    getConnectedWifiInterval = setInterval(action, 1500);

    action();
  };

  this.unlistenWifiStateChange = function () {

    if (getConnectedWifiInterval != -1) {
      clearInterval(getConnectedWifiInterval);
      getConnectedWifiInterval = -1;
    }
  };
};
}, function(modId) { var map = {"./logger.js":1639556295792,"./utils.js":1639556295793,"./ap-configer.js":1639556295794,"./device-discovery.js":1639556295798}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295792, function(require, module, exports) {
function Logger() {

  var _logger = console;

  this.log = _logger.log;
  this.info = _logger.info;
  this.warn = _logger.warn;
  this.error = _logger.error;
}

module.exports = new Logger();
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295793, function(require, module, exports) {
/**
 * var template1="I'm {0}，I'm {1} years old";
 * var template2="I'm {name}，I'm {age} years old";
 * var result1=template1.format("loogn",22);
 * var result2=template2.format({name:"loogn",age:22});
 * @param args
 * @returns {String}
 */
String.prototype.format = function (args) {
  var result = this;
  if (arguments.length > 0) {
    if (arguments.length == 1 && typeof (args) == "object") {
      for (var key in args) {
        if (args[key] != undefined) {
          var reg = new RegExp("({" + key + "})", "g");
          result = result.replace(reg, args[key]);
        }
      }
    } else {
      for (var i = 0; i < arguments.length; i++) {
        if (arguments[i] != undefined) {
          var reg = new RegExp("({)" + i + "(})", "g");
          result = result.replace(reg, arguments[i]);
        }
      }
    }
  }
  return result;
};

module.exports = {

  isEmpty: function (text) {

    return text === undefined || text == null;
  },
  isBlank: function (text) {

    return this.isEmpty(text) || text.toString().trim().length == 0;
  },
  isNotBlank: function (text) {
    return !this.isBlank(text);
  },

  isMatched: function (text2Match, matchingText, matching) {

    if (this.isEmpty(text2Match)) {
      return false;
    }

    if (this.isEmpty(matchingText)) {
      return true;
    }

    var matchingRules = ['left', 'right', 'center', 'full'];
    if (matchingRules.indexOf(matching) == -1) {
      matching = 'full';
    }

    if (matching === 'left') {
      return new RegExp('^{0}.*'.format(matchingText)).test(text2Match);
    } else if (matching === 'right') {
      return new RegExp('.*{0}$'.format(matchingText)).test(text2Match);
    } else if (matching === 'center') {
      return new RegExp('.*{0}.*'.format(matchingText)).test(text2Match);
    } else if (matching === 'full') {
      return text2Match === matchingText;
    }
  },

  compareVersion: function(v1, v2) {
    
    v1 = v1.split('.')
    v2 = v2.split('.')
    const len = Math.max(v1.length, v2.length)

    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }

    for (let i = 0; i < len; i++) {
      const num1 = parseInt(v1[i])
      const num2 = parseInt(v2[i])

      if (num1 > num2) {
        return 1
      } else if (num1 < num2) {
        return -1
      }
    }

    return 0
  }

};
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295794, function(require, module, exports) {
const Promise = require('es6-promise').Promise;
var logger = require('./logger.js');
var utils = require('./utils.js');
const Encryptor = require('./encryptor.js');
const ApHttper = require('./ap-httper.js');
const ApUdper = require('./ap-udper.js');

module.exports = function () {

  var TAG = 'smartaplink_lib.commons.ap-configer';
  var encryptor = null;
  var apHttper = new ApHttper();
  var apUdper = new ApUdper();

  var setAp = function (apNetter, wifiSsid, wifiPasssword, userData) {

    logger.info(TAG, 'configAp->setAp');

    var setConfigRequest = {
      CID: 30005,
      PL: {
        SSID: wifiSsid,
        Password: wifiPasssword,
        Userdata: userData
      }
    };

    return apNetter.post(setConfigRequest);
  };

  var restartAp = function (apNetter) {

    logger.info(TAG, 'configAp->restartAp');

    var restartRequest = {
      CID: 30007,
      PL: null
    }

    return apNetter.post(restartRequest);
  }

  var configTask = function (apNetter, wifiSsid, wifiPasssword, userData) {

    return setAp(apNetter, wifiSsid, wifiPasssword, userData)
      .then(res => {
        return restartAp(apNetter);
      }).then(res => {
        return Promise.reject(true);
      }).catch(res => {
        if (res === true) {

          logger.info(TAG, 'configTask', apNetter.name, 'succeed');
          return Promise.reject(true);
        } else {
          logger.warn(TAG, 'configTask', apNetter.name, 'failed');
          return Promise.resolve(false);
        }
      });
  }

  this.configAp = function (apSsid, wifiSsid, wifiPasssword, userData) {

    encryptor = new Encryptor(apSsid);
    var apNetters = [apHttper, apUdper];
    var configTasks = [];

    for (var i = 0; i < apNetters.length; i++) {

      apNetters[i].init({
        encryptor: encryptor
      });
      configTasks.push(configTask(apNetters[i], wifiSsid, wifiPasssword, userData));
    }

    return Promise.all(configTasks).then(res => {

      return Promise.reject(false);
    }).catch(res => {

      if (res) {
        return Promise.resolve(res);
      } else {
        return Promise.reject();
      }
    }).finally(() => {

      for (var i = 0; i < apNetters.length; i++) {
        apNetters[i].destroy();
      }
    });
  };
};
}, function(modId) { var map = {"./logger.js":1639556295792,"./utils.js":1639556295793,"./encryptor.js":1639556295795,"./ap-httper.js":1639556295796,"./ap-udper.js":1639556295797}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295795, function(require, module, exports) {
var md5 = require('md5');
var aesjs = require('aes-js');
var base64js = require('base64-js');
var logger = require('logger.js');

function Encryptor(key) {

  var aesKey = md5(key).substr(0, 32);
  var aesKeyBytes = aesjs.utils.hex.toBytes(aesKey);

  this.encrypt = function (plainText) {

    var tag = 'commons.Encryptor.encrypt:';
    logger.log(tag, 'plainText -', plainText);
    var plainTextBytes = aesjs.utils.utf8.toBytes(plainText);
    logger.log(tag, 'plainTextBytes -', aesjs.utils.hex.fromBytes(plainTextBytes));
    plainTextBytes = addPaddingBytes(plainTextBytes);

    logger.log(tag, 'aesKeyBytes -', aesjs.utils.hex.fromBytes(aesKeyBytes));

    var aesCbc = new aesjs.ModeOfOperation.cbc(aesKeyBytes, aesKeyBytes);
    var encryptedBytes = aesCbc.encrypt(plainTextBytes);
    logger.log(tag, 'encryptedBytes -', aesjs.utils.hex.fromBytes(encryptedBytes));

    var base64Text = base64js.fromByteArray(encryptedBytes);
    logger.log(tag, 'base64Text -', base64Text);

    return base64Text;
  };

  this.decrypt = function (encryptedText) {

    var tag = 'commons.Encryptor.decrypt:';
    logger.log(tag, 'encryptedText -', encryptedText);

    var encryptedBytes = base64js.toByteArray(encryptedText);
    logger.log(tag, 'encryptedBytes -', aesjs.utils.hex.fromBytes(encryptedBytes));

    logger.log(tag, 'aesKeyBytes -', aesjs.utils.hex.fromBytes(aesKeyBytes));

    var aesCbc = new aesjs.ModeOfOperation.cbc(aesKeyBytes, aesKeyBytes);
    var decryptedBytes = aesCbc.decrypt(encryptedBytes);
    logger.log(tag, 'decryptedBytes -', aesjs.utils.hex.fromBytes(decryptedBytes));

    decryptedBytes = removePaddingBytes(decryptedBytes);
    var plainText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    logger.log(tag, 'plainText -"', plainText, '"');

    return plainText;
  };
  

  var addPaddingBytes = function(plain) {

    var size = plain.length;
    var remainder = size % 16;
    if (remainder == 0) {
      return plain;
    }

    var _plain = new Uint8Array(size + 16 - remainder);
    _plain.set(plain);

    return _plain;
  }

  var removePaddingBytes = function(padding) {

    var index = -1;
    for(var i = padding.length - 1; i > -1; i--) {

      if(padding[i] == 0) {
        index = i;
      }else {
        break;
      }
    }

    if (index == -1) {
      return padding;
    } else {
      var plain = new Uint8Array(index);
      aesjs._arrayTest.copyArray(padding, plain, 0, 0, index);
      return plain;
    }
  }
}

module.exports = Encryptor;
}, function(modId) { var map = {"logger.js":1639556295792}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295796, function(require, module, exports) {
const Promise = require('es6-promise').Promise;
var logger = require('./logger.js');
var utils = require('./utils.js');

module.exports = function() {

  var TAG = 'smartaplink_lib.commons.ap-httper';
  var encryptor = null;
  var stop = false;
  
  this.name = "ap-httper";

  this.init = function(obj) {
    encryptor = obj.encryptor;
    stop = false;
  };

  this.post = function(body) {

    var tag = TAG + '.post:';
    var bodyText = JSON.stringify(body);
    logger.info(tag, 'plain body -', bodyText);

    var encryptedBody = encryptor.encrypt(bodyText);
    logger.info(tag, 'encrypted body -', encryptedBody);

    return new Promise(function(resolve, reject) {

      var times = 0;

      var postAction = function(_body) {

        if(stop) {
          return;
        }

        if (times++ >= 5) {
          reject();
          return;
        }

        logger.log(tag, 'postAction: No.' + times, 'times');

        wx.request({
          url: 'http://10.10.100.254?linkType=wechatMiniApLink',
          data: _body,
          header: {
            "Content-Type": "text/plain; charset=UTF-8"
          },
          method: 'POST',
          dataType: 'text',
          responseType: 'text',
          timeout: 8000 + times * 1000,
          success: function(res) {

            logger.log('ApHttper.post success:', JSON.stringify(res));

            if (res['statusCode'] == 200) {

              try {

                var response = JSON.parse(encryptor.decrypt(res['data']));
                if (response['RC'] == 0) {
                  resolve(response);
                  return;
                }
              } catch (e) {
                logger.error(JSON.stringify(e));
              }
            }

            postAction(_body);
          },
          fail: function(res) {
            logger.log('ApHttper.post fail:', JSON.stringify(res));
            postAction(_body);
          }
        });
      };

      postAction(encryptedBody);
    });
  };

  this.destroy = function() {
    stop = true;
    logger.info(TAG, 'destroy');
  };
};
}, function(modId) { var map = {"./logger.js":1639556295792,"./utils.js":1639556295793}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295797, function(require, module, exports) {
const Unibabel = require('browserify-unibabel');
const Promise = require('es6-promise').Promise;
const logger = require('./logger.js');
const utils = require('./utils.js');

module.exports = function() {

  var TAG = 'smartaplink_lib.commons.ap-udper';

  var encryptor = null;
  var socket = wx.createUDPSocket();
  var onResponsedSucceed = null;
  var intervalId = -1;
  var onMessageCallback = function(res) {

    var uint8Array = new Uint8Array(res['message']);
    var message = Unibabel.utf8ArrToStr(uint8Array).trim();

    res['message'] = message;
    logger.log(TAG, 'socket.onMessage:', JSON.stringify(res));

    try {

      var response = JSON.parse(encryptor.decrypt(res['message']));
      if (response['RC'] == 0) {

        if (onResponsedSucceed) {
          onResponsedSucceed.call(this, response);
        }
      }
    } catch (e) {
      logger.error(JSON.stringify(e));
    }
  };

  this.name = "ap-udper";

  this.init = function(obj) {
    clearInterval(intervalId);
    encryptor = obj.encryptor;
    socket.onMessage(onMessageCallback);
    socket.bind();
  };

  this.post = function (body) {

    clearInterval(intervalId);

    var tag = TAG + '.post:';
    var bodyText = JSON.stringify(body);
    logger.info(tag, 'plain body -', bodyText);

    var encryptedBody = encryptor.encrypt(bodyText);
    logger.info(tag, 'encrypted body -', encryptedBody);

    return new Promise(function(resolve, reject) {

      var times = 0;

      var postAction = function(_body) {

        times++;
        logger.log(TAG, 'postAction: No.' + times, 'times');

        socket.send({
          address: '10.10.100.254',
          port: 48887,
          message: _body
        });
      };

      intervalId = setInterval(() => {

        if (times >= 10) {
          reject();
          return;
        }

        postAction(encryptedBody);
      }, 2000);

      onResponsedSucceed = function(response) {
        resolve(response);
      };

      postAction(encryptedBody);
    }).finally(() => {
      clearInterval(intervalId);
    })
  };

  this.destroy = function() {
    clearInterval(intervalId);
    socket.offMessage(onMessageCallback);
    logger.info(TAG, 'destroy');
  };
};
}, function(modId) { var map = {"./logger.js":1639556295792,"./utils.js":1639556295793}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295798, function(require, module, exports) {
var logger = require('./logger.js');
const DeviceMdnsDiscovery = require('./device-mdns-discovery.js');
const DeviceSmartLinkDiscovery = require('./device-smartlink-discovery.js');

module.exports = function () {

  var self = this;
  var TAG = 'smartaplink_lib.commons.device-discovery.{0}:';
  var deviceMdnsDiscovery = new DeviceMdnsDiscovery();
  var deviceSmartLinkDiscovery = new DeviceSmartLinkDiscovery();
  var discoveries = [deviceMdnsDiscovery, deviceSmartLinkDiscovery];
  var discoveryDeviceStarted = false;

  /**
   * 启动发现设备
   * object: {apSsid: string, onDeviceFound: function}
   */
  this.startDeviceDiscovery = function (object) {

    if (discoveryDeviceStarted) {
      logger.warn(TAG.format('startDeviceDiscovery'), 'device discovery was already started');
      return;
    }

    discoveryDeviceStarted = true;
    var devices = [];
    var onDeviceFound = object['onDeviceFound'];
    object['onDeviceFound'] = function (device) {

      if (devices.indexOf(device.mac) === -1) {

        devices.push(device.mac);

        try {
          onDeviceFound(device);
        } catch (error) {
          logger.error(TAG.format('startDeviceDiscovery'), error);
        }
      }
    }

    discoveries.forEach(discovery => {
      discovery.startDeviceDiscovery(object);
    });
  }

  this.stopDeviceDiscovery = function () {

    discoveries.forEach(discovery => {
      discovery.stopDeviceDiscovery();
    });

    discoveryDeviceStarted = false;
  }
};
}, function(modId) { var map = {"./logger.js":1639556295792,"./device-mdns-discovery.js":1639556295799,"./device-smartlink-discovery.js":1639556295800}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295799, function(require, module, exports) {
const logger = require('./logger.js');
const utils = require('./utils.js');

module.exports = function () {

  var TAG = 'smartaplink_lib.commons.device-mDNS-discovery.{0}:'

  var discoveryDeviceStarted = false;
  var onLocalServiceFoundCallback = null;
  var onLocalServiceDiscoveryStopCallback = null;

  /**
   * 启动发现设备
   * object: {apSsid: string, onDeviceFound: function}
   */
  this.startDeviceDiscovery = function (object) {

    if (discoveryDeviceStarted) {
      logger.warn(TAG.format('startDeviceDiscovery'), 'device discovery was already started');
      return;
    }
    discoveryDeviceStarted = true;
    var devices = [];

    if (onLocalServiceFoundCallback != null) {
      wx.offLocalServiceFound(onLocalServiceFoundCallback);
    }
    onLocalServiceFoundCallback = function (res) {

      logger.info(TAG.format('onLocalServiceFound'), JSON.stringify(res));

      if (object && typeof object['onDeviceFound'] === 'function') {

        var deviceInfos = res['serviceName'].split('`');;
        if (deviceInfos.length < 3) {
          return;
        }

        var mac = deviceInfos[0];
        var mid = deviceInfos[1];
        var apSsid = deviceInfos[2];
        var ip = res['ip'];

        if (devices.indexOf(mac) == -1 && apSsid === object['apSsid']) {

          devices.push(mac);
          var device = {
            mid: mid,
            mac: mac,
            // apSsid: apSsid,
            ip: ip
          };
          logger.log(TAG.format('onDeviceFound:'), JSON.stringify(device));

          object['onDeviceFound'](device);
        }
      }
    };
    wx.onLocalServiceFound(onLocalServiceFoundCallback);

    if (onLocalServiceDiscoveryStopCallback != null) {
      wx.offLocalServiceDiscoveryStop(onLocalServiceDiscoveryStopCallback);
    }
    onLocalServiceDiscoveryStopCallback = function (res) {

      logger.info(TAG.format('onLocalServiceDiscoveryStop'), JSON.stringify(res));
      
      if (discoveryDeviceStarted) {
        localServiceDiscovery();
      } else {
        wx.offLocalServiceDiscoveryStop(onLocalServiceDiscoveryStopCallback);
        onLocalServiceDiscoveryStopCallback = null;
      }
    };
    wx.onLocalServiceDiscoveryStop(onLocalServiceDiscoveryStopCallback);

    var localServiceDiscovery = function () {

      if (!discoveryDeviceStarted) {
        return;
      }

      wx.startLocalServiceDiscovery({
        serviceType: '_hf._tcp.',
        success: function (res) {
          logger.log(TAG.format('findDevice'), 'startLocalServiceDiscovery success', JSON.stringify(res));
        },
        fail: function (res) {
          logger.warn(TAG.format('findDevice'), 'startLocalServiceDiscovery fail', JSON.stringify(res));

          if (res['errMsg'].indexOf('scan task already exist') == -1) {
            setTimeout(localServiceDiscovery, 3000);
          }
        }
      });
    };

    localServiceDiscovery();
  }

  /**
   * 停止发现设备
   */
  this.stopDeviceDiscovery = function () {

    discoveryDeviceStarted = false;

    wx.stopLocalServiceDiscovery({
      serviceType: '_hf._tcp.',
      complete: function (res) {
        logger.log(TAG.format('stopDeviceDiscovery'), 'stopLocalServiceDiscovery complete', JSON.stringify(res));

        if (onLocalServiceFoundCallback != null) {
          wx.offLocalServiceFound(onLocalServiceFoundCallback);
          onLocalServiceFoundCallback = null;
        }
      }
    });
  }
};
}, function(modId) { var map = {"./logger.js":1639556295792,"./utils.js":1639556295793}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295800, function(require, module, exports) {
const Unibabel = require('browserify-unibabel');
const utils = require('./utils.js');
const logger = require('./logger.js');
const Constant = require('./constant.js');

module.exports = function () {

  var TAG = 'smartaplink_lib.commons.device-smartlink-discovery.{0}:'

  var discoveryDeviceStarted = false;
  var socket = null;
  var intervalId = null;

  /**
   * 启动发现设备
   * object: {apSsid: string, onDeviceFound: function}
   */
  this.startDeviceDiscovery = function (object) {

    if (discoveryDeviceStarted) {
      logger.warn(TAG.format('startDeviceDiscovery'), 'device discovery was already started');
      return;
    }

    logger.info(TAG.format('startDeviceDiscovery'));
    discoveryDeviceStarted = true;
    var devices = [];

    socket = wx.createUDPSocket();
    socket.onMessage(function (res) {

      var uint8Array = new Uint8Array(res['message']);
      var message = Unibabel.utf8ArrToStr(uint8Array).trim();
      res['messageText'] = message;
      logger.log(TAG.format('socket.onMessage:'), JSON.stringify(res));

      var prefix = 'smart_config';
      if (message.startsWith(prefix)) {

        var resultTexts = message.substr(prefix.length).trim();
        var resultItems = resultTexts.split('##');
        var mac = resultItems[0];
        if (utils.isNotBlank(mac) && devices.indexOf(mac) == -1) {

          devices.push(mac);

          var mid = resultItems.length > 1 && utils.isNotBlank(resultItems[1]) ? resultItems[1] : resultItems[0];
          var device = {
            mid: mid,
            mac: mac,
            ip: res['remoteInfo']['address']
          };
          logger.log(TAG.format('onDeviceFound:'), JSON.stringify(device));

          object['onDeviceFound'](device);
        }
      } else {

        try {

          var json = JSON.parse(message);
          if (json != null && utils.isNotBlank(json['mac']) && devices.indexOf(json['mac']) == -1) {

            devices.push(json['mac']);

            var device = {
              mid: json['mid'],
              mac: json['mac'],
              ip: json['ip']
            };
            logger.log(TAG.format('onDeviceFound:'), JSON.stringify(device));

            object['onDeviceFound'](device);
          }
        } catch (error) {
          logger.error(TAG.format('socket.onMessage:'), error);
        }
      }
    });
    socket.bind(Constant.smartConfigPort);

    intervalId = setInterval(function () {

      socket.send({
        address: Constant.udpBroadcastIp,
        port: Constant.smartLinkFindPort,
        message: 'smartlinkfind'
      });
    }, 500);
  }


  /**
   * 停止发现设备
   */
  this.stopDeviceDiscovery = function () {

    logger.info(TAG.format('stopDeviceDiscovery'));

    clearInterval(intervalId);
    socket.close();
    discoveryDeviceStarted = false;
  }
};
}, function(modId) { var map = {"./utils.js":1639556295793,"./logger.js":1639556295792,"./constant.js":1639556295801}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1639556295801, function(require, module, exports) {
module.exports = {
  smartLinkFindPort: 48899,
  smartConfigPort: 49999,
  udpBroadcastIp: '255.255.255.255',
}
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1639556295790);
})()
//miniprogram-npm-outsideDeps=["es6-promise","md5","aes-js","base64-js","browserify-unibabel"]
//# sourceMappingURL=index.js.map