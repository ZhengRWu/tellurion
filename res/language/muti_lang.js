// $("[name='file_lib']").text("123")
const en_US = require('./en_US.json')

module.exports.setLanguage = function (language) {
    if (language === "en_US") {
        for (var i = 0; i < en_US.length; i++) {
            $(`[name='${en_US[i].name}']`).text(`${en_US[i].value}`)
        }
        $("#mini").attr("style","margin-left: 452px;-webkit-app-region: no-drag;") // 调整主界面按钮样式
    }
}
