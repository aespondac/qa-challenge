const request = require('supertest');
const express = require('express');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Crear app de test simple
const app = express();
app.use(express.json());

// Schema para las pruebas
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const User = mongoose.model('User', userSchema);

// Rutas para las pruebas
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userFound = await User.find({ _id: id });

    if (userFound.length === 0) {
      return res.status(404).end();
    }

    res.status(200).json(userFound);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/users', async (req, res) => {
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

    res.status(201).end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH route for testing
app.patch('/api/users/:id', async (req, res) => {
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

    const updatedUser = await User.findByIdAndUpdate(userId, userFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE route for testing
app.delete('/api/users/:id', async (req, res) => {
  const userId = req.params.id;
  
  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', deletedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

describe('Users API', () => {
  let mongoServer;
  let testUserId;

  beforeAll(async () => {
    // Configurar MongoDB en memoria
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpiar la base de datos antes de cada test
    await User.deleteMany({});
    
    // Crear un usuario de prueba
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com'
    });
    const savedUser = await testUser.save();
    testUserId = savedUser._id.toString();
  });

  describe('GET /api/users/:id', () => {
    test('should return user when user exists', async () => {
      const response = await request(app)
        .get(`/api/users/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('name', 'Test User');
      expect(response.body[0]).toHaveProperty('email', 'test@example.com');
    });

    test('should return 404 when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/users/${nonExistentId}`)
        .expect(404);
    });

    test('should handle invalid ObjectId format', async () => {
      await request(app)
        .get('/api/users/invalid-id')
        .expect(500);
    });
  });

  describe('POST /api/users', () => {
    test('should create user with valid data', async () => {
      const newUser = {
        name: 'New User',
        email: 'newuser@example.com'
      };

      await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      // Verificar que el usuario fue creado en la base de datos
      const users = await User.find({ name: 'New User' });
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('newuser@example.com');
    });

    test('should return 400 when name is missing', async () => {
      const invalidUser = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'name missing');
    });

    test('should create user without email (optional field)', async () => {
      const userWithoutEmail = {
        name: 'User Without Email'
      };

      await request(app)
        .post('/api/users')
        .send(userWithoutEmail)
        .expect(201);

      const users = await User.find({ name: 'User Without Email' });
      expect(users).toHaveLength(1);
    });
  });

  describe('PATCH /api/users/:id', () => {
    test('should update user with valid data', async () => {
      const updatedData = {
        name: 'Updated User',
        email: 'updateduser@example.com'
      };

      const response = await request(app)
        .patch(`/api/users/${testUserId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Updated User');
      expect(response.body).toHaveProperty('email', 'updateduser@example.com');
    });

    test('should update only name when email not provided', async () => {
      const updateData = {
        name: 'Only Name Updated'
      };

      const response = await request(app)
        .patch(`/api/users/${testUserId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Only Name Updated');
      expect(response.body).toHaveProperty('email', 'test@example.com'); // Original email
    });

    test('should update only email when name not provided', async () => {
      const updateData = {
        email: 'onlyemail@example.com'
      };

      const response = await request(app)
        .patch(`/api/users/${testUserId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Test User'); // Original name
      expect(response.body).toHaveProperty('email', 'onlyemail@example.com');
    });

    test('should return 400 when no fields provided', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserId}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('message', 'No fields to update provided');
    });

    test('should return 400 when name is empty string', async () => {
      const updateData = {
        name: ''
      };

      const response = await request(app)
        .patch(`/api/users/${testUserId}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Name cannot be empty');
    });

    test('should return 404 when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Should Not Update'
      };

      const response = await request(app)
        .patch(`/api/users/${nonExistentId}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('should handle invalid ObjectId format', async () => {
      const updateData = {
        name: 'Invalid ID Update'
      };

      await request(app)
        .patch('/api/users/invalid-id')
        .send(updateData)
        .expect(500);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('should delete user when user exists', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUserId}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User deleted successfully');
      expect(response.body).toHaveProperty('deletedUser');
      expect(response.body.deletedUser).toHaveProperty('name', 'Test User');

      // Verificar que el usuario fue eliminado de la base de datos
      const deletedUser = await User.findById(testUserId);
      expect(deletedUser).toBeNull();
    });

    test('should return 404 when user does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', 'User not found');
    });

    test('should handle invalid ObjectId format', async () => {
      await request(app)
        .delete('/api/users/invalid-id')
        .expect(500);
    });

    test('should not affect other users when deleting one', async () => {
      // Crear otro usuario
      const anotherUser = await User.create({
        name: 'Another User',
        email: 'another@example.com'
      });

      // Eliminar el usuario de prueba
      await request(app)
        .delete(`/api/users/${testUserId}`)
        .expect(200);

      // Verificar que el otro usuario sigue existiendo
      const stillExists = await User.findById(anotherUser._id);
      expect(stillExists).not.toBeNull();
      expect(stillExists.name).toBe('Another User');
    });
  });
});
