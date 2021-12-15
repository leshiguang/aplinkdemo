# 20211123 init

# 配网流程 
##### 旧版的是我们知道设备的sn码或者设备id，通过服务器获取设备配对的时候的热点，然后让用户选择需要配置的ssid，并输入密码，然后再调用配网，并持续调用某个接口以判断设备配网成功，但是经常会出现接口报错，
##### 新版简单化，由用户去选择需要配置的ssid，并输入密码，然后让用户连接到设备的热点，最后调用配网接口，如果没有报错直接判定成功。

* 存储需要配网的ssid与密码
```javascript
    const apLinker = require('sg-aplink');

    // 这个接口是获取当前的wifi
    apLinker.getConnectedWifi(function (result) {
      if (result['success']) {
        if (result['res']['wifi']['SSID'].length) {
          var ssid = result['res']['wifi']['SSID'];
          
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

```


* 找到设备的热点并连接（一般设备配网的热点是lx_xxxxxxxxx格式）
  
```javascript
    const apLinker = require('sg-aplink');

    // 这个接口是获取当前wifi的ssid
    apLinker.getConnectedWifi(function (result) {
      if (result['success']) {
        if (result['res']['wifi']['SSID'].length) {
          var ssid = result['res']['wifi']['SSID'];
          
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
  }
```

* 然后调用ap配网的接口

```javascript
    const apLinker = require('sg-aplink');
    apLinker.start({
          wifiSsid: self.data.wifiSsid,
          wifiPassword: self.data.wifiPassword,
          apSsid: self.data.apSsid,     // 
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
        });
      });
    })

```

