
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

var graphs = require('./routes/graph');
var users = require('./routes/users');

//var users_register = require('./routes/users/register');

var connection  = require('express-myconnection'); 
var mysql = require('mysql');

// all environments
app.set('port', process.env.PORT || 3000);
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

app.use(
    
    connection(mysql,{
        
        host: 'us-cdbr-iron-east-03.cleardb.net',
        user: 'bf52f946b0eadb',
        password : '2c5b58d7',
        //port : 3306, //port mysql
        database:'heroku_a723b6a3a9a98fa'

    },'pool') //or single

);
var pool    =    mysql.createPool({
    connectionLimit   :   100,
        host: 'us-cdbr-iron-east-03.cleardb.net',
        user: 'bf52f946b0eadb',
        password : '2c5b58d7',
        //port : 3306, //port mysql
        database:'heroku_a723b6a3a9a98fa',
    debug             :   false
});
//io = io.listen(http.createServer(app));
console.log("app.jsss "+io);
var command_status = "";
app.get('/', routes.index(app,io));

function check_online_users(socket){
    /*
     * in this module connected users will be displayed to index page
     * */
    console.log("in online user");
    for (var i in io.sockets.sockets) {
        var s = io.sockets.sockets[i];
    }
    pool.getConnection(function (err, connection) {
        //console.log("connected users "+io.sockets.sockets.length);
        for (var ii in io.sockets.sockets) {
            var s = io.sockets.sockets[ii];
            //s.emit('users',json);
            console.log("users "+ s.id);
        }
        if (err) {
            status = "error";
            message = "data base connecting error";
            var json = {status: status, message: message};
            for (var ii in io.sockets.sockets) {
                var s = io.sockets.sockets[ii];
                s.emit('users',json);
            }
            //socket.emit('users', json);

        }
        else {
            var query = "SELECT * FROM tbl_user left join tbl_user_socket on tbl_user.user_id = tbl_user_socket.sock_user_id";
            connection.query(query, function (err, rows) {
                if(err){
                    status="error";
                    message="error in getting data....";
                    var json = {status: status, message: message};
                    //socket.emit('users',json);
                    console.log("error in inserting data "+err);

                    for (var ii in io.sockets.sockets) {
                        var s = io.sockets.sockets[ii];
                        s.emit('users',json);
                    }
                }
                else{
                    var data=[];
                    console.log("users found "+rows.length);
                    if(rows.length>0){
                        for(var i = 0;i<rows.length;i++) {
                            //console.log("user sock id " + rows[i].sock_socket_id);
                            var item = {};
                            var status=false;
                            for (var j in io.sockets.sockets) {
                                var s = io.sockets.sockets[j];
                                console.log("db socket "+rows[i].sock_socket_id);

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
                                    "user_socket_id": rows[i].sock_socket_id,
                                    "user_status":"online"
                                };
                            }
                            else {
                                item = {
                                    "user_id": rows[i].user_id,
                                    "user_name": rows[i].user_name,
                                    "user_serialno": rows[i].user_serialno,
                                    "user_socket_id": rows[i].sock_socket_id,
                                    "user_status":"offline"
                                };
                            }

                            data.push(item);

                        }
                        var json={"status":"done","message":"data found","data":data};
                        //socket.emit("users",json);
                        console.log(json);
                        for (var ii in io.sockets.sockets) {
                            var s = io.sockets.sockets[ii];
                            s.emit('users',json);
                        }
                    }
                    else{
                        var json={"status":"error","message":"No user found","data":data};
                        for (var ii in io.sockets.sockets) {
                            var s = io.sockets.sockets[ii];
                            s.emit('users',json);
                        }
                    }
                }
            });
        }
    });

}

