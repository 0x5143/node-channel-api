/**
 * 工具集通用错误定义集
 */

module.exports = {
    kInvokeArgsNotCorrect: {
        "error": "内部调用参数不正确",
        "code": 100
    },
    kChannelUndefined: {
        "error": "渠道数据未配置",
        "code": 1000
    },
    kChannelServiceUnlink: {
        "error": "连接渠道服务器失败",
        "code": 1001
    },
    kChannelServiceResponseNotCorrect: {
        "error": "渠道返回内容与文档描述不符",
        "code": 1002
    },
    kChannelUndefinedErrorCode: {
        "error": "渠道错误码未知定义",
        "code": 1003
    },
    kChannelAppIDError: {
        "error": "渠道应用编号无效",
        "code": 1004
    },
    kChannelRequestParamsNotCorrect: {
        "error": "渠道请求参数不正确",
        "code": 1005
    },
    kChannelSignError: {
        "error": "渠道请求时签名错误",
        "code": 1006
    },
    kChannelSessionError: {
        "error": "渠道请求时会话密钥错误",
        "code": 1007
    }
};