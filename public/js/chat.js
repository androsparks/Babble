"use strict";var socket=io();$("form").submit(function(){return""!==$("#type-message").val()&&(socket.emit("chat message",$("#type-message").val()),$("#type-message").val(""),!1)}),socket.on("chat message",function(s){var e="";e=s.id==$("#userid").val()?'<div class="message-me"><span class="msg">'+s.msg+'</span><span class="time noselect">'+s.time+"</span></div>":'<div class="message"><span class="username noselect">'+s.name+'</span><span class="msg">'+s.msg+'</span><span class="time noselect">'+s.time+"</span></div>",$("#messages").append(e),$(".messages").scrollTop($(".messages").children().height())}),socket.on("join",function(s){var e="";e=s.id==$("#userid").val()?'<div class="message-bot noselect"><kbd>you joined the chatroom</kbd></div>':'<div class="message-bot noselect"><kbd>'+s.user+" has joined</kbd></div>",$("#messages").append(e),$(".messages").scrollTop($(".messages").children().height())}),socket.on("leave",function(s){var e="";e=s.id==$("#userid").val()?'<div class="message-bot noselect"><kbd>disconnected</kbd></div>':'<div class="message-bot noselect"><kbd>'+s.user+" has left</kbd></div>",$("#messages").append(e),$(".messages").scrollTop($(".messages").children().height())}),socket.on("userList",function(s){console.log(s)}),$(function(){});