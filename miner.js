const axios = require('axios').default;
const crypto = require("crypto");
const BASE_URL="https://cashcitycoin-sandbox.herokuapp.com";
// const user = {
//     wallet_id:"BGBBEIEHEJBEGBBIJ",
//     password:"GZ#99R1Y0SUPHH15&O%0G5NE9GTUQVBX"
// }
const user = {
    wallet_id:"BGBBGJGIEABHEEAXL",
    password:"@YWQJNFVC%TXR@8KOQTZQ20AA1L14$Z@"
}
let submitted =false;
const getNonce =async()=>{
    return await axios.get(BASE_URL+"/mining/nonce",{
        headers:{
            "Authorization":"Basic "+Buffer.from(`${user.wallet_id}:${user.password}`).toString("base64")
        }
    }).catch((res)=>console.log(res.response?res.toJSON():res.message));
}
const getPreviousHash =async()=>{
    return await axios.get(BASE_URL+"/mining/previous_hash",{
        headers:{
            "Authorization":"Basic "+Buffer.from(`${user.wallet_id}:${user.password}`).toString("base64")
        }
    }).catch((res)=>console.log(res.response?res.toJSON():res.message));
}
const getPendingTransaction=async()=>{
    return await axios.get(BASE_URL+"/mining",{
        headers:{
            "Authorization":"Basic "+Buffer.from(`${user.wallet_id}:${user.password}`).toString("base64")
        }
    }).catch((res)=>console.log(res.response?`
    getPendingTransaction
    status:     ${res.response.status},
    statusText: ${res.response.statusText},
    data:       ${JSON.stringify(res.response.data||null)}
    `:res.message));
}
const verifyPendingTransaction=async(transaction)=>{
    const nonce = await getNonce();
    const previous_hash = await getPreviousHash();
    return await axios.post(BASE_URL+"/mining",{
        transaction,
        nonce: nonce.data,
        previous_hash:previous_hash.data
    },{
        headers:{
            "Authorization":"Basic "+Buffer.from(`${user.wallet_id}:${user.password}`).toString("base64")
        }
    }).catch((res)=>console.log(res.response?`
    verifyPendingTransaction
    nonce:         ${nonce.data},
    previous_hash: ${previous_hash.data},
    transaction:   ${JSON.stringify(transaction)},
    status:        ${res.response.status},
    statusText:    ${res.response.statusText},
    data:          ${JSON.stringify(res.response.data||null)}
    `:res.message));
}
const main = async ()=>{
    submitted = true;
    try{
        const transaction = await getPendingTransaction();
        if(transaction && transaction.data)
        await  verifyPendingTransaction(transaction.data);
        submitted = false;
    }catch(e){
        console.log(e);
        submitted = false;
    }
   
  
}
const genNonce =()=>{
    let string ="";
    for (let i =0;i<3;i++){
        string+= Math.floor(Math.random()*9);
    }
    return string;
}

setInterval(()=>{
    if(submitted) return;
    main();
},10);