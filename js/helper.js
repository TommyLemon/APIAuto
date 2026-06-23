window.Helper = {
  // 提示
  alert: function (msg, typ) {
    var validTypes = { 'success': 1, 'info': 1, 'warning': 1, 'danger': 1, 'error': 1 }
    var safeTyp = validTypes[typ] ? typ : 'info'
    var alertDiv = $('<div class="alert"><div class="alert-inner alert-' + safeTyp + '"></div></div>')
    alertDiv.find('.alert-inner').text(msg)
    $('body').append(alertDiv)
    alertDiv.animate({top: 8})
    setTimeout(function () {
      alertDiv.remove()
    }, 2000)
  }
}