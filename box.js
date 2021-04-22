global.box = {}

class VoteBox {
    static vote(sessionid,vote) {
        this.box[sessionid]=vote
    }
}

module.exports = VoteBox