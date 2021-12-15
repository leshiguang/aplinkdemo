// pages/smartApLink/guide/guide.js
const utils = require('../../../utils');
const logger = require('../../../logger');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    guideTexts: ['按配网键进入小程序配网', '打开手机Wi-Fi', '输入Wi-Fi密码及AP SSID后连接']
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {

    var guide = getApp().getApLinkOptions()['guide'];
    if (guide) {

      var platform = 'android';
      var systemInfo = wx.getSystemInfoSync();
      if (!utils.isEmpty(systemInfo['system']) && /.*ios.*/i.test(systemInfo['system'])) {
        platform = 'ios';
      }

      var texts = guide[platform];
      if (!texts) {
        texts = platform === 'android' ? guide['ios'] : guide['android'];
      }
      if (texts) {
        this.setData({
          guideTexts: texts
        })
      }
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  go2ApLink: function() {

    wx.navigateTo({
      url: '../apLink/apLink',
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {
        logger.info('navigateTo apLink/apLink', JSON.stringify(res))
      },
    })
  }
})