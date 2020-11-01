const {exec} = require('./utils')

let timer = 0

function timeoutFunc() {

    exec(undefined, ['MGLH3CH/A']).then(res => {
        if (!res) {
            timer = setTimeout(timeoutFunc, 1000)
        }
    }).catch(() => {
        console.log('error occured. retry')
        timer = setTimeout(timeoutFunc, 1000)
    })
}

timeoutFunc()