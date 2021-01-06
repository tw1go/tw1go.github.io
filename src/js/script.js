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