const bookModel = require('../Models/BooksModel')
const UserModel = require('../Models/UserModel')
const reviewModel = require('../Models/ReviewModel')
const validation = require('../validator/validation')
const aws = require('aws-sdk')


//AWS S3

const awsFileUploader = async function(req, res){
   
    //AWS configuration
  try{  
    aws.config.update({
        accessKeyId: "AKIAY3L35MCRZNIRGT6N",
        secretAccessKey: "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",
        region: "ap-south-1"
    })

    //File upload function
    let uploadFile= async ( file) =>{
        return new Promise( function(resolve, reject) {
         // this function will upload file to aws and return the link
         let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws
     
         var uploadParams= {
             ACL: "public-read",  //access control list
             Bucket: "classroom-training-bucket",  //HERE
             Key: "abc/" + file.originalname, //HERE 
             Body: file.buffer
         }
     
     
         s3.upload( uploadParams, function (err, data ){
             if(err) {
                 return reject({"error": err})
             }
             console.log(data)
             console.log("file uploaded succesfully")
             return resolve(data.Location)
         })
     
         // let data= await s3.upload( uploadParams)
         // if( data) return data.Location
         // else return "there is an error"
     
        })
    }

        let files= req.files
        if(files && files.length>0){
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL= await uploadFile( files[0] )
            res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
        }
        else{
            res.status(400).send({ msg: "No file found" })
        }
        }catch(err){
            return res.status(500).send({status:false, message:err.message})
        }
    }
     



//=========================================creating book===================================================


