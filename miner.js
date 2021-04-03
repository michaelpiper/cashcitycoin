const axios = require('axios').default;
const crypto = require("crypto");
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
        this.auth = Buffer.from(`${this.user.username}:${this.user.password}`).toString("base64")
    }
    async getPreviousHash(){
        return await axios.get(this.baseUrl+"/mining/previous_hash",{
            headers:{
                "Authorization":"Basic "+this.auth
            }
        }).catch((res)=>console.log(res.response?res.toJSON():res.message));
    }
    async getPendingTransaction(){
        return await axios.get(this.baseUrl+"/mining",{
            headers:{
                "Authorization":"Basic "+this.auth
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
                let proof = 99;
                let foundProof=null;
                const previous_hash = await this.getPreviousHash();
                while(proof>=0){  
                    const p=crypto.createHash("md5").update(proof<10?"0"+String(proof):String(proof)).digest("hex");
                    // console.log(p,'=>',proof<10?"0"+String(proof):String(proof));
                    const hash = crypto.createHash("sha256").update( JSON.stringify({
                        previous_hash: previous_hash.data,
                        proof:p,
                        block: {
                            sender: transaction.sender,
                            recipient: transaction.recipient,
                            amount: transaction.amount
                        },
                    })).digest("hex");
                    // console.log(hash,"=>",transaction.hash);
                    if(hash === transaction.hash){
                        foundProof = p;
                        console.log("proof founded","=>",foundProof);
                        break;
                    }
                    proof--;
                }
                if(foundProof===null){
                    console.log("Proof not found");
                    return resolve(res);
                }
                try{
                    const res = await axios.post(this.baseUrl+"/mining",{
                            transaction,
                            nonce: foundProof,
                            previous_hash: previous_hash.data
                        },
                        {
                            headers:{
                                "Authorization":"Basic "+this.auth
                            }
                    })
                    console.log(res.data);
                    return resolve(res);
                }
                catch(res){
                    console.log(
                    res.response?`
                    verifyPendingTransaction
                    nonce:         ${foundProof} => ${proof},
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
    username: config.WALLET_USER,
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