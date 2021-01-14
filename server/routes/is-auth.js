exports.authCheck = (req,res,next) => {
    if(!req.session.isLoggedIn) {
        console.log("unauthorised")
        return res.send({status:"failed",msg:'unauthorised'})
    }
    next();
}

exports.adminCheck =(req,res,next) => {
    if(req.session.user.email !== 'prerna.singh587@gmail.com')
        return res.redirect('/dashboard');
        next();
}