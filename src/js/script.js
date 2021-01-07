$("#quote").typed({
  strings: ["Mixing elixir of creativity</br>on daylight."],
  typeSpeed: 17
});

$('.dayswitcher').change(function(){
  if($(this).is(':checked')){
      $('#banner').css('background-color','#061623');
      $(".typing-animation").empty();
      $(".typing-animation").append("<span id='quote'></span>");
      $("#quote").typed({
        strings: ["Forging sharp mind</br>at night."],
        typeSpeed: 17
      });
      $("#banner").removeClass('daylight');
      $("#banner").addClass('nighttime');
      
  }
  else{
      $('#banner').css('background-color','#b8d7d7');
      $(".typing-animation").empty();
      $(".typing-animation").append("<span id='quote'></span>");
      $("#quote").typed({
        strings: ["Mixing elixir of creativity</br>on daylight."],
        typeSpeed: 17
      });
      $("#banner").removeClass('nighttime');
      $("#banner").addClass('daylight');
  }
});

if (window.matchMedia("(min-width: 768px)").matches) {
  let mousePosX = 0,
      mousePosY = 0,
      mouseCircle = document.getElementById("mouse-circle");

  document.onmousemove = (e) => {
      mousePosX = e.pageX;
      mousePosY = e.pageY;
  };

  let delay = 6,
      revisedMousePosX = 0,
      revisedMousePosY = 0;

  function delayMouseFollow() {
      requestAnimationFrame(delayMouseFollow);

      revisedMousePosX += (mousePosX - revisedMousePosX) / delay;
      revisedMousePosY += (mousePosY - revisedMousePosY) / delay;

      mouseCircle.style.top = revisedMousePosY + "px";
      mouseCircle.style.left = revisedMousePosX + "px";
  }
  delayMouseFollow();
}

$('.light-area').hover(
  function(){
      $("#mouse-circle").css('border', '1px solid #263d45');
  },
  function(){
      $("#mouse-circle").css('border', '1px solid #ffffff');
  }
);

$('a').hover(
  function(){
      $('#mouse-circle').css({'border':'1px solid #f6937e','width': '40px','height': '40px','margin': '-17px 0px 0px -17px'});
  },
  function(){
      $("#mouse-circle").css({'border':'1px solid #ffffff','width': '54px','height': '54px','margin': '-27px 0px 0px -27px'});
}
);

$('.light-area a').hover(
  function(){
      $('#mouse-circle').css({'border':'1px solid #f6937e','width': '40px','height': '40px','margin': '-17px 0px 0px -17px'});
  },
  function(){
      $("#mouse-circle").css({'border':'1px solid #263d45','width': '54px','height': '54px','margin': '-27px 0px 0px -27px'});
}
);

(function($) {

  /**
   * Copyright 2012, Digital Fusion
   * Licensed under the MIT license.
   * http://teamdf.com/jquery-plugins/license/
   *
   * @author Sam Sehnert
   * @desc A small plugin that checks whether elements are within
   *     the user visible viewport of a web browser.
   *     only accounts for vertical position, not horizontal.
   */

  $.fn.visible = function(partial) {
    
      var $t            = $(this),
          $w            = $(window),
          viewTop       = $w.scrollTop(),
          viewBottom    = viewTop + $w.height(),
          _top          = $t.offset().top,
          _bottom       = _top + $t.height(),
          compareTop    = partial === true ? _bottom : _top,
          compareBottom = partial === true ? _top : _bottom;
    
    return ((compareBottom <= viewBottom) && (compareTop >= viewTop));

  };
    
})(jQuery);

var win = $(window);

var logos = $(".perk-logos");
var rateField = $(".rate-field");
var knowmetitle = $(".knowme-title");
var knowmeobj = $(".knowme-obj-wrap");

logos.each(function(i, el) {
  var el = $(el);
  if (el.visible(true)) {
    el.addClass("already-visible"); 
  } 
});

rateField.each(function(i, el) {
  var el = $(el);
  if (el.visible(true)) {
    el.addClass("already-visible"); 
  } 
});

knowmetitle.each(function(i, el) {
  var el = $(el);
  if (el.visible(true)) {
    el.addClass("already-visible"); 
  } 
});

knowmeobj.each(function(i, el) {
  var el = $(el);
  if (el.visible(true)) {
    el.addClass("already-visible"); 
  } 
});

win.scroll(function(event) {
  
  logos.each(function(i, el) {
    var el = $(el);
    if (el.visible(true)) {
      el.addClass("come-in"); 
    } 
  });

  rateField.each(function(i, el) {
    var el = $(el);
    if (el.visible(true)) {
      setInterval(function(){
        el.addClass("anim-rate");
      },2000); 
      setInterval(function(){
        $('.perk-rate').addClass("anim-perk-rate");
      },3000); 
    } 
  });

  knowmetitle.each(function(i, el) {
    var el = $(el);
    if (el.visible(true)) {
      el.addClass("slide-left"); 
      setInterval(function(){
        $(".knowme-title i").addClass("slide-left");
      },2000); 
    } 
  });

  knowmeobj.each(function(i, el) {
    var el = $(el);
    if (el.visible(true)) {
      el.addClass("come-in"); 
    } 
  });

});

$('.year-today').text(function(){
  var d = new Date();
  return d.getFullYear();
});