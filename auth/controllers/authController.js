const jwt = require('jsonwebtoken');
const { signupSchema, signinSchema, acceptCodeSchema, changePasswordSchema, acceptFPCodeSchema } = require('../middlewares/validator');
const User = require('../models/usersModel');
const { doHash, doHashValidation, hmacProcess } = require('../utils/hashing');
const transport = require('../middlewares/sendMail');


exports.signup = async (req, res) => {
	const { email, password, username } = req.body;
	try {
		const { error, value } = signupSchema.validate({ email, password, username });

		if (error) {
			return res.status(401).json({
				success: false,
				message: error.details[0].message,
			});
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(401).json({
				success: false,
				message: 'User already exists',
			});
		}

		// ✅ Verificar si el username ya está en uso
		const existingUsername = await User.findOne({ username });
		if (existingUsername) {
			return res.status(401).json({
				success: false,
				message: 'Username is already taken',
			});
		}

		const hashedPassword = await doHash(password, 12);

		const newUser = new User({
			email,
			username,
			password: hashedPassword,
		});
		const result = await newUser.save();
		result.password = undefined;

		res.status(201).json({
			success: true,
			message: 'Your account has been created successfully',
			result,
		});
	} catch (error) {
		console.log(error);
	}
};

exports.signin = async (req, res) => {
    const { email, password } = req.body;
    try {
      const { error } = signinSchema.validate({ email, password });
      if (error) {
        return res.status(401).json({ success: false, message: error.details[0].message });
      }
  
      const existingUser = await User.findOne({ email }).select('+password');
  
      if (!existingUser) {
        return res.status(401).json({ success: false, message: "User does not exist" });
      }
  
      const result = await doHashValidation(password, existingUser.password);
      if (!result) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
  
      // Si el usuario NO está verificado, enviar código y responder
      if (!existingUser.verified) {
        const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
        
  
        const info = await transport.sendMail({
          from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
          to: existingUser.email,
          subject: "Verification Code",
          html: `<h1>${codeValue}</h1>`
        });
  
        if (info.accepted[0] === existingUser.email) {
          const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);
          existingUser.verificationCode = hashedCodeValue;
          existingUser.verificationCodeValidation = Date.now();
          await existingUser.save();
        }
  
        return res.status(403).json({
          success: false,
          requiresVerification: true,
          message: "You need to verify your email before logging in.",
          email: existingUser.email
        });
      }
  
      // Usuario verificado: emitir token y permitir acceso
      const token = jwt.sign(
        {
          userId: existingUser._id,
          email: existingUser.email,
          username: existingUser.username,
          verified: existingUser.verified,
        },
        process.env.TOKEN_SECRET,
        { expiresIn: '8h' }
      );
  
      res
        .cookie('Authorization', 'Bearer ' + token, {
          expires: new Date(Date.now() + 8 * 3600000),
          httpOnly: process.env.NODE_ENV === 'production',
          secure: process.env.NODE_ENV === 'production',
        })
        .json({
          success: true,
          token,
          message: 'Logged in successfully',
        });
  
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  };

exports.signout = async (req, res) => {
    res
        .clearCookie('Authorization')
        .status(200)
        .json({ success: true, message: 'logged out succesfully' });
}


exports.sendVerificationCode = async (req, res) =>{
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email})
        
        if(!existingUser){
            return res.status(404).json({success:false, message:"User does not exists"})
        }

        if(existingUser.verified){
            return res.status(400).json({success:false, message:"You are already verified"})
        }

        
        const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"verification code",
            html: '<h1>' + codeValue + '</h1>'
        })

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.verificationCode = hashedCodeValue;
            existingUser.verificationCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({success: true, message: 'Code sent!'})
        }

        res.status(400).json({success: false, message: 'Code sent failed! '})

    } catch (error) {
        console.log(error);
    }
}

