/**
 * Created by magiclizi on 2017/7/3.
 */
function login(){
    var mobile = $("#logAccount").val();
    var password = $("#logPassword").val();
    if(checkPhone(mobile)){
        $.post('/login',{mobile:mobile,pwd:password},function(data){
            if(data.code===200){
                window.location = 'company_info.html';
            }
            else{
                alert(data.msg);
            }
        })
    }
}

function register(type){
    var mobile = $("#account").val();
    var password = $("#password").val();
    var verifycode = $("#verifycode").val();
    if(checkPhone(mobile)){
        if(verifycode.length === 6){
            $.post('/register',{mobile:mobile,pwd:password,vcode:verifycode,type:type},function(data){
                if(data.code===200){
                    alert('注册成功!');
                    window.location = 'personal_info.html';
                }
                else{
                    alert(data.msg);
                }
            })
        }
        else{
            alert('请输入6位数验证码！');
        }
    }
}

function checkPhone(phone){
    if(!(/^1[34578]\d{9}$/.test(phone))){
        alert('请输入正确的手机号码！');
        return false;
    }
    return true;
}

function getSMSCode(){
    var mobile = $("#account").val();
    var picCode = $("#msgcode").val();
    if(checkPhone(mobile)){
        $.get('/smsCode',{mobile:mobile,picCode:picCode},function(data){
            if(data.code!==200){
                genPicCode();
            }
            alert(data.msg);
        })
    }
}

function genPicCode(){
    $.get('/genPicCode',{},function(data){
        var img = 'data:image/png;base64,'+data;
        $("#msgimg").attr('src',img);
    })
}