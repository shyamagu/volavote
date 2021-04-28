const {v4: uuidv4}=require('uuid')

class BallotBox {

    static newPoll(title,type,METADATA){
        const vvid = uuidv4();
        this.box[vvid] = {}
        this.box[vvid]["TITLE"] = title
        this.box[vvid]["ID"] = this.id++
        this.box[vvid]["RESULT"] = {}
        this.box[vvid]["TYPE"] = type
        this.box[vvid]["METADATA"] = METADATA
    }

    static setCurrent(id){
        this.current = id
    }

    static validateVote(vote){
        return true
    }

    static vote(vvid,sessionid,vote) {
        this.box[vvid]["RESULT"][sessionid]=vote
    }

    static getAll(){
        return this.box
    }

    static countUpAll(){
        let returnBoxes = []
        Object.keys(this.box).forEach(vvid=>{
            let returnBox = this.countUp(vvid)
            returnBoxes.push(returnBox)
        })
        return returnBoxes
    }

    static countUp(vvid){
        if(!this.box[vvid]) return
        const title = this.box[vvid]["TITLE"]
        const type = this.box[vvid]["TYPE"]
        const id = this.box[vvid]["ID"]

        let returnBox = {}
        returnBox["title"]=title
        returnBox["TYPE"]=type
        returnBox["ID"] = id
        returnBox["CURRENT"] = (id===this.current)

        if(type === "ALT"){
            returnBox["YES"]=0
            returnBox["NO"] =0

            let result = this.box[vvid]["RESULT"]
            for(let key in result){
            returnBox[result[key]] = (returnBox[result[key]])? returnBox[result[key]]+1 : 1;
            }
        }else if(type === "SURVEY"){
            returnBox["STEP"]=this.box[vvid]["METADATA"]["STEP"]
            returnBox["S1"] =0
            returnBox["S2"] =0
            returnBox["S3"] =0
            returnBox["S4"] =0
            returnBox["S5"] =0
            returnBox["D1"] =this.box[vvid]["METADATA"]["D1"]
            returnBox["D2"] =this.box[vvid]["METADATA"]["D2"]
            returnBox["D3"] =this.box[vvid]["METADATA"]["D3"]
            returnBox["D4"] =this.box[vvid]["METADATA"]["D4"]
            returnBox["D5"] =this.box[vvid]["METADATA"]["D5"]

            let result = this.box[vvid]["RESULT"]
            for(let key in result){
            returnBox[result[key]] = (returnBox[result[key]])? returnBox[result[key]]+1 : 1;
            }
        }else if(type === "MAP"){
            returnBox["IMG"] =this.box[vvid]["METADATA"]["IMG"]
            returnBox["IMG_w"] =this.box[vvid]["METADATA"]["IMG_w"]
            returnBox["MAP"]=[]

            let result = this.box[vvid]["RESULT"]
            for(let key in result){
                returnBox["MAP"].push(result[key])
            }
        }

        return returnBox
    }
}

BallotBox.box = {}
BallotBox.id = 0
BallotBox.current = null

module.exports = BallotBox