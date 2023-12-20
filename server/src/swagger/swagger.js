const swaggerAutogen = require('swagger-autogen');

const doc = {
    info: {
        title:"The Pet Store Backend",
        description:"This is The Pet Store"
    },
    host:"localhost:8080",
    schemes:['http','https']
}

const outputFile = './swagger-output.json'
const endPonintFiles = ['../index.js']

swaggerAutogen(outputFile,endPonintFiles,doc).then(()=>{
    console.log("Swagger Generated Successfully !")
})