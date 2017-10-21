window.Helper = {
  // 提示
  alert: function (msg, typ) {
    var alertDiv = $('<div class="alert"><div class="alert-inner alert-' + typ + '">' + msg + '</div></div>')
    $('body').append(alertDiv)
    alertDiv.animate({top: 8})
    setTimeout(function () {
      alertDiv.remove()
    }, 2000)
  }
}