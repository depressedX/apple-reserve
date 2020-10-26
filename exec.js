const {exec} = require('./utils')

const timer = setInterval(() => {
    exec().then(res => {
        if (res) {
            clearInterval(timer)
        }
    }).catch(() => {})
}, 1000)
