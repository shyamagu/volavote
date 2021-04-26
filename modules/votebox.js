class VoteBox {
    static setMetadata(title,type,METADATA){
        if(!this.votebox[title]){
            this.votebox[title] = {}
            this.votebox[title]["RESULT"] = {}
        }
        this.votebox[title]["TYPE"]=type
        this.votebox[title]["METADATA"] = METADATA
    }

    static validateVote(vote){
        return true
    }

    static vote(title,sessionid,vote) {
        this.votebox[title]["RESULT"][sessionid]=vote
    }

    static getAll(){
        return this.votebox
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

        let returnBox = {}
        returnBox["title"]=title
        returnBox["TYPE"]=type

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
        }

        return returnBox
    }
}

VoteBox.votebox = {}

module.exports = VoteBox