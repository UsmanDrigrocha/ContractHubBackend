const swaggerAutogen = require('swagger-autogen');

const doc = {
    info: {
        title:"Contract HUB",
        description:"Contract HUB : Webiste Backend"
    },
    host:"192.168.0.163:9090",
    schemes:['http']
}

const outputFile = './swagger-output.json'
const endPonintFiles = ['../index.js']

swaggerAutogen(outputFile,endPonintFiles,doc).then(()=>{
    console.log("Swagger Generated Successfully !")
})