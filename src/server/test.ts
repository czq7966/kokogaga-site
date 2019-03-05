import { requirejs } from './amd/requirejs'
export class Text {
    constructor() {
        let url="http://192.168.252.87:8080/dist/server/amd/common/index.js"
        requirejs(url, ['Common', 'name'], (common, name) => {
            console.log('555555', exports)
            console.log('44444444', common, common.msg, name)
            common.msg = 'ggggggggg'

        })
        .then((({common, name}) => {
            console.log('22222222', common, common.msg, name)
        }) as any)
        .catch(err => {
            console.log('3333333', err)

        })
        

    }
}

new Text;