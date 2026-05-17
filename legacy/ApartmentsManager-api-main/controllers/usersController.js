const User = require('../models/User');
const bcrypt = require('bcrypt');

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({ message: 'No users found' });
    }
    res.json(users);
}

// @desc Get a user
// @route GET /users/:id
// @access Private
const getUser = async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ message: 'User ID Required' });
    }

    const user = await User.findById(id).exec();
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }

    res.json(user);
};

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = async (req, res) => {
    const { username, password, email, roles } = req.body;

    // Confirm data
    if (!username) return res.status(400).json({ message: 'Username required' });
    if (!password) return res.status(400).json({ message: 'Password required' });
    if (!email) return res.status(400).json({ message: 'Email required' });


    // Check for duplicates
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec();

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate username' });
    }

    // Hash the password
    const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

    const userObject = (!Array.isArray(roles) || !roles.length)
        ? { username, password: hashedPwd, email }
        : { username, password: hashedPwd, email, roles }

    // Create and store new user
    const user = await User.create(userObject);

    if (user) { // created 
        res.status(201).json({ message: `New user ${username} created` });
    } else {
        res.status(400).json({ message: 'Invalid user data recieved' });
    }
}

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = async (req, res) => {
    const { id, username, email, roles, active, password } = req.body

    // Confirm data
    if (!id) return res.status(400).json({ message: 'Id required' })
    if (!username) return res.status(400).json({ message: 'Username required' });
    if (!Array.isArray(roles) || !roles.length) return res.status(400).json({ message: 'Roles required' })
    if (!email) return res.status(400).json({ message: 'Email required' });
    if (typeof active !== 'boolean') return res.status(400).json({ message: 'Active required' })


    // Does the user exist to update?
    const user = await User.findById(id).exec()

    if (!user) return res.status(400).json({ message: 'User not found' })
    

    // Check for duplicate 
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow updates to the original user 
    if (duplicate && duplicate?._id.toString() !== id) return res.status(409).json({ message: 'Duplicate username' })
    

    user.username = username
    user.roles = roles
    user.active = active
    user.email = email

    if (password) user.password = await bcrypt.hash(password, 10) // salt rounds 
    
    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated` })

}

// @desc Delete user
// @route DELETE /users
// @access Private
const deleteUser = async (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: 'User ID Required' });
    

    const user = await User.findById(id).exec();
    if (!user) return res.status(400).json({ message: 'User not found' });
    
    const result = await user.deleteOne();

    const reply = `Username ${result.username} with ID ${result._id} deleted`;

    res.json(reply);
}

module.exports = {
    getAllUsers,
    getUser,
    createNewUser,
    updateUser,
    deleteUser
};