const formidable = require('formidable');
const db=require("../models/db");
const md5=require("../models/md5");
const path=require("path");
const fs=require("fs");
const gm=require("gm");
//这里书写具体的路由业务
//首页
exports.showIndex = function (req, res, next) {
    //检索数据库，查找此人的头像
    if (req.session.login == "1") {
        //如果登陆了
        var username = req.session.username;
        var login = true;
    } else {
        //没有登陆
        var username = "";  //制定一个空用户名
        var login = false;
    }
    //已经登陆了，那么就要检索数据库，查登陆这个人的头像
    db.find("users", {username: username}, function (err, result) {
        if (result.length == 0) {
            var avatar = "moren.jpg";
        } else {
            var avatar = result[0].avatar;
        }
        res.render("index", {
            login: login,
            username: username,
            active: "首页",
            avatar: avatar    //登录人的头像
        });
    });
};
//注册页面
exports.showRegist=function (req,res,next) {
    res.render("regist",{
        login:req.session.login=="1" ? true:false,
        username:req.session.login=="1" ? req.session.username:"",
        active:"注册",
    });
}
//注册业务
exports.doRegist=function (req,res,next) {
    //获取到表单的数据，
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username=fields.username;
        var password=fields.password;
        //查询数据库如果有返回-1告知已有重复，没有添加进去
        db.find("users", {"username": username},function(err,result){
            if(err){
                res.send("-3");
                return ;
            }
            if(result.length!=0){
                res.send("-1");
                return;
            }
                //插入数据库
                db.insertOne("users",{
                    "username":username,
                    "password":md5(password),
                    "avatar":'default.jpg'
                },function (err,result) {
                    if(err){
                        res.send("-3")
                    }
                    //使用session保存数据，
                    req.session.login="1";
                    req.session.username=username;
                    req.session.avatar='default.jpg'
                    res.send("1");
                })

        })


    });
}
//登录页面
exports.showLogin=function (req,res,next) {
    res.render("login",{
        login:req.session.login=="1" ? true:false,
        username:req.session.login=="1" ? req.session.username:"",
        active:"登录",
    });
}
//登录业务
exports.doLogin=function(req,res,next){
    //获取到表单的数据，
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var username = fields.username;
        var password = fields.password;
        //如果没有返回-1，密码错误-2，成功1
        db.find("users",{"username":username},function (err,result) {
            if(err){
                res.send("-3")
                return;
            }
            //如果找不到
            if(result.length==0){
                res.send("-1");
                return;
            }
            //如果密码错误
            if(result[0].password!==md5(password)){
                res.send("-2");
                return;
            }else {
                req.session.login="1";
                req.session.username=username;
                res.send("1");
                return;
            }
        })
    })
}
//上传图片页面
exports.showSetAvatar=function (req,res,next) {
    if(req.session.login!=="1"){
        res.send("此页面只有登陆后才会显示！")
        return;
    }
    res.render("setavatar",{
        login:req.session.login=="1" ? true:false,
        username:req.session.login=="1" ? req.session.username:"",
        active:"登录",
    });
}
//设置上传图片页面
exports.doAvatar=function (req,res,next) {
    if(req.session.login!=="1"){
        res.send("此页面只有登陆后才会显示！")
        return;
    }
    var form = new formidable.IncomingForm();
    form.uploadDir =path.normalize(__dirname+"/../avatar");
    form.parse(req, function(err, fields, files) {
        // console.log(files);
        var oldpath=files.pic.path;
        var newpath=path.normalize(__dirname+"/../avatar/"+req.session.username)+".jpg";
        fs.rename(oldpath,newpath,function(err,result){
            if(err){
                res.send("服务器错误");
                return;
            }
            //上传成功转到图片裁切页面,并保存文件
            req.session.avatar=req.session.username+".jpg";
            res.redirect("/cutpic");
        })
    })
}
//图片裁剪页面
exports.showCutPic=function (req,res,next) {
    if(req.session.login!=="1"){
        res.send("此页面只有登陆后才会显示！")
        return;
    }
    res.render("cutpic",{
        avatar:req.session.avatar,
    });
}
//图片裁剪业务
exports.doCut=function (req,res,next) {
    if(req.session.login!=="1"){
        res.send("此页面只有登陆后才会显示！")
        return;
    }
    //拿到前台的坐标用gm处理，并保存，并且修改数据库文件
    var filename=req.session.avatar;
    var w = req.query.w;
    var h = req.query.h;
    var x = req.query.x;
    var y = req.query.y;
    gm("./avatar/" + filename)
        .crop(w, h, x, y)
        .resize(100, 100, "!")
        .write("./avatar/" + filename, function (err) {
            if (err) {
                res.send("-1");
                return;
            }
            //更改数据库当前用户的avatar这个值
            db.updateMany("users", {"username": req.session.username}, {
                $set: {"avatar": req.session.avatar}
            }, function (err, results) {
                res.send("1");
            });
        });

}
//发表说说业务
exports.doPost=function(req,res,next){
    //获取到表单的数据，
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        var content = fields.content;
        //如果没有返回-1，密码错误-2，成功1
        db.insertOne("posts",{
            "username":req.session.username,
            "content":content,
            "date":new Date(),
        },function (err,result) {
            if(err){
                res.send("-3")
                return;
            }
            res.send("1");
        })
    })
}
//列出所有说说，有分页功能
exports.doShuoShuo = function(req,res,next){
    //这个页面接收一个参数，页面
    var page = req.query.page;
    db.find("posts",{},{"pageamount":10,"page":page,"sort":{"date":-1}},function(err,result){
        if(err||result.length==0){return res.json("")}
        res.json(result);
    });
};
//二层ajax，拿到用户图片
exports.doShuoPic=function (req,res,next) {
    //拿到要查询的名字
    var username=req.query.username;
    db.find("users",{"username":username},function(err,result){
        if(err||result.length==0){return res.json("")}
        var obj = {
            "username" : result[0].username,
            "avatar" : result[0].avatar || "default.jpg",
            "_id" : result[0]._id,
        };
        res.json(obj);
    })
}
//拿到说说总数
exports.doCount=function (req,res,next) {
    db.getAllCount("posts",function (count) {
        res.send(count.toString());
    })
}
//显示每个用户个人主页
exports.showUser=function(req,res,next){
    //根据用户名查找用户信息和头像
    var user=req.params["username"];
    //找文章
    db.find("posts",{"username":user},function(err,result){
        //找头像

        db.find("users",{"username":user},function (err,result2) {
            res.render("user",{
                login:req.session.login=="1" ? true:false,
                username:req.session.login=="1" ? req.session.username:"",
                active:"登录",
                avatar:result2[0].avatar,
                shuoshuo:result,
                user:result2[0].username
            })
        })
    })


}
//成员列表
exports.userList=function (req,res,next) {
    db.find("users",{},function(err,result){
        res.render("userlist",{
            login:req.session.login=="1" ? true:false,
            username:req.session.login=="1" ? req.session.username:"",
            active:"登录",
            userAll:result
        })
    })
}
//退出
exports.doExit=function(req,res,next){
    req.session.login="-1";
    res.redirect("/");
}