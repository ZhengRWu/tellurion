const { ipcRenderer } = require('electron');
const {token, url} = require('./res/bin/data_init');
const Download = require("./res/bin/client")
const path = require('path');
const { add_item } = require('./res/bin/item.js')

function get_file_list(table, token) {
    table.render({
        elem: '#file_all'
        , height: 527
        , url: `http://${url}/get_file_list/?token=${token}` //数据接口
        , page: true //开启分页
        , count: 20
        , limit: 10
        , toolbar: '#toolbarDemo'
        , defaultToolbar: ['exports']
        , cols: [[ //表头
            { type: 'checkbox', fixed: 'left' }
            , { field: 'file_name', title: '文件名', width: 160, sort: true, fixed: 'left' }
            , { field: 'user_name', title: '上传用户', width: 90 }
            , { field: 'file_size', title: '文件大小', width: 107, sort: true }
            , { field: 'date', title: '上传日期', width: 102, sort: true }
            , { field: 'note', title: '备注', width: 183 }
            , { fixed: 'right', title: '操作', width: 70, toolbar: '#barDown' }
        ]]
    });
    add_bt()
}

var add_bt = () => {
    document.getElementById("search_bt").addEventListener('click', function () {
        var user_name = $('#user_name').val()
        var file_name = $('#file_name').val()
        f_name_save = file_name
        u_name_save = user_name
        if (user_name === '' && file_name === '') {
            get_file_list(table, token)
            return
        }
        table.render({
            elem: '#file_all'
            , height: 527
            , url: `http://${url}/search_file/?token=${token}&user_name=${user_name}&file_name=${file_name}` //数据接口
            , page: true //开启分页 
            , count: 20
            , limit: 10
            , toolbar: '#toolbarDemo'
            , defaultToolbar: ['exports']
            , cols: [[ //表头
                { type: 'checkbox', fixed: 'left' }
                , { field: 'file_name', title: '文件名', width: 160, sort: true, fixed: 'left' }
                , { field: 'user_name', title: '上传用户', width: 90 }
                , { field: 'file_size', title: '文件大小', width: 107, sort: true }
                , { field: 'date', title: '上传日期', width: 102, sort: true }
                , { field: 'note', title: '备注', width: 183 }
                , { fixed: 'right', title: '操作', width: 70, toolbar: '#barDown' }
            ]]
        })
        add_bt()  //上述操作会导致bt和输入框被刷新，重新绑定事件
        $("#file_name").attr("value", f_name_save)
        $("#user_name").attr("value", u_name_save)

    }, false);
}

function find_item(file_id_net, local_arr) {
    for (var j = 0; j < local_arr.length; j++) {
        if (file_id_net === local_arr[j]) {
            return true
        }
    }
    return false
}

function get_share_list(table, token) {
    table.render({
        elem: '#share_all'
        , height: 527
        , url: `http://${url}/get_share_file/?token=${token}` //数据接口
        // , toolbar: ''
        // , defaultToolbar: ['exports']
        , cols: [[ //表头
            { type: 'checkbox', fixed: 'left' }
            , { field: 'file_name', title: '文件名', width: 160, sort: true, fixed: 'left' }
            , { field: 'file_size', title: '文件大小', width: 107, sort: true }
            , { field: 'date', title: '上传日期', width: 162, sort: true }
            , { field: 'note', title: '备注', width: 63 }
            , { fixed: 'right', title: '操作', width: 70, toolbar: '#barDel' }
        ]]
        , done: function (res, curr, count) {
            // var data_local = store.get('fileSys')
            // for (var i of res.data) {
            //     console.log(i);
            //     if (!find_item(i.file_id, data_local)) {
            //         data_local.push({file_id:i.file_id,file_path:i.file_path})
            //     }
            // }
        }
    });
}

var table;
var element;
var f_name_save = ""
var u_name_save = ""


layui.use('table', function () {
    table = layui.table;
    //第一个实例
    get_file_list(table, token)


});

layui.use('element', function () {
    element = layui.element;
});


function load() {
    $("#file_lib").click(() => {
        $("#file_lib").attr("class", "active")
        $("#download_list").attr("class", "")
        $("#my_share").attr("class", "")

        $("#file_lib_page").show()
        $("#my_download_page").hide()
        $("#my_share_page").hide()
    })
    $("#download_list").click(() => {
        $("#file_lib").attr("class", "")
        $("#download_list").attr("class", "active")
        $("#my_share").attr("class", "")

        $("#file_lib_page").hide()
        $("#my_download_page").show()
        $("#my_share_page").hide()
    })
    $("#my_share").click(() => {
        $("#file_lib").attr("class", "")
        $("#download_list").attr("class", "")
        $("#my_share").attr("class", "active")

        $("#file_lib_page").hide()
        $("#my_download_page").hide()
        $("#my_share_page").show()
    })

    ipcRenderer.on('renderer-index', function (event, arg) { // 接收到Main进程返回的消息
        const message = `异步消息回复: ${arg}`
        console.log(message)
        if (arg === "show_up_suc") {
            get_share_list(table, token)
            var myNotification = new Notification('成功', {
                body: '全部上传完毕!'
            })
        }
    })

    $("#upload").click(() => {
        console.log(123);
        ipcRenderer.send('main', 'open_upload')
    })

    $("#file_lib").attr("class", "")
    $("#download_list").attr("class", "active")
    $("#my_share").attr("class", "")

    $("#file_lib_page").hide()
    $("#my_download_page").show()
    $("#my_share_page").hide()
}


layui.use('table', function () {
    table = layui.table;
    //第一个实例
    get_share_list(table, token)
    //监听行工具事件
    table.on('tool(file_all)', function (obj) {
        var data = obj.data;
        console.log(data)
        ipcRenderer.invoke('main', 'open_selector_download_single').then((result) => {
            if (result.canceled === false) {
                var dir = result.filePaths[0]
                down_path = path.join(dir, data.file_name)
                if (obj.event === 'download') {
                    var id_date = add_item(data.file_name)
                    var render = { id_date: id_date, element: element }
                    // 向服务器请求目标file_id对应的用户的ip和port
                    $.ajax({
                        url: `http://${url}/get_target_ip`,
                        type: 'get',
                        dataType: 'json',
                        data: {
                            token: token,
                            file_id: data.file_id
                        },
                        success: function (response) {
                            if (response.code === 11000) {
                                var port = response.data.port
                                var ip = response.data.ip
                                var flie_download = new Download(render, ip, port, 512, down_path, data.file_id,data.file_size)  //把id_date传入进行控制操作   element.progress('a1662890029545', '60%')
                                flie_download.creat_socket()
                                flie_download.download()
                            }
                        }
                    })
                }
            }
        })

    });
});




// ipcRenderer.send('main', 'open_upload')




