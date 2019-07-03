const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true
    },
    email : {
        type : String,
        required : true,
        trim : true,
        unique : true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error('This is not a valid email address')
            }
        }
    },
    age : {
        type : Number,
        required : true
    },
    password : {
        type : String,
        required : true,
        trim : true,
        minlength : 8
    },
    tokens : [
        {
            token : {
                type : String,
                required : true
            }
        }
    ]
})

userSchema.methods.generateAuthToken = async function() {
    const user = this
    const token = await jwt.sign({ _id : user._id.toString() }, 'thisismyserver')
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
}

userSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.tokens
    return userObject
}

userSchema.statics.findbyCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if(!user){
        throw new Error('Unable to login')
    }
    const isAuth = await bcrypt.compare(password, user.password)
    if(!isAuth){
        throw new Error('Unable to login')
    }
    return user
}

userSchema.pre('save' , async function(next) {
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User