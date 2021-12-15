// miniprogram/pages/smartApLink/deviceList/deviceList.js
const apLinker = require('sg-aplink');
const utils = require('../../../utils');
const logger = require('../../../logger');
var TAG = 'page.smartApLink/deviceList/deviceList.{0}:'

Page({

  options: null,

  /**
   * 页面的初始数据
   */
  data: {
    devices: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.options = options;
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

    var options = getApp().getApLinkOptions();

    var apSsid = options['apSsid'];
    if (utils.isBlank(apSsid)) {
      apSsid = null;
    }
    logger.log(TAG.format('startDeviceDiscovery'), 'apSsid-', apSsid);

    var self = this;
    apLinker.startDeviceDiscovery({
      apSsid: apSsid,
      onDeviceFound: function (device) {

        logger.log(TAG.format('startDeviceDiscovery'), 'onDeviceFound', JSON.stringify(device));

        var devices = self.data.devices;
        for (var i = 0; i < devices.length; i++) {
          if (device['mac'] === devices[i]['mac']) {
            return;
          }
        }

        devices.push(device);
        self.setData({
          devices: devices
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    apLinker.stopDeviceDiscovery();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    apLinker.stopDeviceDiscovery();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  go2ApLink: function () {

    wx.redirectTo({
      url: '../apLink/apLink'
    });
  },

  goBack2ReferrenMinApp(e) {

    var device = e.currentTarget.dataset.device;
    logger.info(TAG.format('goBack2ReferrenMinApp'), 'device->', JSON.stringify(device));

    var referrerAppInfo = getApp().referrerInfo;
    if (referrerAppInfo && referrerAppInfo['appId']) {

      wx.navigateBackMiniProgram({
        extraData: {
          mid: device['mid'],
          mac: device['mac'],
          ip: device['ip']
        },
        complete: function (res) {
          logger.log(TAG.format('goBack2ReferrenMinApp'), 'wx.navigateBackMiniProgram complete', JSON.stringify(res));
        },
      })
    }
  }
})