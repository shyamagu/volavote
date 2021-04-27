module.exports = function(io) {

    var express = require('express')
    var router = express.Router()
    const voteBox = require("./votebox")

    router.use(function (req,res,next){
        next()
    })

    router.get('/', function(req, res, next) {
    const fullurl = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.render('index', { title: "volavote", url:fullurl});
    });

    router.get('/alt', function(req, res, next) {
    const title = req.query.title
    voteBox.setMetadata(title,"ALT")
    res.render('vote', { title: title});
    });

    router.get('/survey', function(req, res, next) {
    const title = req.query.title
    const type  = req.query.type
    let num = req.query.num
    if(!num) num = 5
    const d1 = req.query.d1
    const d2 = req.query.d2
    const d3 = req.query.d3
    const d4 = req.query.d4
    const d5 = req.query.d5
    voteBox.setMetadata(title,"SURVEY",{"STEP":num,"D1":d1,"D2":d2,"D3":d3,"D4":d4,"D5":d5})
    res.render('survey', { title: title, num:num, d1:d1, d2:d2, d3:d3, d4:d4, d5:d5});
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
    voteBox.setMetadata(title,"MAP",{"IMG":image,"IMG_w":width})
    res.render('map', { title: title, image: image, width: width});
    });

    router.get('/box',function(req,res,next){
    res.render('box',{box:JSON.stringify(voteBox.getAll(),null,4)})
    })

    router.get('/result',function(req,res,next){
    res.render('box',{box:JSON.stringify(voteBox.countUpAll(),null,4)})
    })

    router.post('/vote',function(req,res,next){
    const vote = req.body

    if(!voteBox.validateVote(vote)){
        res.json("NG")
        return
    }

    const judge = vote.vote 
    voteBox.vote(vote.title,req.session.id,judge)
    io.emit('voting',voteBox.countUp(vote.title))

    res.json("OK")
    })

 return router
}

