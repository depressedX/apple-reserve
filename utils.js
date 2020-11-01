const http = require('axios')
const _ = require('lodash')
const chalk = require('chalk');
const open = require("open");
const fecha = require('fecha')

function makeRequest() {
    return http.get('https://reserve-prime.apple.com/CN/zh_CN/reserve/A/availability.json', {
        headers: {
            'pragma': 'no-cache',
            'cache-control': 'no-cache',
            'referer': 'https://reserve-prime.apple.com/CN/zh_CN/reserve/A/availability?store=R645&iUP=N&appleCare=N&rv=0&partNumber=MGLH3CH/A',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.111 Safari/537.36'
        },
        timeout: 2500,
    })
}

async function exec(targetStoreIds = [320, 479, 645, 448, 388], phone = 'MGLH3CH/A') {
    const res = await makeRequest();
    const time = new Date();
    const allStores = res.data.stores
    let finded = false
    const targetStores = targetStoreIds.map(v => `R${v}`)

    let targetPhones = Array.isArray(phone) ? phone : [phone]
    targetStores.forEach(store => {
        if (finded) {
            return
        }
        targetPhones.forEach(phone => {

            if (allStores[store][phone].availability.unlocked === true) {
                finded = true;
                const url = `https://reserve-prime.apple.com/CN/zh_CN/reserve/A/availability?store=${store}&iUP=N&appleCare=N&rv=0&partNumber=${phone}`
                open(url, "chrome");
            }
        })
    })
    if (finded) {
        console.log(chalk.green(`${fecha.format(time, 'HH:mm:ss')}: Founded!!!`))
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
