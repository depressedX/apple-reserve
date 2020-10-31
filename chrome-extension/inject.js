console.log('Apple预约辅助已开启')

const Steps = {
    RESERVE: 'reserve',
    CODE: 'code',
    Final: 'final'
}

function getCurrentStep() {
    const url = window.location.href
    if (/\/[AF]\/availability/.test(url)) {
        return Steps.RESERVE
    }
    // 注册码和最后一步用的是同一个页面  最好根据页面元素区分
    if (document.querySelector('.date-select') && document.querySelector('.contact-form')) {
        return Steps.Final
    }
    if (document.getElementById('phoneNumber') && document.getElementById('registrationCode')) {
        return Steps.CODE
    }
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve()
        }, ms)
    })
}

function fire(elm, events) {
    var u = !1, f = document.querySelector("[data-reactroot]") !== null, e, r;
    for (elm.getAttribute("jsname") !== null && (e = (elm.nextElementSibling && elm.nextElementSibling.className || "") + (elm.parentNode.previousElementSibling && elm.parentNode.previousElementSibling.className || ""), u = e.indexOf("Placeholder") > -1), u || (u = f || elm.getAttribute("data-reactid") !== null), events.unshift("focus"), events.push("blur"), r = 0; r < events.length; ++r) f && events[r] !== "input" || elm.dispatchEvent(new Event(events[r], {bubbles: events[r] === "input" && u}))
}


function executeStep(step) {
    if (step === Steps.RESERVE) {
        const submitButton = document.querySelector('.pricebox-summary button')
        if (!submitButton) {
            return false;
        }
        submitButton.click()
    } else if (step === Steps.CODE) {
        const phoneNumberElm = document.getElementById('phoneNumber')
        const registrationCodeElm = document.getElementById('registrationCode')
        if (!phoneNumberElm || !registrationCodeElm) {
            return false;
        }
        phoneNumberElm.value = '13181732049'
        fire(phoneNumberElm, ["keydown", "keypress", "input", "keyup", "change"])
        registrationCodeElm.value = localStorage.getItem(APPLE_CODE_KEY)
        fire(registrationCodeElm, ["keydown", "keypress", "input", "keyup", "change"])

    } else if (step === Steps.Final) {
        const timeslotElm = document.getElementById('timeslot');
        const timeslotOptions = timeslotElm.querySelectorAll('option')
        const timeslotOption = timeslotOptions[timeslotOptions.length - 1]
        const governmentIDTypeElm = document.getElementById('governmentIDType');
        const govIdElm = document.getElementById('govId')
        if (!govIdElm || !governmentIDTypeElm || !timeslotElm || !timeslotOption) {
            return false;
        }

        timeslotElm.value = timeslotOption.value
        fire(timeslotElm, ['input', 'change'])


        governmentIDTypeElm.value = 'idCardChina'
        fire(governmentIDTypeElm, ['input', 'change'])


        govIdElm.value = '370523199807071018'
        fire(govIdElm, ["keydown", "keypress", "input", "keyup", "change"])


        // 对于select events=['input','change']
    } else {
        return false;
    }
    return true;
}

const APPLE_CODE_KEY = 'APPLE_CODE'

const root = document.createElement('div')

document.body.appendChild(root)

const app = new Vue({
    el: root,
    template: `
<div>
    <div class="step-executor">
    当前：<span class="step-text">{{stepText}}</span>&nbsp;&nbsp;按下f执行
    </div>
    <div v-if="step===Steps.CODE" class="code-editor">
        <template v-if="!editing">
            <span>{{code}}</span>
            <button @click="onEditClick">修改</button>
        </template>
        <template v-else>
            <input v-model="inputValue"/>
            <button @click="onConfirmClick">保存</button>
            <button @click="onCancelClick">返回</button>
        </template>
    </div>
</div>
`,
    created() {
        // window.addEventListener('keydown', (event) => {
        //     if (event.code === 'Space') {
        //         event.preventDefault()
        //         event.stopImmediatePropagation()
        //         executeStep(this.step)
        //     } else if (event.code === 'Digit1') {
        //         event.preventDefault()
        //         event.stopImmediatePropagation()
        //         executeStep(this.step, 1)
        //     } else if (event.code === 'Digit2') {
        //         event.preventDefault()
        //         event.stopImmediatePropagation()
        //         executeStep(this.step, 2)
        //     }
        // }, true)


        const observer = new MutationObserver(() => {
            this.step = getCurrentStep()
        })
        observer.observe(document.body, {
            subtree: true,
            childList: true
        })

    },
    data() {
        return {
            step: getCurrentStep(),
            editing: false,
            code: this.getCodeFromStorage(),
            inputValue: '',
            Steps,
        }
    },
    watch: {
        step() {
            this.tryExecute()
        }
    },
    methods: {
        tryExecute() {
            setTimeout(() => {
                console.log('trying execute')
                const res = this.step && executeStep(this.step);
                if (!res) {
                    this.tryExecute()
                }
            }, 500)
        },
        getCodeFromStorage() {
            return localStorage.getItem(APPLE_CODE_KEY)
        },
        saveCode() {
            localStorage.setItem(APPLE_CODE_KEY, this.inputValue);
        },
        onConfirmClick() {
            this.editing = false;
            this.saveCode();
            this.code = this.getCodeFromStorage();
        },
        onEditClick() {
            this.editing = true;
            this.inputValue = this.getCodeFromStorage();
        },
        onCancelClick() {
            this.editing = false;
        },
    },
    computed: {
        stepText() {
            if (this.step === Steps.RESERVE) {
                return '机型选择'
            }
            if (this.step === Steps.CODE) {
                return '手机验证'
            }
            if (this.step === Steps.Final) {
                return '取货时间'
            }
        }
    },
})