function server_response(emitt,jsonn){
    for (var i in io.sockets.sockets) {
        var s = io.sockets.sockets[i];
        s.emit(emitt,jsonn);
    }
}
function load_chart_data(){
    pool.getConnection(function (err, connection) {
        if (err) {
            status = "error";
            message = "data base connecting error";
            var json = {status: status, message: message};
            for (var ii in io.sockets.sockets) {
                var s = io.sockets.sockets[ii];
                s.emit('load_chartt',json);
            }
            //socket.emit('users', json);

        }
        else{
            var query = "select * from tbl_data where data_user_id='1' ";
            var pm1=[];
            var pm2=[];
            var pm10=[];

            connection.query(query,function(err,rows){
               if(err){
                   status="error";
                   message="unable to get data "+err;
                   var json={"status":status,"message":message};
                   for (var ii in io.sockets.sockets) {
                       var s = io.sockets.sockets[ii];
                       s.emit('load_chartt',json);
                   }
               }
               else{
                   var status="done";
                   var message="data found ";

                   if(rows.length>0){
                     for(var i=0;i<rows.length;i++){
                         //var datum = Date.parse(rows[i].data_timestamp);
                         //var time_stamp = datum/1000;
                         var date = new Date();

                         //console.log(rows[i].data_timestamp);
                         //console.log(date);
                         pm1.push([rows[i].data_timestamp,parseInt(rows[i].data_pm1)]);
                         pm2.push([rows[i].data_timestamp,parseInt(rows[i].data_pm2)]);
                         pm10.push([rows[i].data_timestamp,parseInt(rows[i].data_pm10)]);

                     }
                     var json = {"status":status,"message":message,series_data:[{"name":"PM 1","data":pm1},{"name":"PM 2.5","data":pm2},{"name":"PM 10","data":pm10}]};
                       for (var ii in io.sockets.sockets) {
                           var s = io.sockets.sockets[ii];
                           s.emit('load_chartt',json);
                       }
                   }
                   else{
                       var status="error";
                       var message="data not found";
                       var json={"status":status,"message":message};
                       for (var ii in io.sockets.sockets) {
                           var s = io.sockets.sockets[ii];
                           s.emit('load_chartt',json);
                       }
                   }
               }
            });

        }
    });
}

