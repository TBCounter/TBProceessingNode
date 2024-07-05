const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Укажите ваши ключи доступа здесь
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_KEY;
const region = 'eu-north-1';
const bucketName = 'tbcounter-screenshots';

// Настройка AWS SDK
AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
});

const s3 = new AWS.S3();

// Путь к вашему файлу
const filePath = './screenshots/chests/chest1.png';
const fileName = path.basename(filePath);

// Чтение файла и загрузка его в S3
// fs.readFile(filePath, (err, data) => {
//     if (err) throw err;

//     const params = {
//         Bucket: bucketName,
//         Key: fileName,
//         Body: data,
//         ContentType: 'image/png'
//     };

//     s3.upload(params, (s3Err, data) => {
//         if (s3Err) throw s3Err;
//         console.log(`File uploaded successfully at ${data.Location}`);
//     });
// });

function upload(data, fileName){
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: data,
        ContentType: 'image/png'
    };

    s3.upload(params, (s3Err, data) => {
        if (s3Err) throw s3Err;

        fetchingUrl(data)
        console.log(`File uploaded successfully at ${data.Location}`);

        
        // add chest to mongo db HERE, with not-public url
    });
}

async function fetchingUrl(data) {
    const response = await fetch('http://localhost:3000/db/url', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: data.Location
        })
        })

        if (!response.ok) {
        throw new Error("Could not fetch")
        }
}


// TODO check downloading from AWS (сделать один раз, проверить что качается и открывается файл)
// TODO upload chests automatically
// TODO save chests to mongo with status (UPLOADED), accoount_id, got_at and url

module.exports = { s3, upload }