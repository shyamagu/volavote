module.exports = function(io) {

    var express = require('express')
    var router = express.Router()
    const voteBox = require("./votebox")
    var createError = require('http-errors');

    router.use(function (req,res,next){
        next()
    })

    router.get('/', function(req, res, next) {
        const fullurl = req.protocol + '://' + req.get('host') + req.originalUrl;

        if(req.acceptsLanguages('ja','en')=="ja"){
            res.render('index_jp', { title: "volavote", url:fullurl});
        }else{
            res.render('index', { title: "volavote", url:fullurl});
        }
    });

    router.get('/alt', function(req, res, next) {
        const title = req.query.title
        if(process.env.ANONYMOUS=="true"){
            makeNewALTVote(title)
            res.render('vote', { title: title});
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('vote', { title: title});
            }else{
                next(createError(404));
            }
        }
    });

    router.get('/survey', function(req, res, next) {
        const title = req.query.title
        const type  = req.query.type
        let num = req.query.num
        if(!num) num = 5
        if(num < 2 || num > 5) num=5
        const d1 = req.query.d1
        const d2 = req.query.d2
        const d3 = req.query.d3
        const d4 = req.query.d4
        const d5 = req.query.d5
        if(process.env.ANONYMOUS=="true"){
            makeNewSurveyVote(title,num,d1,d2,d3,d4,d5)
            res.render('survey', { title: title, num:num, d1:d1, d2:d2, d3:d3, d4:d4, d5:d5});
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('survey', { title: title, num:checked.METADATA.STEP, d1:checked.METADATA.D1, d2:checked.METADATA.D2, d3:checked.METADATA.D3, d4:checked.METADATA.D4, d5:checked.METADATA.D5});
            }else{
                next(createError(404));
            }
        }

    });

    router.get('/map', function(req, res, next) {
        const title = req.query.title
        let image = req.query.image
        let width = req.query.width
        if(isNaN(width)) width=500
        if(image==="japan"){
            image = "/images/japan.gif"
        }else if(image === "world"){
            image = "/images/world_img.png"
        }else if(image === "kanto"){
            image = "/images/kanto.gif"
        }

        if(process.env.ANONYMOUS=="true"){
            makeNewMapVote(title,image,width)
            res.render('map', { title: title, image: image, width: width});
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('map', { title: title, image: checked.METADATA.IMG, width: checked.METADATA.IMG_w});
            }else{
                next(createError(404));
            }
        }

    });

    router.get('/text', function(req, res, next) {
        const title = req.query.title
        let constraint = req.query.constraint
        if(constraint != "MULTI"){
            constraint = "SINGLE"
        }

        let label_post = "Post"
        let label_repost ="Re-Post"
        let label_agree = "Agree!"
        if(req.acceptsLanguages('ja','en')=="ja"){
            label_post = "投稿する"
            label_repost = "再投稿する"
            label_agree = "同意！"
        }
        if(process.env.ANONYMOUS=="true"){
            makeNewTextVote(title,constraint)
            res.render('text', { title: title, post:label_post, repost:label_repost, agree:label_agree, constraint:constraint});
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('text', { title: title, post:label_post, repost:label_repost, agree:label_agree, constraint:checked.METADATA.CONSTRAINT});
            }else{
                next(createError(404));
            }
        }
    });


    function makeNewALTVote(title){
        voteBox.setMetadata(title,"ALT",{})
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

    router.post('/vote',function(req,res,next){
        const vote = req.body

        let checked = voteBox.checkPoll(vote.title)
        if(!checked || !voteBox.validateVote(vote)){
            res.json("NG")
            return
        }

        const judge = vote.vote

        if(checked.METADATA.CONSTRAINT==="MULTI"){
            voteBox.voteMulti(vote.title,req.session.id,judge)
        }else{
            voteBox.vote(vote.title,req.session.id,judge)
        }

        io.emit('voting',voteBox.countUp(vote.title))

        res.json("OK")
    })

    router.get('/controll',function(req,res,next){
        res.render('controll')
    })

    router.post('/controll/get',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            const anonymous = process.env.ANONYMOUS? process.env.ANONYMOUS: false
            res.json({auth:"OK",result:voteBox.countUpAll(),anonymous:anonymous})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.post('/controll/switch',function(req,res,next){
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

    router.post('/controll/create',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            const title = req.body.title
            const type  = req.body.type
            
            if(type === "ALT"){
                makeNewALTVote(title)
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

    router.post('/controll/anonymous',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            const anonymous = req.body.anonymous
            process.env.ANONYMOUS = anonymous
            res.json({auth:"OK"})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.post('/controll/getall',function(req,res,next){
        const authkey = req.body.authkey
        if(authkey === process.env.KEY){
            res.json({auth:"OK",result:voteBox.getAll()})
        }else{
            res.json({auth:"NG"})
        }
    })

    router.get('/controll/result',function(req,res,next){
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

    router.post('/controll/replace',function(req,res,next){
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

 return router
}

