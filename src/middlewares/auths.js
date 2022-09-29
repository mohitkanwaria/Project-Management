const jwt=require('jsonwebtoken')
const bookModel = require('../Models/BooksModel')

// Authentication
const authentication = async (req, res, next) => {
    try {
        const token = req.headers['x-api-key']
        if (!token) {
            return res.status(400).send({ status: false, message: "Token hona chahiye !" })
        }
            jwt.verify(token,"BookManagementProject3", (error, response)=>{
                if(error){
                    return res.status(401).send({status:false, message:"Token invalid hai"})
                }
                req.headers["userId"]=response.userId 
                next()  
            }); 
       
         }catch (err) {
             return res.status(500).send({status: false, message: err.message});
    }
      }


      const authorization = async function(req,res,next){

        try{
        const user_id = req.headers['userId']
        const bodyId = req.body.userId
        const bookId = req.params.bookId
        

        //bookById for update and delete book by Id
        if(bookId)
        {
            if(!(bookId.match(/^[0-9a-fA-F]{24}$/)))
            return res.status(400).send({status:false,message:"Invalid bookId given"})
            
            const book = await bookModel.findOne({_id:bookId,isDeleted:false})
            
            if(!book)
            return res.status(404).send({status:false,message:"Book not found or deleted !"})
    
            if(user_id !== book.userId.toString())
            return res.status(403).send({status:false,message:"Unauthorised access"})
    
        }
        //for creating book
        else if(bodyId)
        {   
            if(!(bodyId.match(/^[0-9a-fA-F]{24}$/)))
            return res.status(400).send({status:false,message:"Invalid userId given"})
            
            if(user_id !== bodyId)
            return res.status(403).send({status:false,message:"Unauthorised access"})
        }
        else
        return res.status(400).send({status:false,message:"User Id Required"})
    
        next()
    
    
        }
        catch(error){
        return res.status(500).send({  status: false, message: error.message });
        }
    }


module.exports.authentication=authentication

module.exports.authorization=authorization
