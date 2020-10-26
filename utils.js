const http = require('axios')
const _ = require('lodash')
const chalk = require('chalk');
const open = require("open");
const fecha = require('fecha')

function makeRequest() {
    return http.get('https://reserve-prime.apple.com/CN/zh_CN/reserve/A/availability.json', {
        headers: {
            'pragma': 'no-cache',
            'cache-control': 'no-cache'
        }
    })
}

async function exec(targetStoreIds = [320, 479, 645, 448, 388]) {
    const res = await makeRequest();
    const time = new Date();
    const allStores = res.data.stores
    const phone = 'MGLH3CH/A'
    let finded = false
    const targetStores = targetStoreIds.map(v => `R${v}`)
    targetStores.forEach(store => {
        if (finded) {
            return
        }
        if (allStores[store][phone].availability.unlocked === true) {
            finded = true;
            const url = `https://reserve-prime.apple.com/CN/zh_CN/reserve/A/availability?store=${store}&iUP=N&appleCare=N&rv=0&partNumber=${phone}`
            open(url, "chrome");
        }
    })
    if (finded) {

    } else {
        console.log(chalk.red(`${fecha.format(time, 'HH:mm:ss')}: not found`))
    }
    return finded;
}

async function findAnyPhoneAndOpen() {
    const time = new Date();
    const res = await makeRequest();
    const allStores = res.data.stores

    let target = null
    Object.entries(allStores).forEach(([storeName, store]) => {
        if (target) {
            return
        }
        Object.entries(store).forEach(([phone, obj]) => {
            if (target) {
                return
            }
            if (obj.availability.unlocked === true) {
                target = {
                    storeName,
                    phone
                }
            }
        })
    })
    if (target) {
        console.log(chalk.green(`${fecha.format(time, 'HH:mm:ss')}: Founded!!!`))
        const url = `https://reserve-prime.apple.com/CN/zh_CN/reserve/A/availability?store=${target.storeName}&iUP=N&appleCare=N&rv=0&partNumber=${target.phone}`
        open(url, "chrome");
    } else {
        console.log(chalk.red(`${fecha.format(time, 'HH:mm:ss')}: not found`))
    }
    return !!target
}

module.exports = {
    exec,
    findAnyPhoneAndOpen
}