const createBook = async function (req, res) {
    try {
        const data = req.body
        const { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data
        
        
        //-----------------------------------------------------------------------------------------
        if (!validation.isValidRequestBody(data)) {
            return res.status(400).send({status: false, message: "Invalid request parameter, please provide Book Details"})
        }

        const compare =['title', 'excerpt', 'userId', 'ISBN', 'category', 'subcategory','releasedAt','bookCover']
        if (!Object.keys(data).every(elem => compare.includes(elem)))
        return res.status(400).send({ status: false, msg: "wrong entries given" });

       
        //----------------------------Title Validation-----------------------------------------------------
         data.title = title.toUpperCase()
        
        if(!/^[a-zA-Z_]+( [a-zA-Z_]+)*$/.test(title)){
            return res.status(400).send({
                status : false,
                message : "Title should be string and unique"

            })
        }


      //------------------------ISBN validation-------------------------------------------
        if (!validation.isValid(ISBN))
            return res.status(400).send({ status: false, message: 'ISBN is required' })
        
        if (!validation.isValidISBN(ISBN))
            return res.status(400).send({ status: false, message: 'ISBN should be unique number [XXX-XXXXXXXXXX] !' })


         //for unquie validation in bookModel for ISBN and Title
         const checkUniqueTitleAndISBN = await bookModel.findOne(({$or:[{title : title, isDeleted: false},{ISBN : ISBN, isDeleted: false}]}))

         //checking for unique title 
         if(checkUniqueTitleAndISBN){
             return res.status(400).send({
                 status : false,
                 message : "Title and ISBN is already present please provide unique Title and ISBN"
             
             })
         } 
         

        //---------------------------excerpt validation-------------------------------
        if (!validation.isValid(excerpt))
            return res.status(400).send({ status: false, message: 'Excerpt is required' })

        if(!/^[a-zA-Z_]+( [a-zA-Z_]+)*$/.test(excerpt)){
            return res.status(400).send({status : false, message : "excerpt should be string"})
            }

        //-------------------userId validation-------------------------------------------

        if (!await UserModel.findById(userId))
            return res.status(400).send({ status: false, msg: "Invalid User Id !" })




        //--------------------------------Category Validation------------------------------------------------
        if (!validation.isValid(category))
            return res.status(400).send({ status: false, message: 'Category is required' })
        
        if(!/^[a-zA-Z_]+( [a-zA-Z_]+)*$/.test(category)){
            return res.status(400).send({status : false, message : "category should be string"})
                }

        //--------------------------------SubCategory Validation------------------------------------------------
        if (!validation.isValid(subcategory))
            return res.status(400).send({ status: false, message: 'Subcategory is required' })

        if(!/^[a-zA-Z_]+( [a-zA-Z_]+)*$/.test(subcategory)){
                return res.status(400).send({status : false, message : "subcategory should be string"})
                    }

        //----------------------------------releasedAt Validation-------------------------------------------
        if (!validation.isValid(releasedAt))
            return res.status(400).send({ status: false, message: 'ReleaseAt is required' })

        if (!/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/.test(releasedAt))
            return res.status(400).send({ status: false, message: 'Please provide valid date format YYYY-MM-DD !' })

        //-----------------------------------BOOK Creation------------------------------------
       
        const bookCreate = await bookModel.create(data)
        return res.status(201).send({ status: true, message: 'Successfully book created', data: bookCreate })
    
    } catch (err) {
       return res.status(500).send({ status: false, message: err.message })
    }
}

//===============================================get all books via filters==================================
const allBooks = async function (req, res) {
    try {
        
        //===========================check this to get all bokks


        let body = req.query

        //apart from this entries gives error
        const compare =['userId', 'category', 'subcategory']
        if (!Object.keys(body).every(elem => compare.includes(elem)))
        return res.status(400).send({ status: false, msg: "wrong entries given" });

        //setting the isDeleted false in body

        let obj = { isDeleted: false }

        //checking for userId
        if (body.userId) {
            if (!/^[0-9a-fA-F]{24}$/.test(body.userId)) {
                return res.status(400).send({ status: false, message: "Invalid userId" })
            }
            obj.userId = body.userId
        }

        //checking for category
        if (body.category||body.category==0) {
            if(body.category.trim().length==0){
                return res.status(400).send({ status: false, message: " Please give any value in Category Param" }) 
            }
            obj.category = body.category
        }

        ////checking for subcategory
        if (body.subcategory||body.subcategory==0) {
            if(body.subcategory.trim().length==0){
                return res.status(400).send({ status: false, message: " Please give any value in Subcategory Param" })     
            }
            obj.subcategory = body.subcategory
        }

        //finding the book as per the book_id, title, excerpt, userId, category, reviews, releadedAt
        let findbook = await bookModel.find(obj).select({
            ISBN : 0,
            subcategory : 0,
            isDeleted : 0,
            deletedAt : 0
        })

        //checking for no book 
        if(!(findbook.length > 0)){
            return res.status(404).send({
                status : false,
                message : "No book found"
            })
        }

        // alphabetically sorting the title
        let sortedData = findbook.sort(function (a, b){
            if(a.title < b.title) {
                 return -1 
                }
        })

        return res.status(200).send({
            status : true,
            message:'',
            data : sortedData
        })
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}

//=============================get book details by bookId============================================
const getByBookId = async function (req, res) {

    try {

        //extract the bookId 
        const bookId = req.params.bookId
        //find the book with the bookId in bookModel
        const book = await bookModel.findById(bookId).lean()

        //find all reviews with the prticular book_id
        const reviewData = await reviewModel.find({bookId:bookId,isDeleted:false}).select({isDeleted:0,createdAt:0,updatedAt:0,__v:0})

        //if book not found or isDeleted is true then we can say book not found
        if (!book || book.isDeleted === true) {
            return res.status(404).send({
                status: false,
                message: "Book not found"
            })
        } else {
            book.reviewsData = reviewData
            return res.status(200).send({
                status: true,
                message:'',
                data: book
            })
        }
    } catch (error) {
        res.status(500).send({
            status: false,
            message: error.message
        })
    }

}



//==============================delete by BookId=============================================

const deleteByBook = async function(req, res){
    
try{
    //bookId    
    const bookId = req.params.bookId

    //for checking bookId and isDeleted false and set isDeleted to true
   const bookDeleted=await bookModel.findOneAndUpdate({_id:bookId, isDeleted:false},{$set:{isDeleted:true, deletedAt: Date.now()}},{ new:true})

   return res.status(200).send({status:true, message:'successfully Deleted'})
    
}catch(err){
    res.status(500).send({status:false, message:err.message})
}

}


//==================================updateBook==========================================================

const updateBook = async function (req, res) {

    try {
        //get the bookId
        const bookId = req.params.bookId
        //find the book with bookId
        const book = await bookModel.findById(bookId)

        //check for book not presetn and isDelete true - book not available
        if (!book || book.isDeleted == true) {
            return res.status(404).send({
                status: false,
                message: "Book not found in db or it is deleted"
            })
        }

        //updating 
        //checking for requestBody
        const requestBody = req.body

        //destructure the requestbody
        const { title, excerpt, ISBN, releasedAt } = requestBody


        if (!validation.isValidRequestBody(requestBody)) {
            return res.status(400).send({
                status: false,
                message: "Please provide the Upadate details"
            })
        }



        //checking for unique title
        const uniqueTitle = await bookModel.findOne({title : title})
        if(uniqueTitle){
            return res.status(400).send({
                status : false,
                message : "Title is already present"
            })
        }  
        book.title = title
        //checking for update details - excerpt  
        if (excerpt) {

            if (validation.isValid(excerpt)) {
                book.excerpt = excerpt.trim()
            } else {
                return res.status(400).send({
                    status: false,
                    message: "excerpt required"
                })
            }
        }

        
        //check for unique ISBN

        const uniqueISBN = await bookModel.findOne({ISBN : ISBN})
        if(uniqueISBN){
            return res.status(400).send({
                status : false,
                message : "isbn already exists"
            })
        } else { book.ISBN = ISBN}
        //checking for upade details - releasedAt
        book.releasedAt = releasedAt

        //updating the book
        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, book, { new: true })
        return res
            .status(200)
            .send({ status: true, message: "successfully updated", data: updatedBook })

    } catch (error) {
        return res.status(500).send({ message: error.message })
    }
}


module.exports.updateBook = updateBook
module.exports.createBook = createBook
module.exports.allBooks = allBooks
module.exports.getByBookId = getByBookId
module.exports.deleteByBook = deleteByBook
module.exports.awsFileUploader = awsFileUploader
