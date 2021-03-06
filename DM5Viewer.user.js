// ==UserScript==
// @name         DM5 Viewer
// @version      0.8.0
// @description  Display all comic images at once.
// @author       Emma (emma2334)
// @match        http://www.dm5.com/m*
// @exclude      http://www.dm5.com/manhua-*
// @exclude      http://www.dm5.com/m*-end/
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/emma2334/DM5-Veiwer/master/DM5Viewer.user.js
// ==/UserScript==

(function(){
  var a, b;
  // modify display
  a = $('.view_bt .juh').eq(0);
  a.html('（共' + a.find('span').eq(1).html() + '頁）');
  $('.flr.lvzi').remove();
  $('.view_fy').remove();
  $('#showimage').html('').css('min-height', '100vh');
  var intro = $('.lan_kk2').eq(0);
  $('#index_mian').remove();

  // get images
  var count=1;
  var getImg = function(){
    $.ajax({
      url: "chapterfun.ashx",
      data: { cid: DM5_CID, page: count, key: $("#dm5_key").val(), language: 1, gtk: 6 },
      type: "POST",
      success: function (msg) {
        var img = eval(msg);
        for(i=0; i<img.length; i++){
          $('#showimage').append('<img src="' + img[i] + '" data-page="' + count + '"><br>');
          count++;
        }
        if(count<=DM5_IMAGE_COUNT) getImg();
      }
    });
  };
  getImg();

  // import css
  $('head').append('<link rel="stylesheet" href="http://emma2334.github.io/DM5-Viewer/files/css/style.css">');

  // create navbar
  a = localStorage.getItem(intro.find('.red_lj a')[0].pathname);
  if(a){
    a = a.split(',');
    b = '上次看到<span class="red_lj"><a href="' + a[1] + '"><strong>' + a[0] + '</strong></a></span>，第' + a[2] + '頁';
  }else b="這是你第一次看這本漫畫";
  $('<nav id="navbar">\
        <ul><li class="list" data-tooltip="返回目錄"></li><li class="next" data-tooltip="下一章"></li><li class="resize" data-tooltip="自適應寬度"></li><li class="scroll" data-tooltip="自動滾動"></li><li class="setting" data-tooltip="設定"></li></ul>\
        <div class="curPage"><span><span id="curPage">1</span>/<span>' + DM5_IMAGE_COUNT + '</span></span></div>\
      </nav>\
      <div id="menu">\
        <div class="title">設定</div><div class="content">\
          <div class="innr8">' + intro.find('.innr8').eq(0).html() + '</div>\
          <div class="innr8">' + b + '</div>\
          <div class="page">跳到第 <input name="page" type="number" min="1" max="' + DM5_IMAGE_COUNT + '" style="width: 40px;">/' + DM5_IMAGE_COUNT + ' 頁 <button>Go</button></div><hr>\
          <div class="light">開燈：<input name="light" type="checkbox"></div>\
          <div class="resize">自適應寬度：<input name="resize" type="checkbox"></div>\
          <div class="resize">自動換章：<input name="next" type="checkbox"></div>\
          <div class="speed">速度：<input name="speed" type="number" value="1" min="1" style="width: 70px;"> <button>重設</button></div>\
        </div>\
      </div>').appendTo('body');
  if($.cookie("isLight")!='off') $('[name="light"]').attr('checked', true);
  if($.cookie("nautosize")!=null){
    $('.resize').addClass('minify');
    $('[name="resize"]').attr('checked', true);
    $('#showimage').addClass('minify');
  }
  if($.cookie("autoNext")!='false') $('[name="next"]').attr('checked', true);

  // show current page number
  var cur=1;
  $(window).scroll(function(){
    $('#showimage img').each(function(){
      if((scrollY+window.innerHeight/2)>$(this).offset().top) cur=$(this).attr('data-page');
    });
    $('#curPage').html(cur);
  });

  /* -------------
    navbar
  ------------- */
  // list
  $('#navbar .list').click(function(){
    window.location.href = intro.find('.red_lj a')[0].href;
  });
  // next chapter
  $('#navbar .next').click(function(){
    intro.find('a.redzia').length<2 ? alert('目前為最新章節') : window.location.href = intro.find('a.redzia')[1].href;
  });
  // resize images
  $('#navbar .resize, [name="resize"]').click(function(){
    $('#showimage, #navbar .resize').toggleClass('minify');
    if($('#showimage').hasClass('minify')){
      a=true;
      b=true;
    }else{
      a=null;
      b=false;
    }
    $.cookie("nautosize", a, { path: "/", domain: cookiedm });
    $('[name="resize"]').attr('checked', b);
    if(cur>1) $('body').scrollTop($('[data-page="' + cur + '"]').offset().top);
  });
  // auto scrolling
  var intervalHandle;
  $('#navbar .scroll').click(function(){
    speed = $('[name="speed"]').val();
    $('#navbar .scroll').toggleClass('stop');
    autoScroll();
  });
  $(document).keydown(function(e){
    if(e.which==32) e.preventDefault();
  }).keyup(function(e){
    if(e.which==32){
      speed = $('[name="speed"]').val();
      $('#navbar .scroll').toggleClass('stop');
      autoScroll();
    };
  });
  function autoScroll(){
    clearInterval(intervalHandle);
    if(Number($('[name="speed"]').val())<1){
      alert('速度最少要為1');
      $('[name="speed"]').val(1);
    }
    var speed = Number($('[name="speed"]').val());
    if($('#navbar .scroll').hasClass('stop')) intervalHandle = setInterval(function() { window.scrollBy(0, speed);}, 10);
  }
  // setting
  $('#navbar .setting').click(function(){
    $('#menu, body, #navbar').toggleClass('open');
  });

  /* -------------
    menu
  ------------- */
  // scroll to specific page
  $('[name="page"]').change(function(){
    changePage();
  });
  $('#menu .page button').click(function(){
    $('[name="speed"]').val(1);
    changePage();
  });
  function changePage(){
    a = $('[name="page"]').val();
    if(a<1 || a>DM5_IMAGE_COUNT){
      $('[name="page"]').val('');
      if(a!='') alert('超過頁數範圍了');
    }else $('html,body').animate({scrollTop: $('[data-page="' + a + '"]').offset().top}, 500);
  }
  // change background color
  $('#menu [name="light"]').click(function(){
    if($('[name="light"]').is(':checked')){
      $('body').addClass('bdcolor').removeClass('bdblackcolor');
      $.cookie("isLight", "on", { path: "/", domain: cookiedm });
    }else{
      $('body').removeClass('bdcolor').addClass('bdblackcolor');
      $.cookie("isLight", "off", { path: "/", domain: cookiedm });
    }
  });
  // auto change chapter
  var flag=0;
  $(window).scroll(function(){
    if(scrollY>$('.view_ts').last().offset().top-window.innerHeight && flag==0 && $.cookie("autoNext")!='false'){
      flag=1;
      intro.find('a.redzia').length<2 ? setTimeout(function(){alert('目前為最新章節')}, 500) : window.location.href = intro.find('a.redzia')[1].href;
    }
    if(scrollY<=$('.view_ts').last().offset().top-window.innerHeight) flag=0;
    if(scrollY>$('.view_ts').last().offset().top-window.innerHeight){
      $('#navbar .scroll').removeClass('stop');
      clearInterval(intervalHandle);
    }
  });
  $('#menu [name="next"]').click(function(){
      $.cookie("autoNext", $('[name="next"]').is(':checked'), { path: "/", domain: cookiedm });
  });
  // auto scrolling
  $('[name="speed"]').change(function(){
    autoScroll();
  });
  $('#menu .speed button').click(function(){
    $('[name="speed"]').val(1);
    autoScroll();
  });

  // record where you leave off
  window.addEventListener("beforeunload", function(){
    localStorage.setItem(intro.find('.red_lj a')[0].pathname, [DM5_CTITLE, DM5_CURL, cur]);
    var url = "history.ashx";
    if(DM5_USERID>0) url='readHistory.ashx';
    console.log(DM5_CID, +", " + DM5_MID +", "+Number(cur) +", "+DM5_USERID);
    $.ajax({
        url: url,
        dataType: 'json',
        data: { cid: DM5_CID, mid: DM5_MID, page: Number(cur), uid: DM5_USERID, language: 1 },
        type: 'GET',
        success: function (msg) {
        }
    });
  });
})();
