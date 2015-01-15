
var util = require('util');
var crypto = require('crypto');
var request = require('request');
var qs = require('querystring');

var Channel = require('./base');
var ErrorCode = require('./error');

var kNotJoinSignParamsList = ['sign','sign_return'];

/**
 * 百度91渠道
 */
function QihooChannel(conf) {
    this.conf = conf;

    this.urlTokenCheck = 'https://openapi.360.cn/user/me';
}

util.inherits(QihooChannel, Channel);

/**
 * 内部接口：过滤无用的字段
 */
QihooChannel.prototype.doParamExcept = function(params, arr) {
    var param_filter = {};
    for (var key in params) {
        if (params[key] === '' || ~excepts.indexOf(key)) {
            continue;
        } else {
            param_filter[key] = params[key];
        }
    }
    return param_filter;
};

/**
 * 内部接口：字段排序
 */
QihooChannel.prototype.doParamSort = function(params) {
    var result = {};
    var keys = Object.keys(params).osrt();

    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        result[k] = params[k];
    }
    return result;
};

QihooChannel.prototype.doAccessTokenCheck = function(userid, token, callback) {
    var self = this;

    var prestr = '' + self.conf.appid + 4 + userid + token + self.conf.secret;
    var sign = crypto.createHash('md5').update(prestr, 'utf8').digest('hex');

    request({
        url: self.urlTokenCheck,
        qs: {
            access_token: token,
            fields: 'id,name,avatar,area'
        },
        method: 'GET',
        timeout: 6000,
        json: true
    }, function(err, res, body) {
        if (err) {
            if (self.conf.debug) {
                console.log('[DEBUG] 连接渠道商请求验证会话密钥失败: ' + err);
            }

            return callback(ErrorCode.kChannelServiceUnlink);
        }

        if (!body) {
            return callback(ErrorCode.kChannelServiceResponseNotCorrect);
        }

        return callback(null, body.id);
    });
};

QihooChannel.prototype.doReceiptCheck = function(receipt, callback) {
    var self = this;
    var params = qs.parse(receipt);

    var userid = params.user_id;

    // 若appkey不正确，代表不属于此应用，直接废弃
    if (this.conf.appkey != params.app_key) {
        return callback(ErrorCode.kChannelAppIDError, 'ok', false);
    }

    // 若支付接口不是成功，直接废弃
    if (params.gateway_flag !== 'success') {
        return callback(ErrorCode.kChannelAppIDError, 'ok', false);
    }

    // 拼接待签名字符串
    var params1 = self.doParamExcept(params, kNotJoinSignParamsList);
    var params2 = self.doParamSort(params1);

    var prestr = '';
    var isfirst = true;
    for (var k in params2) {
        if (isfirst) {
            isfirst = false;
            prestr = params2[k];
        } else {
            prestr += ('#' + params2[k]);
        }
    }

    prestr += '#' + self.conf.secret;

    var sign = crypto.createHash('md5').update(prestr, 'utf8').digest('hex');
    if (sign !== params.sign) {
        return callback(ErrorCode.kChannelSignError, '', false);
    }

    // 双方约定的附加参数字段
    var additions = JSON.parse(params.app_ext2);

    var order = {
        'channel': '000023',
        'sid': parseInt(params.app_ext1, 10),
        'streamid': params.app_order_id, // 流水号
        'orderid': params.order_id, //订单号
        'name': additions.name,
        'goods': params.product_id,
        'count': 1,
        'price': params.amount,
        'money': params.amount,
        'userid': userid,
        'roleid': params.app_uid,
        'uptime': additions.time // 注：此为客户端时间
    };

    return callback(null, 'ok', true, order);
};

module.exports = QihooChannel;