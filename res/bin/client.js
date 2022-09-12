const { io } = require("socket.io-client")
var fs = require('fs');
// const sleep = require("system-sleep")
// const server_ip = "192.168.0.157"
// const server_ip = "192.168.0.145"
// const socket_server_port = "3000"

function transform_data_toString(data) {
    if (data > 1048576 && data <= 1073741824) {
        data = `${(data / 1048576).toFixed(2)} MB`
    } else if (data > 1073741824) {
        data = `${(data / 1073741824).toFixed(2)} GB`
    } else if (data > 1024 && data <= 1048576) {
        data = `${(data / 1024).toFixed(2)} KB`
    } else if (data < 1024) {
        data = `${data} B`
    }
    return (data)
}

var SWICH = { pause: true, continue: false }

function pause_and_continue(switch_, id_date) {
    // 开关为true，则暂停
    if (switch_) {
        $(`#${id_date}_pause`).hide()
        $(`#${id_date}_continue`).show()
    } else {
        $(`#${id_date}_pause`).show()
        $(`#${id_date}_continue`).hide()
    }
}


class Download {
    constructor(render, server_ip, socket_server_port, chunks_num, save_path, file_id, file_size) {
        this.render = render
        this.server_ip = server_ip
        this.socket_server_port = socket_server_port
        this.socket = null
        this.breakpoint = 0
        this.chunks_num = chunks_num
        this.save_path = save_path
        this.file_id = file_id
        this.file_size = file_size

        var that = this

        
        $(`#${this.render.id_date}_pause`).click(() => {
            pause_and_continue(SWICH.pause,that.render.id_date)
            $(`#${that.render.id_date}_speed`).text("--/s") 
            that.pause()
        })

        $(`#${this.render.id_date}_continue`).click(() => {
            // pause_and_continue(SWICH.continue,that.render.id_date)
            that.continue()
        })
    }
    creat_socket() {
        var server_ip = this.server_ip
        var socket_server_port = this.socket_server_port
        this.socket = io.connect(`http://${server_ip}:${socket_server_port}`)
    }

    download() {
        if (this.socket === undefined) {
            console.error("未创建socket，先使用creat_socket()创建socket");
            return
        }
        var chunks_num = this.chunks_num
        var save_path = this.save_path
        var that = this
        var socket = this.socket
        var old_time = new Date().getTime()
        var counter = this.breakpoint
        var all_reciece_size = 0

        pause_and_continue(SWICH.continue,that.render.id_date)

        socket.on('pushMsg', (data) => {
            if(data === "FNF"){
                var myNotification = new Notification('意外发生', {
                    body: '目标服务器文件不存在或移动位置'
                })
                pause_and_continue(SWICH.pause,that.render.id_date)
                taht.socket.close()
                return
            }
            var speed_int = data.length / (new Date().getTime() - old_time) * 1000;

            var speed_str = `${transform_data_toString(speed_int)}/s`

            all_reciece_size += data.length
            $(`#${that.render.id_date}_speed`).text(speed_str) // 有问题这个儿，无效
            $(`#${that.render.id_date}_num`).text(`${transform_data_toString(all_reciece_size)}/${that.file_size}`) // 有问题这个儿，无效
            old_time = new Date().getTime()
            // console.log(`recieve:${data.length};  (${counter}/${chunks_num})`);
            that.render.element.progress(that.render.id_date, `${parseInt((counter / chunks_num) * 100)}%`)
            // console.log(that.render.element);
            if (counter <= chunks_num) {
                counter = counter + 1
                that.breakpoint = counter
                fs.open(save_path, 'a', function (err, fd) {
                    if (err) {
                        console.log('Cant open file');
                        console.log(err);
                    }
                    fs.write(fd, data, 0, data.length,
                        null, function (err, writtenbytes) {
                            // console.log(writtenbytes + ' characters added to file');
                            if (counter < chunks_num + 1) {
                                socket.emit('sendMsg', { counter: counter, file_id: that.file_id })
                            }
                        })
                })
            }
        })
        socket.emit('sendMsg', { counter: counter, file_id: that.file_id })
        old_time = new Date().getTime()
    }

    close() {
        this.socket.close()
    }

    pause() {
        this.socket.close()
    }

    continue() {
        this.creat_socket()
        this.download()
    }
}

// var flie_download = new Download(server_ip, socket_server_port, 512, 'out.mov',"114325")
// flie_download.creat_socket()
// flie_download.download()


module.exports = Download