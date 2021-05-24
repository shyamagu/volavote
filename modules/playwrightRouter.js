var express = require('express')
var router = express.Router()
const voteBox = require("./votebox")
const pw = require('playwright')

router.use(function (req,res,next){
    next()
})

router.post('/',function(req,res,next){

    const title = req.body.title
    const authkey = req.body.authkey
    if(authkey !== process.env.KEY){
        res.json({auth:"NG"})
        return
    }

    const oneVote = voteBox.checkPoll(title)

    if(!oneVote){
        res.send("Empty")
        return
    }

    const type = oneVote.TYPE

    let path = "/"
    if(type === "ALT"){
        path +="alt?title=" + encodeURI(title)
    }else if(type === "MBQ"){
        path +="mbq?title=" + encodeURI(title)
    }else if(type === "SURVEY"){
        path +="survey?title=" + encodeURI(title)
    }else if(type === "MULTI"){
        path +="multi?title=" + encodeURI(title)
    }else if(type === "MAP"){
        path +="map?title=" + encodeURI(title) 
    }else if(type === "TEXT"){
        path +="text?title=" + encodeURI(title)
    }
    const fullurl = req.protocol + '://' + req.get('host') + path;

    (async () => {
        const browser = await pw.chromium.launch()
        const context = await browser.newContext()
        const page = await context.newPage()
        await page.goto(fullurl, { waitUntil: 'networkidle' })
        const element = await page.$('#result')
        const image = await element.screenshot()
        await browser.close()
        res.end(image)
    })()

})

module.exports = router