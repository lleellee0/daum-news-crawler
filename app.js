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

// crawlingByNewsHome();

// 2. 다음 뉴스 홈 html에서 위 코드를 실행한다.

// 기사 제목 : document.querySelectorAll('.tit_view')[0];
// 기사 내용 : document.querySelectorAll('#harmonyContainer')[0];
// 기사 카테고리 : https://api.v.kakao.com/p/346KaedeS2?paths=news,20200511152500711 -> extraInfo.cateInfo.category

const crawlingNewsCategory = (newsTime, title, content) => {
    const newsCategoryUrl = `https://api.v.kakao.com/p/346KaedeS2?paths=news,${newsTime}`;

    request(newsCategoryUrl, (error, response, body) => {
        const parsedBody = JSON.parse(body);
        let category = parsedBody.extraInfo.cateInfo.category;
        let newsObject = {
            title,
            content,
            category
        }

        // console.log(newsObject);
        globalChannel.sendToQueue(queueName, Buffer.from(JSON.stringify(newsObject)));
    });
}

const crawlingNewsByNewsTime = (newsTime) => {
    const newsUrl = `https://news.v.daum.net/v/${newsTime}`;
    request(newsUrl, (error, response, body) => {
    const $ = cheerio.load(body);
    let title = $('.tit_view')[0].children[0].data;

    let contentArr = $('#harmonyContainer p');
    let content = "";
    for(let i = 0; i < contentArr.length; i++) {
        content += contentArr[i].children[0].data + " ";
    }

    crawlingNewsCategory(newsTime, title, content);

    });
}

// crawlingNewsByNewsTime('20200511152500711');

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

        crawlingByNewsHome();
    });
    setTimeout(function() {
        connection.close();
        process.exit(0);
    }, 1000 * 30);
});