// 뉴스 url : https://news.daum.net/

// 1. 다음 뉴스 홈을 요청해서 받아온다.
const request = require('request');
const cheerio = require('cheerio')

const crawlingByNewsHome = () => {
    request('https://news.daum.net/', (error, response, body) => {
    const $ = cheerio.load(body);

    let aArr;
    aArr = $('a');

    let newsArr = [];
    for(let i = 0; i < aArr.length; i++) {
        if(aArr[i].attribs.href.includes("news.v.daum.net/v/"))
        newsArr.push(aArr[i].attribs.href);
    }

    newsArr = Array.from(new Set(newsArr));

    for(let i = 0; i < newsArr.length; i++) {
        crawlingNewsByNewsTime(newsArr[i].split('https://news.v.daum.net/v/')[1]);
    }
    });
}

const crawlingByBreakingnews = () => {
    const category = 'society';
    // const category = 'politics';
    // const category = 'economic';
    // const category = 'foreign';
    // const category = 'culture';
    // const category = 'digital';

    for(let day = 1; day <= 20; day++) {
        for(let page = 1; page <= 5; page++) {
            console.log(`https://news.daum.net/breakingnews/${category}?page=${page}&regDate=202005${pad(day, 2)}`);
            request(`https://news.daum.net/breakingnews/${category}?page=${page}&regDate=202005${pad(day, 2)}`, (error, response, body) => {
                const $ = cheerio.load(body);
            
                let aArr;
                aArr = $('a');
            
                let newsArr = [];
    
                for(let i = 0; i < aArr.length; i++) {
                    if(aArr[i].attribs.href.includes("v.daum.net/v/"))
                    newsArr.push(aArr[i].attribs.href);
                }
            
                newsArr = Array.from(new Set(newsArr));
            
                for(let i = 0; i < newsArr.length; i++) {
                    crawlingNewsByNewsTime(newsArr[i].split('https://v.daum.net/v/')[1], category);
                }
            });
        }
    }
}

const crawlingNewsByNewsTime = (newsTime, category) => {
    const newsUrl = `https://news.v.daum.net/v/${newsTime}`;
    console.log(newsUrl);
    request(newsUrl, (error, response, body) => {
        const $ = cheerio.load(body);
        let title = $('.tit_view')[0].children[0].data;

        let contentArr = $('#harmonyContainer p');
        let content = "";
        for(let i = 0; i < contentArr.length; i++) {
            if(contentArr[i].children[0] === undefined || contentArr[i].children[0].data === undefined) {
                console.log(`[CONTINUE] contentArr[i].children[0].data === undefined`);
                continue;
            }
            content += contentArr[i].children[0].data + " ";
        }

        let newsObject = {
            title,
            content,
            category
        }

        globalChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(newsObject)));
    });
}

let globalChannel;

const amqp = require('amqplib/callback_api');
const queueName = 'PRE_NEWS';
amqp.connect('amqp://localhost', function(error0, connection) {
    if (error0) {
        throw error0;
    }
    connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(queueName, {
            durable: true
        });
        globalChannel = channel;

        crawlingByBreakingnews();
    });
});

const pad = (n, width, z) => {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}