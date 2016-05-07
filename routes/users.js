/*
 * GET users listing.
 */

 var socket_id = "";

  exports.login = function(app, io){
   return function(req,res){
       /*io.sockets.on('connection', function (socket) {
           console.log('one user connected '+socket.id);
           //alert("user connected "+socket.id);
           socket_id = socket.id;
       });*/

       res.render('user_login',{page_title:"User Login"});
   }
};

/*
*in this function user will be logged in
* */

exports.login_user = function(app, io) {

    return function(req,res) {

        io.sockets.on('connection', function (socket) {
          console.log('one user connected '+socket.id);
          //alert("user connected "+socket.id);
          socket_id = socket.id;
      });
        var input = JSON.parse(JSON.stringify(req.body));
        req.getConnection(function (err, connection) {
         var status= "error";
         var message="unable to update data";
         if(err){
             var responsee = {status: status, message: message};
             res.json(responsee);

         }
         else{
             var user_email = input.user_email;
             var user_password = input.user_password;
             var query = "select * from tbl_user where user_email='"+user_email+"' and user_password='"+user_password+"'";
             connection.query(query,function(err,rows){
                  if(err){
                      status = "error";
                      message="unable to get data %s"+err;
                      var responsee = {status: status, message: message};
                      res.json(responsee);
                  }
                  else if(rows.length==0){
                      status = "error";
                      message="User email or password does not exists";
                      var responsee = {status: status, message: message};
                      res.json(responsee);
                  }
                 else if(rows.length>0){

                      var user_id = rows[0].user_id;
                      //console.log("user id------"+user_id);
                      //connection.query
                      var sockets = {
                          socket_user_id: user_id,
                          socket_sock_id: socket_id
                      }
                      connection.query("DELETE FROM tbl_user_socket  WHERE socket_user_id = ? ",[user_id], function(err,rows){
                          if(err){
                              status = "error";
                              message="error in deleting user socket id "+err;
                              res.json({status:status,message:message});
                          }
                          else{
                              connection.query("insert into tbl_user_socket set ?",sockets,function(err,rows){
                                  if(err){
                                      status="error";
                                      message="error in inserting data %s"+err;

                                  }
                                  else{
                                      status="done";
                                      message="User logged in successfully";
                                  }
                                  res.json({status:status,message:message});
                              });
                          }
                      });

                  }
             });
         }
     });
  }
};




