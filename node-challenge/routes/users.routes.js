import { Router } from 'express';
import { User } from '../models/user.js';

export const usersRouter = Router();

// USER ROUTES
// localhost:3000/api/users
usersRouter.get('/', async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

usersRouter.get('/:id', async (request, response, next) => {
  try {
    const id = request.params.id;
    const userFound = await User.find({ _id: id });

    if (userFound.length === 0) {
      return response.status(404).end();
    }

    response.status(200).json(userFound);
  } catch (error) {
    next(error); // cuando el next recibe un param cambia la estructura del middleware
  }
});

// localhost:3000/api/users
usersRouter.post('/', async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(400).json({
        error: 'name missing',
      });
    }
    const newUser = {
      name: req.body.name,
      email: req.body.email,
    };
    const user = new User(newUser);
    const savedUser = await user.save();

    // res.status(201).json(savedUser);
    res.status(201).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// localhost:3000/api/users/:id
usersRouter.patch('/:id', async (req, res, next) => {
  const userId = req.params.id;
  const userFields = req.body;
  
  try {
    // Validar que se envíen datos para actualizar
    if (!userFields || Object.keys(userFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update provided' });
    }

    // Validar que si se envía name, no esté vacío
    if (userFields.name !== undefined && !userFields.name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }

    // buscar el usuario por el id y si lo encuentra lo va a actualizar con los campos que le pasemos
    const updatedUser = await User.findByIdAndUpdate(userId, userFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
});

// localhost:3000/api/users/:id
usersRouter.delete('/:id', async (req, res, next) => {
  const userId = req.params.id;
  
  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', deletedUser });
  } catch (error) {
    next(error);
  }
});
