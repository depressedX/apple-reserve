const {findAnyPhoneAndOpen} = require('./utils')

let timer = 0;

function timeoutFunc() {

    findAnyPhoneAndOpen().then(res => {
        if (!res) {
            timer = setTimeout(timeoutFunc, 1000)
        }
    }).catch((e) => {
        console.log('error occured. retry')
        timer = setTimeout(timeoutFunc, 1000)
    })
}

timeoutFunc()
