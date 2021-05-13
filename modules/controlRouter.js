module.exports = function(io) {

    var express = require('express')
    var router = express.Router()
    const voteBox = require("./votebox")
    var createError = require('http-errors');

    router.use(function (req,res,next){
        next()
    })

    function makeNewALTVote(title){
        voteBox.setMetadata(title,"ALT",{})
    }

    function makeNewMbQuizVote(title,maru,batsu){
        voteBox.setMetadata(title,"MBQ",{"MARU":maru,"BATSU":batsu})
    }

    function makeNewSurveyVote(title,num,d1,d2,d3,d4,d5){
        voteBox.setMetadata(title,"SURVEY",{"STEP":num,"D1":d1,"D2":d2,"D3":d3,"D4":d4,"D5":d5})
    }

    function makeNewMapVote(title,image,width){
        voteBox.setMetadata(title,"MAP",{"IMG":image,"IMG_w":width})
    }

    function makeNewTextVote(title,constraint){
        voteBox.setMetadata(title,"TEXT",{CONSTRAINT:constraint})
    }

    router.get('/',function(req,res,next){
        res.render('control')
    })

    router.post('/get',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            const anonymous = process.env.ANONYMOUS? process.env.ANONYMOUS: "false"
            const code = process.env.CODE? process.env.CODE: ""
            res.json({auth:"OK",result:voteBox.countUpAll(),anonymous:anonymous,code:code})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.post('/switch',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            const id = req.body.id
            const url= req.body.url
            voteBox.setCurrent(id)
            io.emit('switch',url)
            res.json({auth:"OK",result:voteBox.countUpAll()})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.post('/create',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            const title = req.body.title
            const type  = req.body.type
            
            if(type === "ALT"){
                makeNewALTVote(title)
            }else if(type === "MBQ"){
                const displays = req.body.quiz2c
                makeNewMbQuizVote(title,displays[0],displays[1])
            }else if(type === "SURVEY"){
                let num = req.body.num
                const ds = req.body.ds
                if(!num) num = 5
                if(num < 2 || num > 5) num=5

                makeNewSurveyVote(title,num,ds[0],ds[1],ds[2],ds[3],ds[4],ds[5])
            }else if(type === "MAP"){
                let image = req.body.image
                const width = req.body.width
                if(isNaN(width)) width=500
                if(image==="japan"){
                    image = "/images/japan.gif"
                }else if(image === "world"){
                    image = "/images/world_img.png"
                }else if(image === "kanto"){
                    image = "/images/kanto.gif"
                }

                makeNewMapVote(title,image,width)
            }else if(type === "TEXT"){
                makeNewTextVote(title,req.body.constraint)
            }
            res.json({auth:"OK",result:voteBox.countUpAll()})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.post('/anonymous',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            const anonymous = req.body.anonymous
            process.env.ANONYMOUS = anonymous
            res.json({auth:"OK"})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.post('/getall',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            res.json({auth:"OK",result:voteBox.getAll()})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.get('/result',function(req,res,next){
        const type = req.query.type
        const authkey = req.query.authkey
        if(authkey === process.env.KEY){

            if(type==="all"){
                res.render('box',{box:JSON.stringify(voteBox.getAll(),null,4)})
            }else if(type==="countup"){
                res.render('box',{box:JSON.stringify(voteBox.countUpAll(),null,4)})
            }
        }else{
            res.render('box',{box:""})
        }
    })

    router.post('/replace',function(req,res,next){
        const authkey = req.body.authkey
        const box = req.body.box
        if(authkey === process.env.KEY){
            voteBox.replace(box)
            io.emit('voting',{})
            res.json({auth:"OK"})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.post('/code',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            process.env.CODE = req.body.code
            res.json({auth:"OK"})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.get('/showqr',function(req,res,next){
        const title = req.query.title
        const type = req.query.type
        const code = req.query.code

        let path = "/"
        if(type === "ALT"){
            path +="alt?title=" + encodeURI(title)
        }else if(type === "SURVEY"){
            path +="survey?title=" + encodeURI(title)
        }else if(type === "MAP"){
            path +="map?title=" + encodeURI(title) 
        }else if(type === "TEXT"){
            path +="text?title=" + encodeURI(title)
        }

        const fullurl = req.protocol + '://' + req.get('host') + path;

        res.render('qr', { title: title, url:fullurl, code:code});
    })

    router.post('/check',function(req,res,next){
        const code = req.body.code
        const url  = req.body.url

        if(code === process.env.CODE){
            req.session.CODE = code
            res.json({check:"OK"})
        }else{
            res.json({check:"NG"})
        }
    })

    router.post('/emphasize',function(req,res,next){
        const authkey = req.body.authkey
        const title = req.body.title
        const index = req.body.index
        if(authkey === process.env.KEY){
            io.emit('emphasize',{title:title,index:index})
            res.json({auth:"OK"})
        }else{
            res.json({auth:"NG"})
        }
    })

 return router
}

