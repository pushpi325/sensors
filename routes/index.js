
/*
 * GET home page.
 */
/*exports.index = function(req, res){
  res.render('index', { title: 'Hello World' });
};*/

exports.index = function(app,io) {
     return function (req,res){
          res.render('index', { title: 'Real Time' });
     };



    /*'use strict';
    */
};


