const swaggerAutogen = require('swagger-autogen');

const doc = {
    info: {
        title:"Contract HUB",
        description:"Contract HUB : Webiste Backend"
    },
    host:"http://localhost:9090",
    schemes:['http']
}

const outputFile = './swagger-output.json'
const endPonintFiles = ['../index.js']

swaggerAutogen(outputFile,endPonintFiles,doc).then(()=>{
    console.log("Swagger Generated Successfully !")
})