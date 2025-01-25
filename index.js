require('dotenv').config()
const express = require('express');
const multer = require('multer');
const {S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command,DeleteObjectCommand} = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

const getObjestUrl = async (key) =>{
    
    const command = new GetObjectCommand({
        Bucket:process.env.AWS_S3_BUCKET_NAME,
        Key:key                          //key means the fileName that you want to Get.
    })
    try{
     const signurl = await getSignedUrl(s3Client,command)
     console.log(signurl);
     
    }catch {
      console.error('Error generating presigned URL:', err);
    }
  }
  

const putObjectUrl = async (fileName,contentType) =>{
    const command = new PutObjectCommand({
        Bucket : process.env.AWS_S3_BUCKET_NAME,
        Key : `uploads/user-uploads/${fileName.originalname}`,          // Path where u r going to store the file
        ContentType:contentType
    })

    try{
        const Url = await getSignedUrl(s3Client,command)
        console.log("\nurl for uploading files",Url);
    }catch(error){
        console.log("error in generating url for uploading the files",error);
        
    }
    
}

async function listObject() {
    const command = new ListObjectsV2Command({
        Bucket:process.env.AWS_S3_BUCKET_NAME,
        key:'/'
    })
    const result = await s3Client.send(command)
    console.log(result);
    
}


async function deletObject(key){
    const command = new DeleteObjectCommand({
        Bucket:process.env.AWS_S3_BUCKET_NAME,
        Key:key
    })

    try{
       await s3Client.send(command)
    }catch(error){
        console.log("error in deleting file",error);
        
    }
    
    
}


async function init(){
    await getObjestUrl("wallpaperflare.com_wallpaper.jpg")
   await putObjectUrl(`image-${Date.now()}.jpeg`,"image/jpeg")
    await listObject()
    await deletObject("wallpaperflare.com_wallpaper.jpg")
}
init()


//Using API 

const app = express();
const upload = multer();




// Route to upload file to S3
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send('No file uploaded');
    }

    const fileType = file.mimetype; // Get dynamic content type
    const fileName = `files/${Date.now()}-${file.originalname}`;

    // Upload file to S3 bucket
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: fileType,
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    res.status(200).json({
      message: 'File uploaded successfully',
      fileName,
      fileType,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
