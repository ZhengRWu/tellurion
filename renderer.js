const { ipcRenderer } = require('electron');
const { setLanguage } = require('./res/language/muti_lang')
const Download = require("./res/bin/client")

ipcRenderer.on('renderer-index', function (event, arg) { // 接收到Main进程返回的消息
    const message = `异步消息回复: ${arg}`
    console.log(message)

})

// ipcRenderer.send('main', 'open_login')  //打开登录界面

document.getElementById("close").addEventListener("click", function () {
    ipcRenderer.send('main', 'close_index')
})

// 最小化程序到托盘
document.getElementById("mini").addEventListener("click", function () {
    ipcRenderer.send('main', 'mini_index')
})

// setLanguage("en_US")

const server_ip = "192.168.0.145"
const socket_server_port = "3000"

$('#dl_main').hide()
$('#already_main').show()


// var flie_download = new Download(server_ip, socket_server_port, 512, 'out.mov', "114325")
// flie_download.creat_socket()
// flie_download.download()