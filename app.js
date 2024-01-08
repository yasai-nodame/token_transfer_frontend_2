import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

const contractAddress = "0x8a53b4b854b2aA313C174566528e95a84e1Ec651"
const contractABI = [{"anonymous": false, "inputs": [{"indexed": false, "name": "sender", "type": "address"}, {"indexed": false, "name": "receiver", "type": "address"}, {"indexed": false, "name": "value", "type": "uint256"}], "name": "Transfer", "type": "event"}, {"inputs": [{"name": "total_supply", "type": "uint256"}], "outputs": [], "stateMutability": "nonpayable", "type": "constructor", "name": "constructor"}, {"inputs": [{"name": "receiver", "type": "address"}, {"name": "val", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"}, {"inputs": [{"name": "str", "type": "string"}], "name": "external_func", "outputs": [{"name": "", "type": "string"}], "stateMutability": "pure", "type": "function"}, {"inputs": [], "name": "totalSupply", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}, {"inputs": [{"name": "arg0", "type": "address"}], "name": "balances", "outputs": [{"name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"}]
let signerAccount;
let contract;
window.onload = init;
document.getElementById('ConnectButton').addEventListener('click', ConnectWithMetamask);
document.getElementById('sendButton').addEventListener('click', sendToken);

async function init(){
    if(typeof window.ethereum === "undefined") {
        //MetaMask未インストール時の処理
        handleMetaMaskNotInstalled();
    } else {
        const accounts = await window.ethereum.request({method: "eth_accounts"});
        const chainId = await window.ethereum.request({method: "eth_chainId"});

        if(accounts.length === 0 || chainId !== "0xaa36a7") {
            //アカウント提供未許可 or MWが異なる場合の処理
            handleAccountNotConnected();
        } else {
            //アカウント提供許可 and MWが正しい場合の処理
            handleAccountConnected();
        }
    }
}

function handleMetaMaskNotInstalled() {
    document.getElementById("isNotInstalled").style.display = "block";
    document.getElementById("isNotConnected").style.display = "none";
    document.getElementById("isConnected").style.display = "none";
}

function handleAccountNotConnected() {
    document.getElementById("isNotInstalled").style.display = "none";
    document.getElementById("isNotConnected").style.display = "block";
    document.getElementById("isConnected").style.display = "none";
}

async function handleAccountConnected() {
    document.getElementById("isNotInstalled").style.display = "none";
    document.getElementById("isNotConnected").style.display = "none";
    document.getElementById("isConnected").style.display = "block";

    window.ethereum.on('accountsChanged', () => window.location.reload());
    window.ethereum.on('chainChanged', () => window.location.reload());

    //ブロックチェーンとやり取りするインスタンスを作成
    const provider = new ethers.BrowserProvider(window.ethereum);
    //signerオブジェクトを取得
    const signer = await provider.getSigner();
    //アカウント取得
    signerAccount = await signer.getAddress();
    //アカウント表示
    document.getElementById("signerAccount").innerText = signerAccount;

    contract = new ethers.Contract(contractAddress, contractABI, signer); //コントラクトインスタンス化

    displayBalance();

    listenForTransfer();
}

async function ConnectWithMetamask() {
    //アカウント情報提供の承認
    await window.ethereum.request({ method: "eth_requestAccounts"})
    //NW切り替え
    await switchNetwork();
    //表示エリアの切り替え
    handleAccountConnected();
}

async function switchNetwork() {
    try {
        await window.ethereum.request({
            "method": "wallet_switchEthereumChain",
            "params": [
            {
                "chainId": "0xaa36a7"
            }
            ]
        });
    } catch (error) {
        if (error.code === 4902) {
            await window.ethereum.request({
                "method": "wallet_addEthereumChain",
                "params": [
                {
                    "blockExplorerUrls": [
                    "https://sepolia.etherscan.io/"
                    ],
                    "rpcUrls": [
                    "https://rpc.sepolia.org"
                    ],
                    "chainId": "0xaa36a7",
                    "chainName": "Sepolia"
                }
                ]
            });
        } else {
            throw new Error
        }
    }
}

async function displayBalance() {
    const balance = await contract.balances(signerAccount);
    document.getElementById("balance").innerText = balance;
}

async function sendToken() {
    const sendButton = document.getElementById("sendButton");
    const buttonText = document.getElementById("buttonText");
    const spinner = document.getElementById("spinner");

    sendButton.disabled = true;
    buttonText.textContent = "送信中...";
    spinner.style.display = "inline-block";

    const receiver = document.getElementById("raceiverAccount").value;
    const value = document.getElementById("valueToSend").value;

    try { 
        const tx = await contract.transfer(receiver,value);
        await tx.wait();
        displayBalance();
        balanceAnimation();
    } catch(error) {
        console.error(error);
        alert("送信エラー");
    } finally {
        sendButton.disabled = false;
        buttonText.textContent = "DTKを送る";
        spinner.style.display = "none";
    }
}

function listenForTransfer() {
    contract.on("Transfer",(sender, receiver, value, event) =>{
        if (receiver === signerAccount) {
            displayBalance();
            balanceAnimation();
        }
    });
}

function balanceAnimation() {
    const element = document.getElementById("changeAnimation")
    element.classList.add('animate__animated', 'animate__bounce');

    element.addEventListener('animationend', () => {
        element.classList.remove('animate__animated', 'animate__bounce');
    });   
}