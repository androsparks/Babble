module.exports = (io) => {
  const express  = require('express');
  const passport = require('passport');
  const router   = express.Router();
  const fs       = require('fs');
  const hbs      = require('hbs');
  const shortid  = require('shortid');
  const escape   = require('escape-html');
  const twemoji  = require('twemoji');
  const https    = require('https');

  //User Model
  const User = require('../models/user.js');

  //Passport Config
  const auth = require('../config/passport');

  //Wikipedia Search links
  const wikipediaAPILink = 'https://en.wikipedia.org/w/api.php?format=json&action=query&list=search&srsearch=';
  const wikipediaLink    = 'https://en.wikipedia.org/wiki/';

  router.get('/', auth.ensureAuthenticated, (req, res) => {

    let file = 'chat';

    fs.readFile('./models/history.json', 'utf8', (err, data) => {
      if(err) throw err;

      res.render(file, {
        meta: {
          title: 'Babble all time!',
          description: 'Babble is a simple to use chat app that let\'s you to have fun with your friends',
          keywords: 'chat, app, babble, instant, messaging',
          file: file
        },
        user: req.user,
        history: JSON.parse(data).history
      });
    });
  });

  io.on('connection', function(socket){
    io.emit('join', { id: socket.request.user.id, user: socket.request.user.displayName });

    socket.on('chat message', function(msg){

      if(!!msg.trim()) {
        let message = {};

        let clean_msg = escape(msg);

          message = {id: socket.request.user.id, name: socket.request.user.displayName, msg: clean_msg, time: formatAMPM(new Date()), photo: socket.request.user.photo};

        io.emit('chat message', message);

        if(clean_msg.match(/^@emma/i)) {
          let bot_message = {};

          let query = clean_msg.replace('@emma', '').trim();

          let wikipediaSearchURL = wikipediaAPILink + query;

          https.get(wikipediaSearchURL, (res) => {

            let resBody = '';

            res.on('data', (chunk) => {
              resBody += chunk;
            });

            res.on('end', () => {

              resBody = JSON.parse(resBody);

              let b_data = '';

              if(!query || !resBody.query.searchinfo.totalhits) {
                b_data = `Nothing Found! 🙁`;
              }
              else {
                let title = resBody.query.search[0].title;
                let body  = resBody.query.search[0].snippet;

                b_data = `<a href="${wikipediaLink}${title}" target="_blank">${title}</a> - ${body}`;
              }

              bot_message = {id: 'bot', name: 'Emma(bot)', msg: b_data, time: formatAMPM(new Date())};
              io.emit('chat message', bot_message);

              fs.readFile('./models/history.json', 'utf8', (err, data) => {
                if(err) throw err;

                let history = JSON.parse(data);

                history.history.push(bot_message);
                history = JSON.stringify(history);

                fs.writeFile('./models/history.json', history, (err) => {
                  if(err) throw err;
                });
              });


            });


          });

        }

        fs.readFile('./models/history.json', 'utf8', (err, data) => {
          if(err) throw err;

          let history = JSON.parse(data);

          history.history.push(message);
          history = JSON.stringify(history);

          fs.writeFile('./models/history.json', history, (err) => {
            if(err) throw err;
          });
        });
      }
    });

    socket.on('chat image', function(img) {
      let image = decodeBase64Image(img);
      if(image.type === 'error') {
        socket.emit('bot', {msg: 'Not an Image!'});
      }
      else {
        let name = `${shortid.generate()}.${image.type}`;

        fs.writeFile(`public/uploads/${name}`, image.data, {encoding: 'binary'}, (err) => {
          if(err) throw err;
        });

        let message = {id: socket.request.user.id, name: socket.request.user.displayName, image: `uploads/${name}`, time: formatAMPM(new Date()), photo: socket.request.user.photo};
        io.emit('chat image', message);

        fs.readFile('./models/history.json', 'utf8', (err, data) => {
          if(err) throw err;

          let history = JSON.parse(data);

          history.history.push(message);
          history = JSON.stringify(history);

          fs.writeFile('./models/history.json', history, (err) => {
            if(err) throw err;
          });
        });
      }
    });

    socket.on('disconnect', function () {
      io.emit('leave', { id: socket.request.user.id, user: socket.request.user.displayName });
    });
  });

  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

  function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
    response = {};

    if (!matches || matches.length !== 3) {
      response.type = 'error';
      return response;
    }

    if(matches[1] === 'image/png') {
      response.type = 'png';
    }
    else if(matches[1] === 'image/jpeg') {
      response.type = 'jpg';
    }
    else {
      response.type = 'error';
      return response;
    }


    response.data = new Buffer(matches[2], 'base64');

    return response;
  }

  hbs.registerHelper('areEqual', function(id1, id2, options) {
    if(id1 == id2) return options.fn(this);
    else return options.inverse(this);
  });

  hbs.registerHelper('twemojify', function(msg) {
    return new hbs.SafeString(twemoji.parse(msg));
  });

  return router;
}
