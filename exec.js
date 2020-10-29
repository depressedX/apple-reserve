const {exec} = require('./utils')

let timer = 0

function timeoutFunc() {

    exec().then(res => {
        if (!res) {
            timer = setTimeout(timeoutFunc, 1000)
        }
    }).catch(() => {
        timer = setTimeout(timeoutFunc, 1000)
    })
}

timeoutFunc()