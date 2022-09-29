const reviewModel = require("../Models/ReviewModel")
const bookModel = require("../Models/BooksModel")
const validation = require("../validator/validation")


//==================================================create review=======================================
const createReview = async function(req, res){
 try{   
        const data = req.body
        const bookId = req.params.bookId

        //if entries are empty
        if (!validation.isValidRequestBody(data)) 
        return res.status(400).send({status: false, message: "Invalid request parameter, please provide User Details"})

        
        //if bookId not present take bookId from bookModel
        if (!data.bookId) data.bookId = bookId;
        if (!data.reviewedBy) data.reviewedBy = "Guest";
        if (!data.reviewedAt) data.reviewedAt = new Date;

        //apart from this entries gives error
        const compare =['reviewedBy', 'reviewedAt', 'rating', 'review','bookId']
        if (!Object.keys(data).every(elem => compare.includes(elem)))
        return res.status(400).send({ status: false, msg: "wrong entries given" });

        //checking for bookId
        if(!bookId)
        return res.status(400).send({status:false, message:'bookId is required'})
    
        if (!bookId.match(/^[0-9a-fA-F]{24}$/))
        return res.status(400).send({ status: false, msg: "invalid bookId given" })

        //regex for rating
        if(!data.rating || !/^[1-5]\d*$/.test(data.rating))
        return res.status(400).send({status:false, message:'rating is required and should be in the range of 1-5'})
        

        //creating review
        const newreview = await reviewModel.create(data);

        //finding book and updating review
        const updatebookReview = await bookModel.findOneAndUpdate({ _id: bookId,isDeleted:false}, { $inc: { reviews: 1 } }, { new: true }).lean()

        //if isDeleted is true
        if (!updatebookReview)
        return res.status(200).send({ status: true, message: "Book not found or book is already deleted" });

        //taking all newreview
        // let updatedData={bookData:updatebookReview, reviewsData:newreview}
        updatebookReview.reviewsData = newreview

        return res.status(200).send({ status: true, message: "Success", data: updatebookReview})
   
    }catch(err){
    return res.status(500).send({status:false, message:err.message})
}
}



//===========================================update review ==================================================
 const updateReview = async function(req, res){
        try {
            //getting the bookId
            const bookId = req.params.bookId
            //getting the reviewId
            const reviewId = req.params.reviewId

            //checking for valid bookId
            if (!bookId.match(/^[0-9a-fA-F]{24}$/)){
                return res.status(400).send({ 
                    status: false,
                    message: "invalid bookId given" 
                })
            } 
                
            //finding the book as per the bookId
            const book = await bookModel.findOne({_id : bookId})

            //checking for book and isDeleted is false
            if(!book || book.isDeleted === true){
                return res.status(404).send({
                    status : false,
                    message : "This book is already deleted"
                })
            }

            //checking for valid reviewId
            if (!reviewId.match(/^[0-9a-fA-F]{24}$/)){
                return res.status(400).send({ 
                    status: false,
                    message: "invalid reviewId given" 
                })
            } 
            //checking for the reviewData
            const reviewData = await reviewModel.find({_id : reviewId})

            //taking update details in request.body
            const updateDetails = req.body

            //checking for empty updateDetails
            if(!validation.isValidRequestBody(updateDetails)){
                return res.status(400).send({
                    status : false,
                    message : "please give update details in request body"
                })
            }
            // destructuring the updateDetails
            const { review, rating, reviewedBy } = updateDetails

            //filtering as per the request body
            const filterUpdate = { isDeleted: false }

            const compare  = ['review', 'rating', 'reviewedBy']

            //checking for only the request body enteries only 
            if (!Object.keys(updateDetails).every(elem => compare.includes(elem))){
                return res.status(400).send({ 
                    status: false,
                    message : "wrong entry given" });
            }

        // getting all the requested enteries in the filterUpdate   
        if(review != null) filterUpdate.review = review
        if(rating != null) filterUpdate.rating = rating;
        if(reviewedBy != null) filterUpdate.reviewedBy = reviewedBy;
        
        
        //updating the filterUpdate in the reviewModel and sending finalUpdate in response
        const finalUpdate = await (await reviewModel.findOneAndUpdate({_id : reviewId,bookId:bookId}, filterUpdate, {new : true}))
        
        //toObject() is returning plane object and adding reviewsData key to result
        const result = book.toObject()
        result.reviewsData = finalUpdate

        if(finalUpdate) 
         return res.status(200).send({
            status : true,
            message : "Successfully updated",
            data : result
        })
        return res.status(400).send({status:false, message:'Unable update with different book with different review'})
        

        } catch (error) {
            return res.status(500).send({
                status : false,
                message : error.message
            })
        }
 }

 //=========================================delete review========================================
let deleteReview = async function (req,res){
    try{
        const reviewId =req.params.reviewId
        const bookId =req.params.bookId

        //first updating review isDeleted to true
        const reviewDelete = await reviewModel.findOneAndUpdate({_id: reviewId, isDeleted:false, bookId:bookId},{$set:{isDeleted:true}},{ new: true })

         //checking reviewDelete is present and isdeleted :true
        if(reviewDelete){

        //updating reviews count in bookmodel(decreasing count by 1) and set isDeleted to true
        const updateBookDetails = await bookModel.findOneAndUpdate({ _id:bookId, isDeleted:false},{ $inc: { reviews: -1 } },{ new: true })
        return res.status(200).send({ status: true, message: "The review is deleted" });
        }

        //if review not found or deleted
        return res.status(404).send({status: false, message: "Review not found or Deleted"});


}catch(error) {
        return res.status(500).send({ message: error.message })
    }
}



module.exports.updateReview = updateReview
module.exports.deleteReview  = deleteReview
module.exports.createReview  = createReview