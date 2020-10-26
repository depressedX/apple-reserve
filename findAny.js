const {findAnyPhoneAndOpen} = require('./utils')

const timer = setInterval(() => {
    findAnyPhoneAndOpen().then(res => {
        if (res) {
            clearInterval(timer)
        }
    })
}, 1000)
