const { ipcRenderer } = require('electron');
const { token, url } = require('./res/bin/data_init');
const Download = require("./res/bin/client")
const path = require('path');
const { add_item } = require('./res/bin/item.js')
const HashMap = require("hashmap")
const LocalDownload = require("./res/bin/local_download")

var h_index_map = new HashMap()
var if_del_or_add_some = false
var local_download = new LocalDownload()

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
    $("#download_bt").click(() => {
        var all = table.checkStatus('file_all');
        console.log(all.data);
        var data = all.data

        ipcRenderer.invoke('main', 'open_selector_download').then((result) => {
            if (result.canceled === false) {
                var dir = result.filePaths[0]
                for (var i = 0; i < data.length; i++) {
                    console.log(data[i].file_name);
                    download_file_start(dir, data[i].file_name, data[i].file_id, data[i].file_size)
                }

            }
        })
    })
    $("#refresh_bt").click(() => {
        get_file_list(table, token)
    })
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
        }
    });
}

function del_share_file(file_id_list) {
    $.ajax({
        url: `http://${url}/del_share_file`,
        type: 'POST',
        dataType: 'json',
        data: {
            token: token,
            file_id_list: file_id_list
        },
        success: function (response) {
            if (response.code === 11000) {
                if_del_or_add_some = true
                get_share_list(table, token)
            } else {
                var myNotification = new Notification('通知', {
                    body: response.value
                })
                get_share_list(table, token)
            }
        }
    })
}

function slector_already_onready(index){
    // 选择器：下载列表->正在下载/已完成
    if(index === 0){
        // 设置粗体
        $("#tab_breadcrumb > li:nth-child(1) > a").attr("class","active overstriking_title")
        $("#tab_breadcrumb > li:nth-child(2) > a").attr("class","")
        $(".item_border").show()
        $("#ready_download").hide()
    }else if(index === 1){
        $("#tab_breadcrumb > li:nth-child(1) > a").attr("class","")
        $("#tab_breadcrumb > li:nth-child(2) > a").attr("class","active overstriking_title")
        $(".item_border").hide()
        $("#ready_download").show()
    }
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

        if (if_del_or_add_some === true) {
            if_del_or_add_some = false
            get_file_list(table, token)
        }
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
            if_del_or_add_some = true
        }
    })

    $("#upload").click(() => {
        ipcRenderer.send('main', 'open_upload')
    })

    $("#share_delete").click(() => {
        var all = table.checkStatus('share_all');
        var file_id_list = []
        for (var item of all.data) {
            file_id_list.push(item.file_id)
        }
        if (file_id_list.length === 0) {
            return
        }
        del_share_file(file_id_list)
    })

    $("#tab_breadcrumb > li:nth-child(1) > a").click(function(){
        slector_already_onready(0)
    })
    $("#tab_breadcrumb > li:nth-child(2) > a").click(function(){
        slector_already_onready(1)
    })

    $("#file_lib").attr("class", "")
    $("#download_list").attr("class", "active")
    $("#my_share").attr("class", "")

    $("#file_lib_page").hide()
    $("#my_download_page").show()
    $("#my_share_page").hide()

    // 控制默认时，下载列表中是正在下载还是已完成
    slector_already_onready(0)
    console.log(local_download.get_item())
}

async function download_file_start(dir, file_name, file_id, file_size) {
    down_path = path.join(dir, file_name)
    h_index_map.set(file_id, down_path)

    var id_date = add_item(file_name)
    var render = { id_date: id_date, element: element }
    // 向服务器请求目标file_id对应的用户的ip和port
    $.ajax({
        url: `http://${url}/get_target_ip`,
        type: 'get',
        dataType: 'json',
        data: {
            token: token,
            file_id: file_id
        },
        success: function (response) {
            if (response.code === 11000) {
                var port = response.data.port
                var ip = response.data.ip
                var chunk_sum = response.data.chunk_sum
                var flie_download = new Download(render, ip, port, chunk_sum, h_index_map.get(file_id), file_id, file_size)  // 这个地方之所以用h_index_map，是因为直接传down_path回导致每次传入都一样
                flie_download.creat_socket()
                flie_download.download()
            }
        }
    })
    console.log(123);

}


var already_data = [
    {
        file_name: "123",
        file_size: "4mb",
        note: "test1"
    }

] //已经下载的文件


layui.use('table', function () {
    table = layui.table;
    get_share_list(table, token)
    //监听行工具事件
    table.on('tool(file_all)', function (obj) {
        var data = obj.data;
        console.log(data)
        ipcRenderer.invoke('main', 'open_selector_download').then((result) => {
            if (result.canceled === false) {
                var dir = result.filePaths[0]
                if (obj.event === 'download') {
                    download_file_start(dir, data.file_name, data.file_id, data.file_size)
                }
            }
        })

    });

    table.on("tool(share_all)", function (obj) {
        var data = obj.data;
        console.log(data)
        del_share_file([data.file_id])
    })

    table.render({
        elem: '#already_table'
        , height: 480
        , limit: 1000
        , cols: [[{ type: 'checkbox', fixed: 'left' }
            , { field: 'file_name', title: '文件名', width: 230, sort: true, fixed: 'left' }
            , { field: 'file_size', title: '文件大小', width: 107, sort: true }
            , { field: 'note', title: '备注', width: 300 }
            , { fixed: 'right', title: '操作', toolbar: '#already_table_bar' }
        ]]
        , data: already_data
        , even: true
        // , page: true
    });

    table.on('tool(already_table)', function (obj) {
        if (obj.event === 'del_from_already') {
            console.log(obj.data);
            if (local_download.get_item() !==  undefined){
                console.log(local_download.get_item());
            }
        }
    })
});


// ipcRenderer.send('main', 'open_upload')




