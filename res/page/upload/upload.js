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
        , height: 527
        , cols: [[{ type: 'checkbox', fixed: 'left' }
            , { field: 'file_name', title: '文件名', width: 160, sort: true, fixed: 'left' }
            , { field: 'file_size', title: '文件大小', width: 107, sort: true }
            , { field: 'note', title: '备注', width: 197, edit: 'text' }
            , { fixed: 'right', title: '操作', width: 122, toolbar: '#barDel' }
        ]]
        , data: data
        //,skin: 'line' //表格风格
        , even: true
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
                file_path: file_list[i]
            })
        }

        show_data = transform_data_toString(show_data)

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
    //展示已知数据
});

$("#close").click(() => {
    ipcRenderer.send('main', 'close_upload')
})

$("#choose").click(() => {
    ipcRenderer.send('main', 'open_selector')
})

var btn_upload_class = "btn btn-default share_opera_btn btn-success"
var btn_upload_stare = true // 这个按钮是否有效

$("#upload").click(() => {
    var all = table.checkStatus('upload_all');
    var all_need_upload_num = all.data.length
    if (btn_upload_stare && (all_need_upload_num !== 0)) {
        $("#upload").attr("class", `${btn_upload_class} disabled`)
        btn_upload_stare = false

        for (var i of all.data) {
            console.log(i);
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