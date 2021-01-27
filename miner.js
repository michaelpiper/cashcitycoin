const axios = require('axios').default;
const findConfig=()=>{
    try{
        if(process.argv.find((argv)=>argv==="--dev")){
            return require("./miner-dev.json");
        }
        if(process.argv.find((argv)=>argv==="--sandbox")){
            return require("./miner-sandbox.json");
        }
        return require("./miner.json");
    }catch(e){
        console.error(e);
        return {};
    }
      
}
class Sdk {
    constructor (baseUrl="", user={}){
        this.baseUrl = baseUrl;
        this.user = user;
    }
    async getNonce (){
        return await axios.get(this.baseUrl+"/mining/nonce",{
            headers:{
                "Authorization":"Basic "+Buffer.from(`${this.user.wallet_id}:${this.user.password}`).toString("base64")
            }
        }).catch((res)=>console.log(res.response?res.toJSON():res.message));
    }
    async getPreviousHash(){
        return await axios.get(this.baseUrl+"/mining/previous_hash",{
            headers:{
                "Authorization":"Basic "+Buffer.from(`${this.user.wallet_id}:${this.user.password}`).toString("base64")
            }
        }).catch((res)=>console.log(res.response?res.toJSON():res.message));
    }
    async getPendingTransaction(){
        return await axios.get(this.baseUrl+"/mining",{
            headers:{
                "Authorization":"Basic "+Buffer.from(`${this.user.wallet_id}:${this.user.password}`).toString("base64")
            }
        }).catch((res)=>console.log(res.response?`
        getPendingTransaction
        status:     ${res.response.status},
        statusText: ${res.response.statusText},
        data:       ${JSON.stringify(res.response.data||null)}
        `:res.message));
    }
    verifyPendingTransaction(transaction){
        return new Promise((resolve)=>{
            (async()=>{
                while(true){
                    const nonce = await this.getNonce();
                    const previous_hash = await this.getPreviousHash();
                    try{
                        const res = await axios.post(this.baseUrl+"/mining",{
                                transaction,
                                nonce: nonce.data,
                                previous_hash:previous_hash.data
                            },
                            {
                                headers:{
                                    "Authorization":"Basic "+Buffer.from(`${this.user.wallet_id}:${this.user.password}`).toString("base64")
                                }
                        })
                        return resolve(res);
                    }
                    catch(res){
                        console.log(
                        res.response?`
                        verifyPendingTransaction
                        nonce:         ${nonce.data},
                        previous_hash: ${previous_hash.data},
                        transaction:   ${JSON.stringify(transaction)},
                        status:        ${res.response.status},
                        statusText:    ${res.response.statusText},
                        data:          ${JSON.stringify(res.response.data||null)}
                        `:res.message)
                        if(res.response && res.response.status===404){
                            return resolve();
                        }
                    }
                }
            })()
        })
    }
    
    genNonce (){
        let string ="";
        for (let i =0;i<3;i++){
            string+= Math.floor(Math.random()*9);
        }
        return string;
    }
}
let submitted =false;
const config = findConfig();
const SDK = new Sdk(config.WALLET_URL,{
    wallet_id: config.WALLET_ID,
    password: config.WALLET_PASS
});
const main = async ()=>{
    submitted = true;
    try{
        const transaction = await SDK.getPendingTransaction();
        if(transaction && transaction.data)
        await  SDK.verifyPendingTransaction(transaction.data);
        submitted = false;
    }catch(e){
        console.log(e);
        submitted = false;
    }
}
setInterval(()=>{
    if(submitted) return;
    main();
},10);