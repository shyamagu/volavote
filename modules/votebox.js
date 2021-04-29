class VoteBox {
    static setMetadata(title,type,METADATA){
        if(!this.votebox[title]){
            this.votebox[title] = {}
            this.votebox[title]["ID"] = this.id++
            this.votebox[title]["RESULT"] = {}
        }
        this.votebox[title]["TYPE"]=type
        this.votebox[title]["METADATA"] = METADATA
    }

    static setCurrent(id){
        this.current = id
    }

    static checkPoll(title){
        if(this.votebox[title]){
            return {TYPE:this.votebox[title]["TYPE"],METADATA:this.votebox[title]["METADATA"]}
        }else{
            return null
        }
    }

    static validateVote(vote){
        return true
    }

    static vote(title,sessionid,vote) {
        this.votebox[title]["RESULT"][sessionid]=vote
    }

    static voteMulti(title,sessionid,vote) {
        this.votebox[title]["RESULT"][sessionid+Date.now()]=vote
    }

    static getAll(){
        return this.votebox
    }

    static replace(box){
        this.votebox = box
        this.id = 0
        this.current = null
    }

    static countUpAll(){
        let returnBoxes = []
        Object.keys(this.votebox).forEach(title=>{
            let returnBox = this.countUp(title)
            returnBoxes.push(returnBox)
        })
        return returnBoxes
    }

    static countUp(title){
        if(!this.votebox[title]) return
        const type = this.votebox[title]["TYPE"]
        const id = this.votebox[title]["ID"]

        let returnBox = {}
        returnBox["title"]=title
        returnBox["TYPE"]=type
        returnBox["ID"] = id
        returnBox["CURRENT"] = (id===this.current)

        if(type === "ALT"){
            returnBox["YES"]=0
            returnBox["NO"] =0

            let result = this.votebox[title]["RESULT"]
            for(let key in result){
                returnBox[result[key]] = (returnBox[result[key]])? returnBox[result[key]]+1 : 1;
            }
        }else if(type === "SURVEY"){
            returnBox["STEP"]=this.votebox[title]["METADATA"]["STEP"]
            returnBox["S1"] =0
            returnBox["S2"] =0
            returnBox["S3"] =0
            returnBox["S4"] =0
            returnBox["S5"] =0
            returnBox["D1"] =this.votebox[title]["METADATA"]["D1"]
            returnBox["D2"] =this.votebox[title]["METADATA"]["D2"]
            returnBox["D3"] =this.votebox[title]["METADATA"]["D3"]
            returnBox["D4"] =this.votebox[title]["METADATA"]["D4"]
            returnBox["D5"] =this.votebox[title]["METADATA"]["D5"]

            let result = this.votebox[title]["RESULT"]
            for(let key in result){
                returnBox[result[key]] = (returnBox[result[key]])? returnBox[result[key]]+1 : 1;
            }
        }else if(type === "MAP"){
            returnBox["IMG"] =this.votebox[title]["METADATA"]["IMG"]
            returnBox["IMG_w"] =this.votebox[title]["METADATA"]["IMG_w"]
            returnBox["MAP"]=[]

            let result = this.votebox[title]["RESULT"]
            for(let key in result){
            returnBox["MAP"].push(result[key])
            }
        }else if(type === "TEXT"){
            let result = this.votebox[title]["RESULT"]
            returnBox["CONSTRAINT"]=this.votebox[title]["METADATA"]["CONSTRAINT"]
            returnBox["MESSAGES"]={}
            for(let key in result){
                returnBox["MESSAGES"][result[key]] = (returnBox["MESSAGES"][result[key]])? returnBox["MESSAGES"][result[key]]+1 : 1;
            }
        }

        return returnBox
    }
}

VoteBox.votebox = {}
VoteBox.id = 0
VoteBox.current = null

module.exports = VoteBox