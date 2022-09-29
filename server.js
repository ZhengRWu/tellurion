const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer();
// var crypto = require('crypto');
const fs = require('fs');
// const HashMap = require("hashmap")
const {token_, url_} = require('./res/bin/data_init');

const io = new Server(httpServer, {
    // options
});

async function big_file_send_chunk(fd, file_size, target_section, all_section) {
    var peer_section;
    if(all_section === 0){
        peer_section = file_size
    }else{
        peer_section = parseInt(file_size / all_section)
    }
    var start_num = target_section * peer_section
    if (target_section === all_section) {
        // 如果读文件末尾，则全部读取
        peer_section = file_size - start_num
    }
    var buff = Buffer.alloc(peer_section)
    return new Promise((resolve, reject) => {
        fs.read(fd, buff, 0, peer_section, start_num, (err, bytesRead, buffer) => {
            if (err) {
                console.error(err)
            }
            console.log(`读取到的字节数：` + bytesRead)
            if (bytesRead === 0) {
                console.log("未读取任何字符")
                resolve({ state: false })
            }
            // console.log(buffer)
            // console.log(buff)
            console.log('读取成功')
            resolve({ state: true, data: buffer })
        })
    })
}

var get_target_file = (file_id)=>{
    return new Promise((resolve, reject)=>{
        $.ajax({
            url: `http://${url_}/get_target_file`,
            type: 'get',
            dataType: 'json',
            data: {
                token: token_,
                file_id: file_id
            },
            success: function (response) {
                if(response.code === 11000){
                    resolve(response.data.file_path)
                }
            }
        })
    })
}


io.on("connection", (socket) => {
    socket.on("sendMsg", async (data) => {
        var file_dir = hmap.get(data.file_id)
        if(file_dir === undefined){
            file_dir = await get_target_file(data.file_id)
            // console.log(file_dir);
            hmap.set(data.file_id, file_dir)
        }
        // console.log(file_dir);
        // file_dir = hmap.get("114325")
        try{
            var stats = fs.statSync(file_dir)
        }catch(err){
            var str_err = err.toString()
            console.log(str_err);
            if(str_err.indexOf("ENOENT")>=0){
                console.log("file fly out");
                socket.emit("pushMsg", "FNF")  //file not found
                return
            }else{
                console.log(321);
            }
        }

        fs.open(file_dir, 'r', async (err, fd) => {
            if (err) {
                throw err
            }
            var file_data = await big_file_send_chunk(fd, stats.size, data.counter, data.chunks_num)
            if (file_data.state === true) {
                console.log(file_data.data);
                // var rand_data = crypto.randomBytes(1024*1024*10)
                socket.emit("pushMsg", file_data.data)
            }else if(file_data.state === false){
                socket.emit("pushMsg", "END")
            }
        })

    })
})

httpServer.listen(3000);
console.log('start listen');
var hmap = new HashMap()
// hmap.set("114325", "/Volumes/Seagate Media/录屏/meeting_record.movs")