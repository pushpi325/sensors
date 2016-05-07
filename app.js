
/**
 * Module dependencies.
 */
var bodyParser = require('body-parser');
var morgan = require('morgan');
var methodOverride = require('method-override');
var handler = require('errorhandler');
var express = require('express');

var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var routes = require('./routes');

//load customers route
var customers = require('./routes/customers');

//load user route

var users = require('./routes/users');
//var users_register = require('./routes/users/register');

var connection  = require('express-myconnection'); 
var mysql = require('mysql');

// all environments
app.set('port', process.env.PORT || 4300);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(express.favicon());

//app.use(morgan.logger('dev'));
app.use(bodyParser .json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(methodOverride.me);

app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  //app.use(handler.errorHandler());
}

/*------------------------------------------
    connection peer, register as middleware
    type koneksi : single,pool and request 
-------------------------------------------*/

/*app.use(
    
    connection(mysql,{
        
        host: 'localhost',
        user: 'root',
        password : '',
        port : 3306, //port mysql
        database:'real_time'

    },'pool') //or single

);*/
var pool    =    mysql.createPool({
    connectionLimit   :   100,
    host              :   'localhost',
    user              :   'root',
    password          :   '',
    database          :   'real_time',
    debug             :   false
});
//io = io.listen(http.createServer(app));
console.log("app.jsss "+io);
var command_status = "";
app.get('/', routes.index(app,io));
io.on('connection',function(socket) {
    //console.log('one user connected ' + socket.id);
    var data = [];
    socket.emit('onconnection', {pollOneValue:"hello"});

    /*
    * in this module connected users will be displayed to index page
    * */

    for (var i in io.sockets.sockets) {
        var s = io.sockets.sockets[i];
    }
    pool.getConnection(function (err, connection) {
        if (err) {
            status = "error";
            message = "data base connecting error";
            var json = {status: status, message: message};
            socket.emit('users', json);

        }
        else {
            var query = "SELECT * FROM tbl_user left join tbl_user_socket on tbl_user.user_id = tbl_user_socket.sock_user_id";
            connection.query(query, function (err, rows) {
               if(err){
                   status="error";
                   message="error in getting data....";
                   var json = {status: status, message: message};
                   socket.emit('users',json);
               }
                else{
                   var data=[];
                   if(rows.length>0){
                   for(var i = 0;i<rows.length;i++) {
                       //console.log("user sock id " + rows[i].sock_socket_id);
                       var item = {};
                       var status=false;
                       for (var j in io.sockets.sockets) {
                           var s = io.sockets.sockets[j];
                           //console.log("db socket "+rows[i].sock_socket_id);

                           if (s.id == rows[i].sock_socket_id) {
                               console.log("im in if");
                               status = true;
                               break;
                           }
                         }
                       if(status) {
                           item = {
                               "user_id": rows[i].user_id,
                               "user_name": rows[i].user_name,
                               "user_serialno": rows[i].user_serialno,
                               "user_status":"online"
                           };
                       }
                       else{
                           item = {
                               "user_id": rows[i].user_id,
                               "user_name": rows[i].user_name,
                               "user_serialno": rows[i].user_serialno,
                               "user_status":"offline"
                           };
                       }

                       data.push(item);

                   }
                      var json={"status":"done","message":"data found","data":data};
                      socket.emit("users",json);
                   }
                   else{
                       var json={"status":"error","message":"No user found","data":data};
                   }
               }
            });
        }
    });

    /*
     * in this module user willl be successfully logged in
     *
     * */

    socket.on('login', function (userData) {
        //userData = JSON.parse(userData);
        var serialno = userData.serialno;
        var username = userData.username;
        //console.log("username "+userData);
        var status = "error";
        var message = "unable to get data";
        var user_id="";
        if (serialno == "") {
            status = "error";
            message = "serial number must not be empty";
            var json = {status: status, message: message};
            socket.emit('loginn', json);


        }
        else if (username == "") {
            status = "error";
            message = "user name must not be empty";
            var json = {status: status, message: message};
            socket.emit('loginn', json);


        }
        else {
            pool.getConnection(function (err, connection) {
                if (err) {
                    status = "error";
                    message = "data base connecting error";
                    var json = {status: status, message: message};
                    socket.emit('loginn', json);

                }
                var query = "select * from tbl_user where user_name='" + username + "' and user_serialno='" + serialno + "'";
                connection.query(query, function (err, rows) {
                    if (err) {
                        status = "error";
                        message = "unable to get data";
                        var json = {status: status, message: message};
                        socket.emit('loginn', json);

                    }
                    else {
                        var length = rows.length;
                        if (length == 0) {
                            status = "error";
                            message = "Sorry user not found";
                            var json = {status: status, message: message};
                            socket.emit('loginn', json);

                        }
                        else {
                            user_id = rows[0].user_id;

                            var sockets = {
                                sock_user_id: user_id,
                                sock_socket_id: socket.id
                            }
                            connection.query("DELETE FROM tbl_user_socket  WHERE sock_user_id = ? ", [user_id], function (err, rows) {
                                if (err) {
                                    status = "error";
                                    message = "error in deleting user socket id " + err;
                                    var json = {status: status, message: message};
                                    socket.emit('loginn', json);

                                }
                                else {
                                    connection.query("insert into tbl_user_socket set ?", sockets, function (err, rows) {
                                        var json = "";
                                        if (err) {
                                            status = "error";
                                            message = "error in inserting data %s" + err;
                                            json = {status: status, message: message};


                                        }
                                        else {
                                            status = "done";
                                            message = "User logged in successfully";

                                        }
                                        json = {status: status, message: message,user_idd:user_id};
                                        socket.emit('loginn', json);

                                    });
                                }
                            });
                        }
                    }
                });
            });
        }

    });

    socket.on('command', function (data) {
        socket.emit('command_response', data);

    });
    socket.on('update', function (data) {
        data = JSON.parse(data);
        var sfr = data.sfr;
        var pm_1 = data.pm_1;
        var pm_2 = data.pm_2;
        var pm_5 = data.pm_5;
        var pm_10 = data.pm_10;
        var pm_user_id = data.user_id;

        var elapsed_time = data.elapsed_time;
        //console.log("data :"+sfr);
        var items = {
            data_sfr: sfr,
            data_pm1: pm_1,
            data_pm2: pm_2,
            data_pm5: pm_5,
            data_pm10: pm_10,
            data_elapsedtime:elapsed_time,
            data_user_id: pm_user_id
        }
        //s.emit('updateValues',items);
        for (var i in io.sockets.sockets) {
            var s = io.sockets.sockets[i];


            s.emit('updateValues',items);
        }
        pool.getConnection(function (err, connection) {
            if (err) {
                status = "error";
                message = "data base connecting error";
                var json = {status: status, message: message};
                socket.emit('update_response', json);

            }
            else {

                /*connection.query("insert into tbl_data set ?", items, function (err, rows) {
                    var json = "";
                    if (err) {
                        status = "error";
                        message = "error in inserting data %s" + err;

                    }
                    else {
                        status = "done";
                        message = "data saved successfully";
                    }
                    json = {status: status, message: message};
                    //socket.emit('loginn', json);
                    socket.emit('update_response', json);
                    for (var i in io.sockets.sockets) {
                        var s = io.sockets.sockets[i];
                        /!*if (socket.id != s.id) {
                            //s.emit('message', data);
                            console.log("connected --- "+)
                        }*!/
                        console.log("connected --- "+ s.id);
                        if (socket.id != s.id) {
                            //s.emit('message', data);
                            //console.log("connected --- "+)
                            //s.emit('updateValues',items);
                        }

                        //s.emit('updateValues',items);
                    }

                });*/
            }

        });


    });

});
//app.use(app.router);




/*http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});*/

http.listen(app.get('port'),function(){
    console.log("Listening on 4300");
});
exports.io = io;

