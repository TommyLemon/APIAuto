$(function(){

  //横向拖动
  $('.splitx').mousedown(function (eve) {
    $('.widnow-cover').show()
    var split_obj = $(this)
    var left_ele = $('.side-left')
    var right_ele = $('.side-right')

    var split_obj_left = parseInt(split_obj.css('left'))

    var current_position = eve.clientX

    var left_width = left_ele.width()
    var right_width = right_ele.width()

    var right_left = parseInt(right_ele.css('left'))

    $('body').mousemove(function (e) { 
      if (right_width - e.clientX + current_position <= 100) {
        return false
      };
      left_ele.width(left_width + e.clientX - current_position);
      right_ele.width(right_width - left_ele.width() + left_width).css('left',right_left + left_ele.width() - left_width);
      
      split_obj.css('left', left_ele.width())
    }) 
  })
  
  $('body').mouseup(function () {
    $('body').unbind('mousemove')
    $('.widnow-cover').hide()
  })
})