const { ipcRenderer } = require('electron');
const fs = require("fs");
const path = require('path');
const { token, url } = require('../../bin/data_init')
// const Store = require('electron-store');

function transform_data_toString(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].file_size > 1048576 && arr[i].file_size <= 1073741824) {
            arr[i].file_size = `${(arr[i].file_size / 1048576).toFixed(2)} MB`
        } else if (arr[i].file_size > 1073741824) {
            arr[i].file_size = `${(arr[i].file_size / 1073741824).toFixed(2)} GB`
        } else if (arr[i].file_size > 1024 && arr[i].file_size <= 1048576) {
            arr[i].file_size = `${(arr[i].file_size / 1024).toFixed(2)} KB`
        } else if (arr[i].file_size < 1024) {
            arr[i].file_size = `${arr[i].file_size} B`
        }
    }
    return (arr)
}

function updateRender(table, data) {
    table.render({
        elem: '#upload_all'
        , height: 480
        , limit: 1000
        , cols: [[{ type: 'checkbox', fixed: 'left' }
            , { field: 'file_name', title: '文件名', width: 160, sort: true, fixed: 'left' }
            , { field: 'file_size', title: '文件大小', width: 107, sort: true }
            , { field: 'note', title: '备注', width: 237, edit: 'text' }
            , { fixed: 'right', title: '操作', width: 72, toolbar: '#bar' }
        ]]
        , data: data
        , even: true
        // , page: true
    });
}


ipcRenderer.on('renderer-upload', function (event, arg) { // 接收到Main进程返回的消息
    if (arg.canceled === false) {
        var file_list = arg.filePaths
        for (var i = 0; i < file_list.length; i++) {
            var stats = fs.statSync(file_list[i])
            var fileSizeInBytes = stats["size"]
            var file_name = path.basename(file_list[i])
            // console.log(file_name, fileSizeInBytes);
            show_data.push({
                file_name: file_name,
                file_size: fileSizeInBytes,
                note: "",
                LAY_CHECKED: true,
                file_size_int: fileSizeInBytes,
                file_path: file_list[i],
                local_id: Math.random()
            })
        }

        show_data = transform_data_toString(show_data)

        console.log(show_data);
        updateRender(table, show_data)
    }
})


var table;
var show_data = []

// const store = new Store();
// store.set('fileSys', []);
// console.log(store.get('fileSys'));

layui.use('table', function () {
    table = layui.table;
    updateRender(table, [])
    table.on('tool(upload_all)', function (obj) {
        obj.del();
    })
});

$("#close").click(() => {
    ipcRenderer.send('main', 'close_upload')
})

$("#choose").click(() => {
    ipcRenderer.send('main', 'open_selector')
})

var btn_upload_class = "btn btn-default share_opera_btn btn-success"
var btn_upload_stare = true // 这个按钮是否有效

var element = layui.element;

$("#upload").click(() => {
    var all = table.checkStatus('upload_all');
    var all_need_upload_num = all.data.length
    if (btn_upload_stare && (all_need_upload_num !== 0)) {
        $("#upload").attr("class", `${btn_upload_class} disabled`)
        btn_upload_stare = false

        var counter_upload = 0

        for (var i of all.data) {
            // console.log(i);
            $.ajax({
                url: `http://${url}/upload_file_metadata`,
                type: 'get',
                dataType: 'json',
                data: {
                    token: token,
                    file_size: i.file_size_int,
                    file_name: i.file_name,
                    note: i.note,
                    file_path: i.file_path
                },
                success: function (response) {
                    if (response.code === 11000) {
                        all_need_upload_num--
                        element.progress('updata', `${parseInt((counter_upload / all.data.length)*100)}%`)
                        counter_upload++;
                        console.log(counter_upload, all.data.length);
                        console.log(parseInt(counter_upload / all.data.length));
                        console.log(`${parseInt(counter_upload / all.data.length)}%`);
                        // var data_local = store.get('fileSys')
                        // data_local.push({
                        //     file_id: response.value,
                        //     file_path:i.file_path
                        // })
                        // store.set('fileSys',data_local);
                        if (all_need_upload_num === 0) {
                            ipcRenderer.send('main', 'close_upload_msg')
                        }
                    } else {
                        let myNotification = new Notification('意外', {
                            body: `${response.value}`
                        })
                        myNotification.show()
                    }
                }
            })

        }
    }
})

$("#delete").click(() => {
    var all = table.checkStatus('upload_all');
    console.log(all);
    for (var item of all.data) {
        for (var i = 0; i < show_data.length; i++) {
            if (show_data[i].local_id === item.local_id) {
                show_data.splice(i, 1)
                break
            }
        }
    }
    updateRender(table, show_data)
})