// miniprogram/pages/smartApLink/apLink/apLink.js
const aesjs = require('aes-js');
const apLinker = require('sg-aplink');
const utils = require('../../../utils');
const logger = require('../../../logger');
var TAG = 'pages.smartApLink.apLink.apLink.{0}:'

Page({

  global: {

    topTipsDismissTimer: -1,
    apLinkOptions: {},
    inited: false
  },

  data: {
    apSsid: '',
    wifiSsid: '',
    wifiPassword: '',
    hideApInfoInputs: false,
    showWifiPassword: false,
    wifiPasswordIcon: 'icon-eye_closed',
    wifiConnected: true,
    error: false,
    tips: false,
    loading: false,
    manualConnectAp: null,
    manualConnectOriginalAp: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

    this.global.apLinkOptions = getApp().getApLinkOptions();
    this.init(this.listenWifiStateChange);
  },


  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

    this.unlistenWifiStateChange();
    apLinker.destroy();
  },

  /**
   * 生命周期函数--监听页面Ready
   */
  onReady: function () {

    this.setData({
      apSsid: this.global.apLinkOptions['apSsid']
    });

    var hideApInfoInputs = this.global.apLinkOptions['hideApInfoInputs'];
    if (new String(hideApInfoInputs).toLowerCase() === 'true') {
      this.setData({
        hideApInfoInputs: true
      });
    }
  },

  onShow: function () {

    if (this.global.inited) {
      this.listenWifiStateChange();
    }
  },

  onHide: function () {

    this.unlistenWifiStateChange();
  },

  init: function (successCallback) {

    apLinker.init()
      .then(result => {

        if (result) {

          successCallback();
        } else {

          this.setData({
            error: {
              title: '初始化失败',
              message: '请退出当前页面后再重试',
              retry: false
            }
          });
        }

        this.global.inited = result;
        logger.info(TAG.format('init'), 'init apLinker', result ? 'succeed' : 'failed');
      });
  },

  getConnectedWifi: function () {

    var self = this;

    apLinker.getConnectedWifi(function (result) {

      logger.log(TAG.format('getConnectedWifi'), JSON.stringify(result));
      logger.log("....tag getConnectedWifi", result, result.res);
      if (result['success']) {

        if (result['res']['wifi']['SSID'].length) {

          var ssid = result['res']['wifi']['SSID'];
          self.setData({
            wifiSsid: ssid,
            wifiPassword: getApp().getStorageValue('wifiPassword.' + ssid, ''),
            error: false
          })
        } else {

          self.setData({
            error: {
              title: '获取Wi-Fi连接信息失败',
              message: '请稍后重试',
              retry: 'getConnectedWifi'
            }
          });
        }
      } else {

        var errorCode = result['res']['errCode'];
        if (errorCode == 12005) {

          self.setData({
            error: {
              title: 'Wi-Fi已关闭',
              message: '请打开Wi-Fi后重试',
              retry: 'getConnectedWifi'
            }
          });
        } else if (errorCode == 12006) {

          self.setData({
            error: {
              title: '获取Wi-Fi连接信息失败',
              message: '请打开手机GPS位置服务后重试',
              retry: 'getConnectedWifi'
            }
          });
        } else {

          self.setData({
            error: {
              title: '获取Wi-Fi连接信息失败',
              message: '请关闭并再次打开Wi-Fi后重试',
              retry: 'getConnectedWifi'
            }
          });
        }
      }
    });
  },

  retry: function (e) {

    var type = e.target.dataset.type;
    if (type === 'getConnectedWifi') {
      this.getConnectedWifi();
    }
  },

  showWifiPassword: function () {
    this.setData({
      showWifiPassword: !this.data.showWifiPassword,
      wifiPasswordIcon: this.data.showWifiPassword ? 'icon-eye_closed' : 'icon-eye_open'
    })
  },

  bindInput: function (e) {

    var data = {};
    data[e.target.dataset.key] = e.detail.value;
    this.setData(data);
  },

  checkWifiConnection: function (option) {

    apLinker.getConnectedWifi(result => {

      logger.log(TAG.format('checkWifiConnection'), 'getConnectedWifi result-', JSON.stringify(result));

      if (result['success']) {

        var currentSsid = result['res']['wifi']['SSID'];
        if (utils.isNotBlank(currentSsid)) {

          if (currentSsid === option.ssid) {
            if (option.successCallback) {
              option.successCallback();
            }
          } else if (option.dismatchCallback) {
            option.dismatchCallback(currentSsid, option.ssid);
          }
        } else if (option.failCallback) {
          option.failCallback();
        }
      } else if (option.failCallback) {
        option.failCallback();
      }
    });
  },

  connect: function () {

    if (!this.validateForm()) {
      return;
    }

    var app = getApp();

    if (this.data.apSsid !== this.global.apLinkOptions['apSsid']) {
      app.setStorageValue('apSsid', this.data.apSsid);
    }
    app.setStorageValue('wifiPassword.' + this.data.wifiSsid, this.data.wifiPassword);

    wx.showModal({
      title: '注意',
      content: '请按提示将手机连接至无线网络 “{0}”'.format(this.data.apSsid),
      confirmText: '我知道了',
      showCancel: false
    });

    this.setData({
      manualConnectAp: { ssid: this.data.apSsid }
    });
  },

  startApLink: function () {

    var self = this;
    return new Promise((resolve, reject) => {

      self.checkWifiConnection({
        ssid: self.data.apSsid,
        successCallback: resolve,
        dismatchCallback: function (currentSsid, expectSsid) {

          wx.showModal({
            title: '警告',
            content: '当前手机无线网络为 “{0}”，请连接至 “{1}”'.format(currentSsid, expectSsid),
            confirmText: '我知道了',
            showCancel: false
          });
        },
        failCallback: function () {
          self.showTopTips('获取Wi-Fi信息失败');
        }
      });
    }).then(() => {

      return new Promise((resolve, reject) => {
        console.debug("..... start", self.data.wifiSsid, self.data.wifiPassword, self.data.apSsid, self.global.apLinkOptions);
        apLinker.start({

          wifiSsid: self.data.wifiSsid,
          wifiPassword: self.data.wifiPassword,
          apSsid: self.data.apSsid,
          userData: self.global.apLinkOptions['userData'],
          success: function () {
            logger.info(TAG.format('startApLink'), 'aplink success');
            resolve();
          },
          fail: function (res) {

            logger.warn(TAG.format('startApLink'), 'aplink fail', JSON.stringify(res));

            self.hideLoading();

            var content = '{0}：(Code: {1})'.format(res['msg'], res['code']);
            wx.showModal({
              title: '配置设备上网失败',
              content: content,
              showCancel: false,
              success: function (res) { }
            });
          },
          progress: function (res) {
            logger.log(TAG.format('startApLink'), 'aplink progress', JSON.stringify(res));
            self.showLoading(res['description']);
          }
        });
      });
    }).then(() => {

      var count = 0;
      self.showLoading("配网成功");

      var intervalId = setInterval(function () {
        console.warn("...intervalId", count);
        if (count > 40) {
          checkOriginalWifiConnectionFailed();
          return;
        }

        count++;

        self.checkWifiConnection({
          ssid: self.data.wifiSsid,
          successCallback: function () {

            checkOriginalWifiConnectionSuccess();
            wx.redirectTo({
              url: '../deviceList/deviceList',
            });
          },
          dismatchCallback: function (currentSsid, expectSsid) {
            if (currentSsid !== self.data.apSsid) {
              checkOriginalWifiConnectionFailed();
            }
          }
        });
      }, 500);

      var checkOriginalWifiConnectionFailed = function () {

        clearInterval(intervalId);
        self.hideLoading();
        self.setData({
          manualConnectAp: null,
          manualConnectOriginalAp: { ssid: self.data.wifiSsid }
        });
      };

      var checkOriginalWifiConnectionSuccess = function () {

        clearInterval(intervalId);
        self.hideLoading();
        self.setData({
          manualConnectAp: null,
          manualConnectOriginalAp: null
        });
      };
    });
  },

  stopApLink: function () {

    apLinker.stop();
    this.setData({
      manualConnectAp: null,
      manualConnectOriginalAp: null
    });
    this.getConnectedWifi();
  },

  confirmOriginalApConnection: function () {

    var self = this;

    this.checkWifiConnection({
      ssid: this.data.manualConnectOriginalAp.ssid,
      successCallback: function () {
        wx.redirectTo({
          url: '../deviceList/deviceList',
        });
      },
      dismatchCallback: function (currentSsid, expectSsid) {

        wx.showModal({
          title: '警告',
          content: '当前手机无线网络为 “{0}”，请连接至 “{1}”'.format(currentSsid, expectSsid),
          confirmText: '我知道了',
          showCancel: false
        });
      },
      failCallback: function () {
        self.showTopTips('获取Wi-Fi信息失败');
      }
    });
  },

  validateForm: function () {

    if (utils.isEmpty(this.data.apSsid) || !this.data.apSsid.length) {

      this.showTopTips('AP SSID 不能为空');
      return false;
    }

    if (utils.isEmpty(this.data.wifiSsid) || !this.data.wifiSsid.length) {

      this.showTopTips('未获得当前连接的Wi-Fi SSID');
      return false;
    }

    var wifiPasswordByteLength = aesjs.utils.utf8.toBytes(this.data.wifiPassword).length;
    if ((wifiPasswordByteLength >= 1 && wifiPasswordByteLength <= 4) || (wifiPasswordByteLength >= 6 && wifiPasswordByteLength <= 7)
      || wifiPasswordByteLength > 64) {
      this.showTopTips('Wi-Fi密码格式错误');
      return false;
    }

    return true;
  },

  showTopTips: function (tips) {

    if (this.global.topTipsDismissTimer != -1) {
      clearTimeout(topTipsDismissTimer);
    }

    this.setData({
      tips: tips
    });

    var self = this;
    topTipsDismissTimer = setTimeout(function () {

      self.setData({
        tips: false
      });
    }, 1000);
  },

  listenWifiStateChange: function () {

    var self = this;
    apLinker.listenWifiStateChange(function (connected, info) {
      console.info("... listenWifiStateChange", info);
      if (self.data.manualConnectAp || self.data.manualConnectOriginalAp) {
        return;
      }

      logger.log(TAG.format('onWifiStateChanged'), 'listenWifiStateChange', JSON.stringify(connected));

      self.setData({
        wifiConnected: connected
      });

      if (connected) {
        self.getConnectedWifi();
      }
    });
  },

  unlistenWifiStateChange: function () {
    apLinker.unlistenWifiStateChange();
  },

  showLoading: function (text) {
    this.setData({
      loading: text
    });
  },

  hideLoading: function () {
    this.setData({
      loading: false
    });
  }
});