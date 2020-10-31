/*!
 * Based on Fading JavaScript Tooltips 2kb by Michael Leigeber
 * WWW: http://www.leigeber.com/2008/06/javascript-tooltip/
 * Modified by T. H. Doan
 */
var tooltip=function(){var n,i,r=10,f=20,t=0,u=95;return{show:function(t){oCT||(n=window.innerWidth,n-W>7&&D.body.classList.add("no-scroll"),oTT.innerHTML=t,oTT.style.display="block",i=oTT.offsetWidth,oTT.style.visibility="visible",clearInterval(oTT.t),oTT.t=setInterval(function(){tooltip.fade(1)},f))},pos:function(t){var r=t.pageX;oTT.style.top=t.pageY+18+"px";oTT.style.right=(r+i<n?n-r-i:0)+"px"},fade:function(n){var i=t,f;i!==u&&n===1||i!==0&&n===-1?(f=r,u-i<r&&n===1?f=u-i:t<r&&n===-1&&(f=i),t=i+f*n,oTT.style.opacity=t*.01):(clearInterval(oTT.t),n===-1&&(oTT.style.display="none",oTT.style.visibility="hidden",oTT.innerHTML="",oTT.style.top="",oTT.style.right="",D.body.classList.remove("no-scroll")))},hide:function(){clearInterval(oTT.t);oTT.t=setInterval(function(){tooltip.fade(-1)},f)}}}();
