var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var Dayu = require('alidayu-node');
var aliApp = new Dayu("24530331", '809f67d3e0eb681d81f55c3fcb6130da');
var dataAccess = require('dataAccess');
var command = dataAccess.command;
var executor = dataAccess.executor;
var fs = require('fs');
var request = require('request');
//验证码长度
var verifyCodeLength = 6;
var verifyCoolDown = 60;
/**
 * 生成验证码
 */
var verifyCodeGen = function()
{
    //生成验证码
    var verifyCode = '';
    for(var i = 0;i < verifyCodeLength ;i++)
    {
        var num = Math.floor(Math.random()*10);
        verifyCode = verifyCode + (num + "");
    }
    return verifyCode;
}


router.post('/login',function(req,res){
    let mobile = req.body['mobile'];
    let password = req.body['pwd'];
    var sql = new command('select * from account where mobile = ?',[mobile]);
    executor.query('fin',sql,(e,r)=>{
        if(e){
            res.send({
                code:1006,
                msg:'登录时发生错误！'
            })
        }
        else{
            if(r.length === 0){
                res.send({
                    code:1007,
                    msg:'账号不存在，请先注册！'
                })
            }
            else{
                let salt = r[0]['salt'];
                let rpwd = `${password}_${salt}`;
                var spwd = crypto.createHash('sha1').update(rpwd).digest('hex');
                if(spwd === r[0]['pwd']){
                    res.cookie('token', crypto.createHash('sha1').update(`${mobile}_${~~new Date().getTime()/1000}`).digest('hex'),
                        { maxAge: 900000});
                    res.send({
                        code:200,
                        msg:'登录成功'
                    })
                }
                else{
                    res.send({
                        code:1008,
                        msg:'登录密码不正确！'
                    })
                }
            }
        }
    })
});

router.post('/register',function(req,res){
    //验证验证码
    let mobile = req.body['mobile'];
    let pwd = req.body['pwd'];
    let vCode = req.body['vcode'];
    let type = req.body['type'];
    let salt = verifyCodeGen();
    let rpwd = `${pwd}_${salt}`
    var spwd = crypto.createHash('sha1').update(rpwd).digest('hex');
    let sql = new command('select * from verifyCode where mobile = ? and code =? and isvalid =1',[mobile,vCode]);
    executor.query('fin',sql,(e,r)=>{
        if(e){
            res.send({
                code:1003,
                msg:'注册账号时发生错误！请稍后再试！'
            });
        }
        else{
            if(r.length === 0){
                res.send({
                    code:1004,
                    msg:'验证码错误！请重新获取！'
                });
            }
            else{
                let sql1 = new command('insert into account(mobile,pwd,type,salt,createAt) values(?,?,?,?,?)',
                    [mobile,spwd,type,salt,~~(new Date().getTime()/1000)]);
                let sql2 = new command('update verifyCode set isvalid = 0 where id = ?',[r[0].id]);
                executor.transaction('fin',[sql1,sql2],(ee,rr)=>{
                    if(ee){
                        if(ee.code === 'ER_DUP_ENTRY'){
                            res.send({
                                code:1005,
                                msg:'账号已经存在，请勿重复注册！'
                            });
                        }
                        else{
                            res.send({
                                code:1003,
                                msg:'注册账号时发生错误！请稍后再试！'
                            });
                        }
                    }
                    else{
                        res.cookie('token', crypto.createHash('sha1').update(`${mobile}_${~~new Date().getTime()/1000}`).digest('hex'),
                            { maxAge: 900000});
                        res.send({
                            code:200,
                            msg:'注册成功！'
                        })
                    }
                })
            }
        }
    })
})

router.get('/smsCode',function(req,res){
    let mobile = req.query['mobile'];
    let picCode = req.query['picCode'];
    if(picCode&&picCode.toString().toLowerCase() === req.session.picCode.toString().toLowerCase()){
        //发送验证码
        let code = verifyCodeGen();
        aliApp.smsSend({
            sms_free_sign_name: '登录验证',
            sms_param: {"code": code.toString(), "product": "游信通"},
            rec_num: mobile.toString(),
            sms_template_code: 'SMS_44500616'
        },()=>{
            let sql = new command('update verifyCode set isvalid = 0 where mobile = ? and isvalid = 1',[mobile]);
            let sql1 = new command('insert into verifyCode(mobile,code,createAt,isvalid) values(?,?,?,?)',
                [mobile,code,~~(new Date().getTime()/1000),1]);
            executor.transaction('fin',[sql,sql1],(e,r)=>{
                if(!e){
                    res.send({
                        code:200,
                        msg:'获取验证码成功！'
                    });
                }
                else{
                    res.send({
                        code:1002,
                        msg:'获取验证码时发生错误，请稍后再试！'
                    });
                }
            })
        });
    }
    else{
        res.send({
            code:1001,
            msg:'图形验证码错误！请重新输入！'
        });
    }
})

router.get('/genPicCode',function(req,res){
    // let ary = ccap.get();
    // let txt = ary[0];
    // let buf = ary[1];

    let url = `http://ccapservice.magiclizi.com/ccapInfo`;
    request(url, function (error, response, body) {
        let json = JSON.parse(body);
        let base64Image = json['base64Image'];
        req.session.picCode = json['txt'];
        res.send(base64Image);
    });
})

module.exports = router;
