/**
 * index.js
 */

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var ErrorCode = require('./libs/error');

var BD91Channel = require('./libs/bd91');

function ChannelManager(conf) {
    EventEmitter.call(this);

    this.channels = {};

    for (var i = 0; i < conf.length; i++) {
        var c = conf[i];
        switch (c.channel) {
            case '000007': //百度91渠道
            {
                this.channels[c.channel] = new BD91Channel(c);
                break;
            }
            default:
            {
                break;
            }
        }
    }
}

util.inherits(ChannelManager, EventEmitter);

/**
 * 验证会话密钥<br>
 * 
 * 若验证通过，返回对应的用户编号
 * 若验证失败，返回对应的失败原因或错误原因
 */
ChannelManager.prototype.doAccessTokenCheck = function(channelid, userid, token, callback) {
    if (!channelid || !userid || !token) {
        return callback(ErrorCode.kInvokeArgsNotCorrect);
    }

    var channel_ob = this.channels[channelid];
    if (!channel_ob) {
        return callback(ErrorCode.kChannelUndefined);
    }
    
    channel_ob.doAccessTokenCheck(userid, token, callback);
};

/**
 * 验证支付结果
 */
ChannelManager.prototype.doReceiptCheck = function(channelid, receipt, callback) {
    var channel_ob = this.channels[channelid];
    if (!channel_ob) {
        return callback(ErrorCode.kChannelUndefined);
    }

    channel_ob.doReceiptCheck(receipt, callback);
};

module.exports = ChannelManager;
