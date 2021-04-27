const voteBox = require("./votebox")

module.exports = (io) => {
    io.on('connection',function(socket){
        socket.on('voting',function(title){
            let returnBox = voteBox.countUp(title)
            io.emit('voting',returnBox)
        })
    })
}