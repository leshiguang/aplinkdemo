//app.js
const utils = require('./utils.js');
App({
  
  globalData: {

    apSsid: 'ls_68084500069d',
    hideApInfoInputs: false,
    guide: {
      android: [
        '按配网键进入小程序配网',
        '打开手机Wi-Fi、GPS位置服务',
        '输入Wi-Fi密码及AP SSID后连接'
      ],
      ios: [
        '按配网键进入小程序配网',
        '打开手机Wi-Fi',
        '输入Wi-Fi密码及AP SSID后连接'
      ]
    },
    userData: null
  },

  referrerInfo: null,

  __genStorageKey: function (key) {

    var appId = this.referrerInfo && this.referrerInfo['appId'] ? this.referrerInfo['appId'] : 'default';
    return 'smartaplink.{0}.{1}'.format(appId, key);
  },

  setStorageValue: function (key, value) {

    if (utils.isBlank(key)) {
      return false;
    }

    wx.setStorageSync(this.__genStorageKey(key), value);

    return true;
  },

  getStorageValue: function (key, defaultValue) {

    if (utils.isEmpty(key)) {
      return null;
    }

    key = this.__genStorageKey(key);
    var keys = wx.getStorageInfoSync()['keys'];
    if (keys.indexOf(key) == -1) {
      return defaultValue === undefined ? null : defaultValue;
    }

    return wx.getStorageSync(key);
  },

  getReferrerInfoValue: function (key) {

    if (this.referrerInfo && this.referrerInfo['extraData'] && this.referrerInfo['extraData'].hasOwnProperty(key)) {
      return this.referrerInfo['extraData'][key];
    }

    return null;
  },

  _getApLinkOption: function (key) {

    var value = this.getStorageValue(key);
    if (!utils.isEmpty(value)) {
      return value;
    }

    value = this.getReferrerInfoValue(key);
    if (!utils.isEmpty(value)) {
      return value;
    }

    return this.globalData[key];
  },

  getApLinkOptions: function () {

    var apSsid = this._getApLinkOption('apSsid');
    var hideApInfoInputs = this._getApLinkOption('hideApInfoInputs');
    var guide = this._getApLinkOption('guide');
    var userData = this._getApLinkOption('userData');

    return {
      apSsid: apSsid,
      hideApInfoInputs: hideApInfoInputs,
      guide: guide,
      userData: userData
    };
  },

  onShow: function (data) {
    console.warn("");
    if (data && data['scene'] == 1037 && data['referrerInfo']) {
      this.referrerInfo = data['referrerInfo'];
    }
  },

  onHide: function () {
    this.referrerInfo = null;
  }


  // ,

  // onShow: function (data) {

  //   if (data['scene'] == 1038 && data['referrerInfo'] && 
  //     data['referrerInfo']['appId'] === 'wx31b43acf6e51cff0') {

  //     var device = data['referrerInfo']['extraData'];
  //     console.log(JSON.stringify(device));
  //   }
  // }
})