function add_item(file_name) {
    var date = new Date().getTime()
    var base_data = `<div class="item_border" id="a${date}">
    <div class="left_progress_box">
      <div style="margin-top: 17px">${file_name}</div>
      <div class="text_detail">
        <div id="a${date}_num">--/--</div>
        <div style="justify-content: flex-end;" id="a${date}_speed">--/s</div>
      </div>
      <div style="margin-top: 2px;">
        <div class="layui-progress" lay-filter="a${date}">
          <div class="layui-progress-bar layui-bg-blue"></div>
        </div>
      </div>
    </div>
    <div class="right_btn">
      <img class="btn_continue_pause" id="a${date}_pause" style="width: 18px;" src="./res/page/login/images/pause.png"/>
      <img class="btn_continue_pause" id="a${date}_continue" src="./res/page/login/images/continue.png"/>
    </div>
  </div>`
  $(".dl_main").append(base_data)
  return `a${date}`
}

module.exports = {
    add_item:add_item
}



