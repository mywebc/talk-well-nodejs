const express=require("express");
const app=express();
const router=require("./router/router");
const session = require('express-session');

//设置引擎
app.set("view engine","ejs");
//使用session
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

//静态管理
app.use(express.static("./public"));
app.use("/avatar",express.static("./avatar"));

//路由表，里面的路由业务全部写到router.js中
app.get('/',router.showIndex);//首页
app.get('/regist',router.showRegist);//注册页
app.post("/doregist",router.doRegist);//注册业务页
app.get('/login',router.showLogin);//登录页面
app.post('/dologin',router.doLogin);//登录业务页
app.get('/setavatar',router.showSetAvatar);//上传图片页面
app.post('/doavatar',router.doAvatar);//上传图片页面业务，因为ajax上传图片太难，记住给form加上属性
app.get('/cutpic',router.showCutPic);//图片裁剪页面,分两个页面
app.get('/docut',router.doCut);//图片裁剪业务
app.post('/post',router.doPost);//发表说说业务
app.get('/getshuoshuoAll',router.doShuoShuo);//所有说说的分页业务
app.get('/getshuopic',router.doShuoPic);//所有说说的图片
app.get('/getcount',router.doCount);//说说总数
app.get('/getuser/:username',router.showUser);//说说总数
app.get('/userlist',router.userList);//成员列表
app.get('/exit',router.doExit);//退出


app.listen(3000);