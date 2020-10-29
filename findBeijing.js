const { exec } = require('./utils')

let timer = 0

function timeoutFunc() {

    exec(undefined, [
        'MGLH3CH/A', 'MGLM3CH/A', 'MGLD3CH/A',
        'MGLC3CH/A', 'MGLG3CH/A', 'MGLL3CH/A',
        'MGLA3CH/A', 'MGLF3CH/A', 'MGLK3CH/A',
        'MGL93CH/A', 'MGLE3CH/A', 'MGLJ3CH/A',
    ]).then(res => {
        if (!res) {
            timer = setTimeout(timeoutFunc, 1000)
        }
    }).catch(() => {
        timer = setTimeout(timeoutFunc, 1000)
    })
}

timeoutFunc()