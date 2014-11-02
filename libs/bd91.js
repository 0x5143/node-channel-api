
var util = require('util');
var crypto = require('crypto');
var request = require('request');
var qs = require('querystring');

var Channel = require('./base');
var ErrorCode = require('./error');

/**
 * 百度91渠道
 */
function BD91Channel(conf) {
    this.conf = conf;

    this.urlTokenCheck = 'http://service.sj.91.com/usercenter/AP.aspx';
}

util.inherits(BD91Channel, Channel);

BD91Channel.prototype.doAccessTokenCheck = function(userid, token, callback) {
    var self = this;

    var prestr = '' + self.conf.appid + 4 + userid + token + self.conf.secret;
    var sign = crypto.createHash('md5').update(prestr, 'utf8').digest('hex');

    request({
        url: self.urlTokenCheck,
        qs: {
            AppId: self.conf.appid,
            Act: 4,
            Uin: userid,
            SessionId: token,
            Sign: sign
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

        switch (body.ErrorCode) {
            case "1":
            {
                return callback();
            }
            case "2":
            {
                return callback(ErrorCode.kChannelAppIDError);
            }
            case "3":
            {
                return callback(ErrorCode.kChannelRequestParamsNotCorrect);
            }
            case "4":
            {
                return callback(ErrorCode.kChannelRequestParamsNotCorrect);
            }
            case "5":
            {
                return callback(ErrorCode.kChannelSessionError);
            }
            case "0":
            default:
            {
                return callback(ErrorCode.kChannelUndefinedErrorCode);
            }
        }
    });
};

BD91Channel.prototype.doReceiptCheck = function(receipt, callback) {
    var self = this;
    var params = qs.parse(receipt);

    var userid = params.Uin;

    if (this.conf.appid != params.AppId) {
        return callback(ErrorCode.kChannelAppIDError, '', false)
    }

    if (params.Act != 1) {
        return callback(ErrorCode.kChannelAppIDError, '', false)
    }

    var prestr = '' + self.conf.appid + 1;
    prestr += params.ProductName;
    prestr += params.ConsumeStreamId;
    prestr += params.CooOrderSerial;
    prestr += userid;
    prestr += params.GoodsId;
    prestr += params.GoodsInfo;
    prestr += params.GoodsCount;
    prestr += params.OriginalMoney;
    prestr += params.OrderMoney;
    prestr += params.Note;
    prestr += params.PayStatus;
    prestr += params.CreateTime;
    prestr += self.conf.secret;
    var sign = crypto.createHash('md5').update(prestr, 'utf8').digest('hex');
    if (sign !== params.Sign) {
        return callback(ErrorCode.kChannelSignError, '', false);
    }

    var isValid = false;
    var order = null;
    if (params.PayStatus == 1) {
        isValid = true;
        order = {
            'sid': parseInt(params.Note, 10),
            'streamid': params.ConsumeStreamId,
            'orderid': params.CooOrderSerial,
            'name': params.ProductName,
            'goods': params.GoodsId,
            'count': parseInt(params.GoodsCount, 10),
            'price': Math.ceil(parseFloat(params.OriginalMoney) * 100),
            'money': Math.ceil(parseFloat(params.OrderMoney) * 100),
            'userid': userid,
            'uptime': Math.ceil(Date.parse(params.CreateTime) / 1000)
        };
    }

    return callback(null, '{"ErrorCode":"1","ErrorDesc":"接收成功"}', isValid, order);
};

module.exports = BD91Channel;