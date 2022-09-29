const Store = require('electron-store');



class LocalDownload{
    constructor() {
        this.store = new Store();
    }

    get_item(){
        var rd = this.store.get("local_download")
        if (rd === undefined){
            return []
        }
        return rd
    }

    add_item(info){
        var old = this.store.get("local_download")
        if (old === undefined){
            old = []
        }
        old.push(info)
        this.store.set('local_download', old);
    }

    del_all(){
        this.store.set('local_download', []);
    }
}

module.exports = LocalDownload