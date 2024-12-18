/* For testing and debuging, please check th postman collection API document (OCR API documents (Wong Hyman_8)) involved in the project floder */

// Importing modules
const fs = require("fs")
const path = require("path")
const axios = require("axios")
// Importing knex and dbConfigs
const dbConfigs = require("../knexfile")
const { error } = require("console")
const knex = require('knex')(dbConfigs)
// Importing sercrets from .env file
require("dotenv").config()

// Processing image File
function encodeImage(image) {
  const imageFilePath = path.resolve(__dirname, `../public/images/${image}`)
  const imageFile = fs.readFileSync(imageFilePath)
  const base64ImageStr = Buffer.from(imageFile).toString("base64")
  return base64ImageStr
}

// GET: /documents and GET: /documents?query=search_text
const getImageController = async (req, res) => {

  // Determine whether the requested API is GET: /documents OR GET: /documents?query=search_text
  let isCorrectQuery = false
  req.query.query === undefined ? isCorrectQuery = false : isCorrectQuery = true
  console.log(`isQuery: ${isCorrectQuery}`) // for debugging

  if (!isCorrectQuery) {
    try {
      // Case 1 for GET: /documents
      const listed = await knex('image').select('*').orderBy('id')
      if (listed.length !== 0 ) {
          // Send the json of knex query of all image info to client if there is any image
          console.log('listed Images: ') // for debugging
          console.log(listed) // for debugging
          res.status(200).json(listed)
      } else {
          // Send 404 error message to client if there is no any image information stored in the database
          res.status(404).json({error : "there is no any image information stored in the database"})
      }
    } catch (error) {
        res.status(500).json({error: "Errors occurs when getting all of the images (list images)"})
    }
  } else {
    try {
      // Case 2 for GET: /documents?query=search_text
      const requestedId = Number(req.query.query)
      console.log(requestedId) // for debugging

      if(!isNaN(requestedId)){
        const got = await knex('image').select('*').where({id: requestedId})
        if (got.length !== 0 ) {
          // Send the json of knex query of all image info to client if there is any image
          console.log(`Get Image by query= : ${requestedId}`) // for debugging
          console.log(got) // for debugging
          res.status(200).json(got)
        } else {
          // Send 404 error message to client if there is no any image of the requested Id
          res.status(404).json({error : "there is no any image of the requested Id"})
        }
      } else {
        // send 406 error message to the client if the input query is not a number
        res.status(406).json({error: "Error occurs as the search_text input should be a number"})
      }
      
    } catch (error) {
      res.status(500).json({error: "Errors occurs when getting image by query"})
    }
  }
}

// POST: /documents
const createImageController = async (req, res) => {
  try {
    // import the apiKey from secret handing file .env
    const apiKey = process.env.API_KEY
    // Processing image File
    const imageFileName = req.file.originalname
    const base64ImageStr = encodeImage(imageFileName)

    // Calling Goggle Vision API for text detection
    request_body = {
      requests: [
        {
          image: {
            content: base64ImageStr,
          },
          features: [
            {
              type: "TEXT_DETECTION",
            },
          ],
        },
      ],
    }

    const ocrApiResponse = await axios.post(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, request_body)
    console.log(`Request Image Name: ${imageFileName}`) // for debuging

    // Determine whether the uploaded the image inculde text or not
    let isTextImage = true
    ocrApiResponse.data.responses[0].fullTextAnnotation === undefined ? isTextImage = false: isTextImage = true
    
    if (isTextImage){
        // Case 1 : The image contains text 
        const detectedText = ocrApiResponse.data.responses[0].fullTextAnnotation.text
        console.log(`OCR Response Text: ${'\n' + detectedText}`) // for debuging

        // Store the image information and the detected text to the database by knex
        const created = await knex('image').insert({name: imageFileName, text: detectedText})
        if(created.rowCount === 1) {
            res.status(201).json({message: `successfully created image ${imageFileName} in the database and stored it's information`})
        } else {
            throw new Error("Errcor occurs when storing the image information into the database system")
        }
    } else {
        // Case 2 : The image does NOT contain text
        console.log(`${imageFileName} does NOT contain any TEXT.`) // for debuging

        // Send 406 staus code error message to the client as the client upload image which does not contains any text , where it is not Acceptable for this POST: /documents API
        res.status(406).json({error: `Error occurs as the image uploaded (${imageFileName}) does NOT contain any TEXT`})
    }

    } catch (error) {
        // Error handing for server side error and other case such as client input wrong key name and the client dose not upload any image or upload other unaccepted image file type 
        res.json({error: "error occcurs when posting image documents"})
    }
}
module.exports = { getImageController, createImageController}
