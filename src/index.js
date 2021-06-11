const parse = require('node-html-parser');
const schedule = require('node-schedule');
const fetch = require("node-fetch");
const puppeteer = require('puppeteer');

const url = 'https://www.amazon.de/Sony-Interactive-Entertainment-PlayStation-5/dp/B08H93ZRK9';


let notAvailableText = "Derzeit nicht verfügbar.";

async function getWebsiteContent(){
    let resultObj = {}
    let returnedResponse;
    let timeOutSeconds = 30;
    let msTimeout = 1000 * timeOutSeconds;

    let browser
    try {
        browser = await puppeteer.launch({
            headless:true,
            args: getArgs()
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 800 });
        await page.goto(url,{waitUntil: 'load', timeout: msTimeout});
        returnedResponse = await page.evaluate(async ()=>{
            await document.querySelector('#a-autoid-7-announce').click();
            let div = document.querySelector("#outOfStock > div > div.a-section.a-spacing-small.a-text-center > span").innerText
            return div;
        })
        await browser.close();
        return returnedResponse;
    }
    catch(e){
        let error = e.toString();
        if(error.startsWith("TimeoutError") ||
            error.startsWith("Error: net::ERR_NETWORK_CHANGED") ||
            error.startsWith("Error: Evaluation failed: TypeError: Cannot")
        ){
            return notAvailableText;
        }
        console.log(e.toString());
        console.log('Amazon scrap error-> ',e);
        await browser.close();
    }
}

async function openBuyReminder() {
    let browser
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: getArgs()
        });
        const page = await browser.newPage();
        await page.setViewport({width: 1366, height: 800});
        await page.goto(url, {waitUntil: 'load', timeout: 30000});
    } catch (e){
        await browser.close();
    }
}

async function checkStock(){
    let content = await getWebsiteContent();
    if(content !== notAvailableText){
        console.log("KAUFEN !!!");
        await openBuyReminder();
    } else {
        console.log(content+"  --  "+new Date());
    }
}

function getArgs(){
    return [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-infobars',
        '--disable-features=site-per-process',
        '--window-position=0,0',
        '--disable-extensions',
        '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X   10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3312.0    Safari/537.36"'
    ];
}

async function main(){
    const job = schedule.scheduleJob('*/10 * * * * *', async function(){
        await checkStock();
    });
    checkStock();

}

main();