io.on('connection',function(socket) {
    //console.log('one user connected ' + socket.id);
    var data = [];
    socket.emit('hello',{"hello":"hi"});
    //check_online_users(socket);

    socket.on('disconnect', function() {
        //clearInterval(sender);
        console.log('client has disconnected');
        //socket.socket.reconnect();
    });
    socket.emit('onconnection', {pollOneValue:"hello"});
    //load_chart_data();

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
                                            check_online_users(socket);

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
        var socket_idd = data.socket_id;
        var curr_time = data.curr_time;
        var sensor_status = data.sensor_status;
        var sensor_name = data.name;
        var sensor_serialno = data.serial_no;
        var sample_period = data.sample_period;


        var elapsed_time = data.elapsed_time;
        //console.log("data :"+sfr);
        var items = {
            data_sfr: sfr,
            data_pm1: pm_1,
            data_pm2: pm_2,
            data_pm5: pm_5,
            data_pm10: pm_10,
            data_elapsedtime:elapsed_time,
            data_user_id: pm_user_id,
            data_timestamp:curr_time
        }

        /*for (var i in io.sockets.sockets) {
            var s = io.sockets.sockets[i];
            s.emit('updateValues',itemss);
        }
        s.emit('updateValues',items);
        */

        pool.getConnection(function (err, connection) {
            if (err) {
                status = "error";
                message = "data base connecting error";
                var json = {status: status, message: message};
                //socket.emit('update_response', json);
                io.to(socket_idd).emit('update_response', json);


            }
            else {
                   if(sensor_serialno!="?" && parseInt(sensor_serialno)!="0") {
                       var sensors = {user_sensor_serialno:sensor_serialno,
                       user_sensor_name:sensor_name
                       };
                       connection.query("UPDATE tbl_user set ? WHERE user_id = ? ",[sensors,pm_user_id], function(err, rows)
                       {

                           if (err){
                               console.log("Error Updating : %s ",err );
                               for (var i in io.sockets.sockets) {
                                   var s = io.sockets.sockets[i];
                                   s.emit('server_error',{"error":""+err});
                               }
                           }
                           else{
                               var itemss = {
                                   data_sfr: sfr,
                                   data_pm1: pm_1,
                                   data_pm2: pm_2,
                                   data_pm5: pm_5,
                                   data_pm10: pm_10,
                                   data_elapsedtime:elapsed_time,
                                   data_user_id: pm_user_id,
                                   data_timestamp:curr_time,
                                   data_sensor_status:sensor_status,
                                   data_sensor_name:sensor_name,
                                   data_sensor_serialno:sensor_serialno,
                                   data_sensor_sample_period:sample_period
                               }
                               for (var i in io.sockets.sockets) {
                                   var s = io.sockets.sockets[i];
                                   s.emit('updateValues',itemss);
                               }

                           }

                       });
                   }
                   else{
                       var query = "select * from tbl_user where user_id='"+pm_user_id+"'";
                       connection.query(query,function(err,rows){
                          if(err){
                              console.log("unable to get data--------"+err);
                              for (var i in io.sockets.sockets) {
                                  var s = io.sockets.sockets[i];
                                  s.emit('server_error',{"error":""+err});
                              }
                          }
                          else{
                              if(rows.length>0) {
                                  var sensor_name = rows[0].user_sensor_name;
                                  var sensor_serial = rows[0].user_sensor_serialno;
                                  if(sensor_name=="" || sensor_serial==""){
                                      sensor_name="0.0";
                                      sensor_serial="0.0";
                                  }
                                  var itemss = {
                                      data_sfr: sfr,
                                      data_pm1: pm_1,
                                      data_pm2: pm_2,
                                      data_pm5: pm_5,
                                      data_pm10: pm_10,
                                      data_elapsedtime:elapsed_time,
                                      data_user_id: pm_user_id,
                                      data_timestamp:curr_time,
                                      data_sensor_status:sensor_status,
                                      data_sensor_name:sensor_name,
                                      data_sensor_serialno:sensor_serial,
                                      data_sensor_sample_period:sample_period
                                  }
                                  for (var i in io.sockets.sockets) {
                                      var s = io.sockets.sockets[i];
                                      s.emit('updateValues',itemss);
                                  }
                              }
                              else{
                                  for (var i in io.sockets.sockets) {
                                      var s = io.sockets.sockets[i];
                                      s.emit('server_error',{"error":"length is zero"});
                                  }
                              }
                          }
                       });
                   }
                  if(curr_time!="" && curr_time!="0") {
                      connection.query("insert into tbl_data set ?", items, function (err, rows) {
                          var json = "";
                          if (err) {
                              status = "error";
                              message = "error in inserting data %s" + err;
                              json = {status: status, message: message};
                              for (var i in io.sockets.sockets) {
                                  var s = io.sockets.sockets[i];
                                  s.emit('server_error',json);
                              }

                          }
                          else {
                              status = "done";
                              message = "Data inserted successfully";
                          }
                          json = {status: status, message: message};
                          //socket.emit('update_response', json);
                          io.to(socket_idd).emit('update_response', json);


                      });
                  }
                  else{
                      for (var i in io.sockets.sockets) {
                          var s = io.sockets.sockets[i];
                          s.emit('server_error',{"error":"curr time"+curr_time});
                      }

                  }

            }

        });


    });

    socket.on('process_command',function(data){
        var socket_id = data.socket_id;
        var sample_period = data.sample_period;
        var status = data.status;
        console.log("socket id------"+socket_id);
        io.to(socket_id).emit('commandd',{"sample_period":sample_period,"status":status});

    });

    socket.on("commandd_response",function(data){
       //var json={status:data.status,user_id:data.user_id};
       // console.log("command response "+JSON.stringify(json));

        for (var i in io.sockets.sockets) {
            var s = io.sockets.sockets[i];
            s.emit('updateSensor',data);
        }
        //socket.emit('sensor_status',data);
    });


    for (var i in io.sockets.sockets) {
        var s = io.sockets.sockets[i];
        s.emit("sensor_status",{"data":"device"});

    }



});
//app.use(app.router);




/*http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});*/
app.get('/graph/list/', graphs.graph_data(app,io));
app.get('/users/list/', users.user_data(app,io));


http.listen(app.get('port'),function(){
    console.log("Listening on 3000");
});
exports.io = io;

