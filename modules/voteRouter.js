module.exports = function(io) {

    var express = require('express')
    var router = express.Router()
    const voteBox = require("./votebox")
    var createError = require('http-errors');

    router.use(function (req,res,next){
        if(process.env.ANONYMOUS=="false" && process.env.CODE){
            if(req.session.CODE === process.env.CODE){
                next()
            }else{
                res.render('login', { title: "Enter CODE", url:req.url});
            }
        }else{
            next()
        }
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
        const image = req.query.image

        if(process.env.ANONYMOUS=="true"){
            makeNewALTVote(title,image)
            res.render('vote', { title: title, image:image});
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('vote', { title: title, image: checked.METADATA.IMG});
            }else{
                next(createError(404));
            }
        }
    });

    router.get('/mbq', function(req, res, next) {
        const title = req.query.title
        let maru = req.query.maru
        let batsu= req.query.batsu
        if(!maru) maru = "o"
        if(!batsu)batsu= "x"
        const image = req.query.image

        if(process.env.ANONYMOUS=="true"){
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('quizmb', { title: title, maru: checked.METADATA.MARU, batsu: checked.METADATA.BATSU, image: checked.METADATA.IMG});
            }else{
                makeNewMbQuizVote(title,maru,batsu,image)
                res.render('quizmb', { title: title, maru: maru, batsu: batsu, image:image});
            }
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('quizmb', { title: title, maru: checked.METADATA.MARU, batsu: checked.METADATA.BATSU, image: checked.METADATA.IMG});
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
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('survey', { title: title, num:checked.METADATA.STEP, d1:checked.METADATA.D1, d2:checked.METADATA.D2, d3:checked.METADATA.D3, d4:checked.METADATA.D4, d5:checked.METADATA.D5});
            }else{
                makeNewSurveyVote(title,num,d1,d2,d3,d4,d5)
                res.render('survey', { title: title, num:num, d1:d1, d2:d2, d3:d3, d4:d4, d5:d5});
            }
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('survey', { title: title, num:checked.METADATA.STEP, d1:checked.METADATA.D1, d2:checked.METADATA.D2, d3:checked.METADATA.D3, d4:checked.METADATA.D4, d5:checked.METADATA.D5});
            }else{
                next(createError(404));
            }
        }
    });

    router.get('/multi', function(req, res, next) {
        const title = req.query.title
        const type  = req.query.type
        let num = req.query.num
        if(isNaN(num)) num = 5
        const constraint = req.query.constraint
        const ds = req.query.ds? JSON.parse(req.query.ds) : []

        if(process.env.ANONYMOUS=="true"){
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('multi', { title: title, num:checked.METADATA.NUM, ds:checked.METADATA.DS, constraint:checked.METADATA.CONSTRAINT});
            }else{
                makeNewMultiVote(title,num,ds,constraint)
                res.render('multi', { title: title, num:num, ds:ds, constraint:constraint});
            }
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('multi', { title: title, num:checked.METADATA.NUM, ds:checked.METADATA.DS, constraint:checked.METADATA.CONSTRAINT});
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
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('map', { title: title, image: checked.METADATA.IMG, width: checked.METADATA.IMG_w});
            }else{
                makeNewMapVote(title,image,width)
                res.render('map', { title: title, image: image, width: width});
            }
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
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('text', { title: title, post:label_post, repost:label_repost, agree:label_agree, constraint:checked.METADATA.CONSTRAINT});
            }else{
                makeNewTextVote(title,constraint)
                res.render('text', { title: title, post:label_post, repost:label_repost, agree:label_agree, constraint:constraint});
            }
        }else{
            let checked = voteBox.checkPoll(title)
            if(checked){
                res.render('text', { title: title, post:label_post, repost:label_repost, agree:label_agree, constraint:checked.METADATA.CONSTRAINT});
            }else{
                next(createError(404));
            }
        }
    });


    function makeNewALTVote(title, image){
        voteBox.setMetadata(title,"ALT",{"IMG":image})
    }

    function makeNewMbQuizVote(title,maru,batsu,image){
        voteBox.setMetadata(title,"MBQ",{"MARU":maru,"BATSU":batsu,"IMG":image})
    }

    function makeNewSurveyVote(title,num,d1,d2,d3,d4,d5){
        voteBox.setMetadata(title,"SURVEY",{"STEP":num,"D1":d1,"D2":d2,"D3":d3,"D4":d4,"D5":d5})
    }

    function makeNewMultiVote(title,num,ds,constraint){
        voteBox.setMetadata(title,"MULTI",{"NUM":num,"DS":ds,"CONSTRAINT":constraint})
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

 return router
}

