const { io } = require("socket.io-client")
var fs = require('fs');
const path = require("path");
const { BrowserWindow } = require('electron')

// function download_from_target(mainWindow, url, target) {
//     // 'target' is the location where the file is downloaded
//     mainWindow.webContents.downloadURL(url)
//     mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
//         item.setSavePath(target)
//         let prevReceivedBytes = 0 // 用于计算下载速度
//         let prevReceicedTime = new Date().getTime()
//         item.on('updated', (event, state) => {
//             if (state === 'interrupted') {
//                 console.log('Download is interrupted but can be resumed!!!')
//             } else if (state === 'progressing') {
//                 if (item.isPaused()) {
//                     console.log('Download is paused!!!')
//                 } else {
//                     // 计算下载进度
//                     // var progress = item.getReceivedBytes() / item.getTotalBytes() * 100
//                     var now_time = new Date().getTime()
//                     var speed = ((item.getReceivedBytes() - prevReceivedBytes) / (now_time - prevReceicedTime)) * 1000 / 1048576  // MB/s
//                     prevReceivedBytes = item.getReceivedBytes()
//                     prevReceicedTime = now_time

//                     console.log(`Received bytes:${item.getReceivedBytes()};  totalbyte:${item.getTotalBytes()};  speed:${speed}`);

//                     //下面写一个控制界面显示的函数
//                 }
//             }
//         })
//         item.once('done', (event, state) => {
//             if (state === 'completed') {
//                 console.log('Download successfully')
//             } else {
//                 console.log(`Download failed: ${state}`)
//             }
//         })
//     })
// }

// let file_transfer = async (mainWindow, server_ip, socket_server_port, index, target, file_name) => {
//     // 'target' is the location where the file is downloaded
//     const download_file_name = file_name
//     const download_file_path = target
//     var socket = io.connect(`http://${server_ip}:${socket_server_port}`)
//     function send(index) {
//         socket.emit('sendMsg', { type: "download_pre_request", file_id: "123", fb_num: 8, target_fd: index })
//         //这里可以定制的，file_id为tracker服务器端的文件id号，fb_num为文件分块块数，target_fd为当前请求的文件块数
//     }
//     return new Promise((resolve, reject) => {
//         socket.on('pushMsg', (data) => {
//             var file_port = null
//             if (data.type === "file_port") {
//                 file_port = data.value

//                 if (!fs.existsSync(download_file_path)) {
//                     fs.mkdirSync(download_file_path);
//                 }
//                 var cache_file_path = path.join(download_file_path, `${download_file_name}.T${index}`)
//                 // 下载的代码
//             }
//             resolve(data)
//         })
//         send(index)
//     })
// }

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

async function download_from_target(mainWindow, target, url) {
    console.log("chayan");
    // 'target' is the location where the file is downloaded
    return new Promise((resolve, reject) => {
        console.log("chayan2");
        mainWindow.webContents.session.clearAuthCache()
        mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
            console.log(url);
            item.setSavePath(target)
            let prevReceivedBytes = 0 // 用于计算下载速度
            let prevReceicedTime = new Date().getTime()
            item.on('updated', (event, state) => {
                if (state === 'interrupted') {
                    console.log('Download is interrupted but can be resumed!!!')
                } else if (state === 'progressing') {
                    if (item.isPaused()) {
                        console.log('Download is paused!!!')
                    } else {
                        // 计算下载进度
                        // var progress = item.getReceivedBytes() / item.getTotalBytes() * 100
                        var now_time = new Date().getTime()
                        var speed = ((item.getReceivedBytes() - prevReceivedBytes) / (now_time - prevReceicedTime)) * 1000 / 1048576  // MB/s
                        prevReceivedBytes = item.getReceivedBytes()
                        prevReceicedTime = now_time

                        console.log(`Received bytes:${item.getReceivedBytes()};  totalbyte:${item.getTotalBytes()};  speed:${speed}`);

                        //下面写一个控制界面显示的函数
                    }
                }
            })
            item.once('done', (event, state) => {
                if (state === 'completed') {
                    console.log('Download successfully')
                    mainWindow.webContents.session.clearAuthCache()
                    resolve("successfully")
                } else {
                    console.log(`Download failed: ${state}`)
                    resolve("failed")
                }
            })
        })
        mainWindow.webContents.downloadURL(url)
    })
}

class TClient {
    constructor(mainWindow, server_ip, socket_server_port, file_name, target) {  // 这里还有个file_id不要忘了
        // 'target' is the location where the file is downloaded
        this.mainWindow = mainWindow
        this.server_ip = server_ip
        this.socket_server_port = socket_server_port
        this.file_name = file_name
        this.fb_num = 8 // 这里以后改为根据文件大小自动生成
        this.target = target
        // console.log(this.mainWindow);
    }

    async file_transfer(index) {
        const download_file_name = this.file_name
        const fb_num = this.fb_num
        const mainWindow = this.mainWindow
        const server_ip = this.server_ip
        const socket_server_port = this.socket_server_port
        const download_file_path = this.target
        var socket = io.connect(`http://${server_ip}:${socket_server_port}`)
        function send_request(index) {
            socket.emit('sendMsg', { type: "download_pre_request", file_id: "123", fb_num: fb_num, target_fd: index })
            //这里可以定制的，file_id为tracker服务器端的文件id号，fb_num为文件分块块数，target_fd为当前请求的文件块数
        }
        return new Promise((resolve, reject) => {
            socket.on('pushMsg', async (data) => {
                // console.log(data)
                var file_port = null
                if (data.type === "file_port") {
                    file_port = data.value

                    if (!fs.existsSync(download_file_path)) {
                        fs.mkdirSync(download_file_path);
                    }
                    var cache_file_path = path.join(download_file_path, `${download_file_name}.T${index}`)
                    console.log(cache_file_path);
                    var down_result = await download_from_target(mainWindow, cache_file_path, `http://${server_ip}:${file_port}/${index}`)
                    if (down_result === "successfully") {
                        socket.emit('sendMsg', { type: "download_end" })
                    } else if (down_result === "failed") { }
                } else if (data.type === 'port_close') {
                    console.log(123);
                    resolve("successfully")
                }
            })
            send_request(index)
        })
    }

}

module.exports = TClient