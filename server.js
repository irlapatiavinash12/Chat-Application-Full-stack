const express = require("express");

const mongoose = require("mongoose");

const RegisterUser = require("./model");

const Msgmodel = require("./Msgmodel");

const jwtToken = require("jsonwebtoken");

const cors = require("cors");

const app = express()


const authenticateToken = async(req,res,next) => {
    try{
        let token = req.header("x-token");
        if (!token){
            return res.status(400).send("Token Not Found")
        }
        let decodedtoken = jwtToken.verify(token,"my_Secret_token")
        req.user = decodedtoken.user 
        next()
    }
    catch(e){
        console.log(e)
        res.status(500).send("Invalid token")
    }
}

mongoose.connect("mongodb+srv://irlapatiavinash:irlapatiavinash@cluster0.f556b.mongodb.net/").then(() => {
    console.log("DB Connected")
})

app.use(express.json())

app.use(cors({
    origin:"*" 
}) )


app.get("/" , (req,res) => {
    res.send("Hello world")
})

app.post("/register", async(req,res) => {
    try{
        console.log("try block exceution started")
        const {username,email,password,confirmpassword} = req.body  
        
        let isEmailExisted = await RegisterUser.findOne({email:email})

        if (isEmailExisted){
            return res.status(400).send("User Email already exists")
        }

        if (password !== confirmpassword){
            return res.status(400).send("Passwords are not Matching")
        }

        console.log("no erorrs found")

        let newUser = new RegisterUser({
            username,
            email,
            password,
            confirmpassword 
        }) 

        await newUser.save() 
        return res.status(200).send("registered succesfully")
    }
    catch(e){
        console.log(e);
        return res.status(500).send("Internal Server Error")
    }

})

app.post("/login", async(req,res) => {
    try{
        const {email,password} = req.body
        const userExistance = await RegisterUser.findOne({email})
        
        if (!userExistance){
            return res.status(400).send("User Not Found")
        }

        if (userExistance.password !== password){
            return res.send("Invalid password")
        }

        let payLoad = {
            user:{
                id:userExistance.id  
            }
        }

        jwtToken.sign(payLoad,"my_Secret_token",{expiresIn:3600000},(error,token) => {
            if (error) throw error
            return res.json({token}) 
        })


    }
    catch(e){
        console.log(e)
        return response.status(500).send("Internal Server Error") 
    }
     
})


app.get("/myProfile" ,authenticateToken, async(req,res) => {
    try{
        console.log("my profile try block exceuted")
        const {user} = req
        console.log(user)
        let userExistance = await RegisterUser.findById(req.user.id)
        if (!userExistance){
           return res.status(400).send("User Not Found") 
        }
        res.json(userExistance)
    } 
    catch(e){
        console.log(e)
        res.status(400).send("Internal Server Error")
    }
})


app.post("/addmsg" ,authenticateToken,async(req,res) => {
    try{
        console.log("try block started execution")

        const { text } = req.body; 
        
        if (!text || text.trim() === "") { 
            return res.status(400).send("Text is required."); 
        }

        const exist = await RegisterUser.findById(req.user.id)

        let newMsg = new Msgmodel({
            user: req.user.id,
            username:exist.username,
            text 
        })

        await newMsg.save();
        let allmsg = await Msgmodel.find()
        return res.json(allmsg)
    }
    catch(e){
        console.log(e)
        res.status(500).send("Server Error While Adding Msg") 
    }
})


app.get("/getmsg",authenticateToken, async(req,res) => {
    try{
        let allmsg = await Msgmodel.find()
        res.json(allmsg)

    }
    catch(e){
        console.log(e)
        res.status(500).send('Internal Server Error')
    }

})

app.listen(5000, () => {
    console.log("Server running...")
})