exports.verifyVerificationCode = async (req, res) => {
    const { email, providedCode } = req.body;
    try {
        const { error } = acceptCodeSchema.validate({ email, providedCode });
        if (error) {
            return res.status(401).json({ success: false, message: error.details[0].message });
        }

        const codeValue = providedCode.toString();
        const existingUser = await User.findOne({ email }).select('+verificationCode +verificationCodeValidation');

        if (!existingUser) {
            return res.status(401).json({ success: false, message: 'User does not exists!' });
        }

        if (existingUser.verified) {
            return res.status(400).json({ success: false, message: 'you are already verified!' });
        }

        if (!existingUser.verificationCode || !existingUser.verificationCodeValidation) {
            return res.status(400).json({ success: false, message: 'something is wrong with the code!' });
        }

        if (Date.now() - existingUser.verificationCodeValidation > 5 * 60 * 1000) {
            return res.status(400).json({ success: false, message: 'code has been expired!' });
        }

        const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

        if (hashedCodeValue === existingUser.verificationCode) {
            existingUser.verified = true;
            existingUser.verificationCode = undefined;
            existingUser.verificationCodeValidation = undefined;
            await existingUser.save();

            const token = jwt.sign(
                {
                    userId: existingUser._id,
                    email: existingUser.email,
                    username: existingUser.username,
                    verified: true,
                },
                process.env.TOKEN_SECRET,
                { expiresIn: '8h' }
            );

            return res
                .cookie('Authorization', 'Bearer ' + token, {
                    expires: new Date(Date.now() + 8 * 3600000),
                    httpOnly: process.env.NODE_ENV === 'production',
                    secure: process.env.NODE_ENV === 'production',
                })
                .status(200)
                .json({
                    success: true,
                    message: 'Your account has been verified and you are now logged in!',
                    token,
                });
        }

        return res.status(400).json({ success: false, message: 'unexpected occured!!' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



exports.changePassword = async (req, res) => {
	const { userId, verified } = req.user;
	const { oldPassword, newPassword } = req.body;

	try {
		const { error } = changePasswordSchema.validate({
			oldPassword,
			newPassword,
		});
		if (error) {
			return res
				.status(401)
				.json({ success: false, message: error.details[0].message });
		}

		if (!verified) {
			return res
				.status(401)
				.json({ success: false, message: 'You are not a verified user!' });
		}

		const existingUser = await User.findOne({ _id: userId }).select('+password');
		if (!existingUser) {
			return res
				.status(401)
				.json({ success: false, message: 'User does not exist!' });
		}

		const validOldPassword = await doHashValidation(oldPassword, existingUser.password);
		if (!validOldPassword) {
			return res
				.status(401)
				.json({ success: false, message: 'Invalid current password!' });
		}

		const isSamePassword = await doHashValidation(newPassword, existingUser.password);
		if (isSamePassword) {
			return res
				.status(400)
				.json({ success: false, message: 'New password cannot be the same as the current password' });
		}

		const hashedPassword = await doHash(newPassword, 12);
		existingUser.password = hashedPassword;
		await existingUser.save();

		return res
			.status(200)
			.json({ success: true, message: 'Password updated!' });
	} catch (error) {
		console.log(error);
		return res.status(500).json({ success: false, message: 'Internal server error' });
	}
};

exports.signout = async (req, res) => {
    res
        .clearCookie('Authorization')
        .status(200)
        .json({ success: true, message: 'logged out succesfully' });
}


exports.sendForgotPasswordCode = async (req, res) =>{
    const {email} = req.body;
    try {
        const existingUser = await User.findOne({email})
        
        if(!existingUser){
            return res.status(404).json({success:false, message:"User does not exists"})
        }

        const codeValue = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos

        let info = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject:"forgot password code",
            html: '<h1>' + codeValue + '</h1>'
        })

        if(info.accepted[0] === existingUser.email){
            const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET)
            existingUser.forgotPasswordCode = hashedCodeValue;
            existingUser.forgotPasswordCodeValidation = Date.now();
            await existingUser.save()
            return res.status(200).json({success: true, message: 'Code sent!'})
        }

        res.status(400).json({success: false, message: 'Code sent failed! '})

    } catch (error) {
        console.log(error);
    }
};

exports.verifyForgotPasswordCode = async (req, res) => {
  const { email, providedCode, newPassword } = req.body;
  try {
    const { error } = acceptFPCodeSchema.validate({ email, providedCode, newPassword });
    if (error) {
      return res
        .status(401)
        .json({ success: false, message: error.details[0].message });
    }

    const codeValue = providedCode.toString();
    const existingUser = await User.findOne({ email }).select(
      '+password +forgotPasswordCode +forgotPasswordCodeValidation'
    );

    if (!existingUser) {
      return res
        .status(401)
        .json({ success: false, message: 'User does not exist!' });
    }

    if (!existingUser.forgotPasswordCode || !existingUser.forgotPasswordCodeValidation) {
      return res
        .status(400)
        .json({ success: false, message: 'Code not found or invalid' });
    }

    if (Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000) {
      return res
        .status(400)
        .json({ success: false, message: 'Code has expired' });
    }

    const hashedCodeValue = hmacProcess(codeValue, process.env.HMAC_VERIFICATION_CODE_SECRET);

    if (hashedCodeValue !== existingUser.forgotPasswordCode) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid code' });
    }

    // 💥 Comprobar si la nueva contraseña es igual a la actual
    const isSamePassword = await doHashValidation(newPassword, existingUser.password);
    if (isSamePassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'New password cannot be the same as the current password',
        });
    }

    const hashedPassword = await doHash(newPassword, 12);
    existingUser.password = hashedPassword;
    existingUser.forgotPasswordCode = undefined;
    existingUser.forgotPasswordCodeValidation = undefined;
    await existingUser.save();

    return res
      .status(200)
      .json({ success: true, message: 'Password updated!' });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// En authController.js
exports.validateForgotPasswordCode = async (req, res) => {
  const { email, providedCode } = req.body;

  try {
    const existingUser = await User.findOne({ email }).select('+forgotPasswordCode +forgotPasswordCodeValidation');

    if (!existingUser) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (
      !existingUser.forgotPasswordCode ||
      !existingUser.forgotPasswordCodeValidation ||
      Date.now() - existingUser.forgotPasswordCodeValidation > 5 * 60 * 1000
    ) {
      return res.status(400).json({ success: false, message: 'Code is invalid or expired' });
    }

    const hashedCode = hmacProcess(providedCode.toString(), process.env.HMAC_VERIFICATION_CODE_SECRET);

    if (hashedCode === existingUser.forgotPasswordCode) {
      return res.status(200).json({ success: true, message: 'Code is valid' });
    }

    return res.status(400).json({ success: false, message: 'Invalid code' });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
