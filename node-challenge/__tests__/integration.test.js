import request from 'supertest';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { router } from '../routes/index.routes.js';
import { User } from '../models/user.js';
import { requestLogger } from '../middleware/logger.js';
import { unknownEndpoint } from '../middleware/unknownEndpoint.js';
import { errorHandler } from '../middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/api', router);
app.use(errorHandler);
app.use(unknownEndpoint);

describe('Integration Tests - Full API', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('Complete User Workflow', () => {
    test('should create, read, update and delete a user', async () => {
      // 1. Crear usuario
      const newUser = {
        name: 'Integration Test User',
        email: 'integration@test.com'
      };

      await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      // 2. Verificar que se creó obteniendo todos los usuarios
      const getAllResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(getAllResponse.body).toHaveLength(1);
      const createdUser = getAllResponse.body[0];
      const userId = createdUser._id;

      // 3. Obtener usuario específico por ID
      const getUserResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(getUserResponse.body).toHaveLength(1);
      expect(getUserResponse.body[0].name).toBe('Integration Test User');

      // 4. Actualizar usuario
      const updateData = {
        name: 'Updated User Name',
        email: 'updated@test.com'
      };

      await request(app)
        .patch(`/api/users/${userId}`)
        .send(updateData)
        .expect(200);

      // 5. Verificar actualización
      const updatedUserResponse = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(updatedUserResponse.body[0].name).toBe('Updated User Name');

      // 6. Eliminar usuario
      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      // 7. Verificar que se eliminó
      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404);

      // 8. Verificar que no hay usuarios
      const finalGetAllResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(finalGetAllResponse.body).toHaveLength(0);
    });

    test('should handle multiple users correctly', async () => {
      // Crear múltiples usuarios
      const users = [
        { name: 'User 1', email: 'user1@test.com' },
        { name: 'User 2', email: 'user2@test.com' },
        { name: 'User 3', email: 'user3@test.com' }
      ];

      const createdUserIds = [];

      for (const user of users) {
        await request(app)
          .post('/api/users')
          .send(user)
          .expect(201);
      }

      // Verificar que se crearon todos
      const getAllResponse = await request(app)
        .get('/api/users')
        .expect(200);

      expect(getAllResponse.body).toHaveLength(3);

      // Verificar cada usuario individualmente
      for (const user of getAllResponse.body) {
        const getUserResponse = await request(app)
          .get(`/api/users/${user._id}`)
          .expect(200);

        expect(getUserResponse.body).toHaveLength(1);
        expect(users.some(u => u.name === getUserResponse.body[0].name)).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown endpoints', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    test('should handle invalid JSON in POST requests', async () => {
      await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

  });

  describe('Validation Tests', () => {
    test('should reject POST requests without name', async () => {
      const invalidUser = {
        email: 'test@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'name missing');
    });

    test('should accept POST requests with only name', async () => {
      const validUser = {
        name: 'Name Only User'
      };

      await request(app)
        .post('/api/users')
        .send(validUser)
        .expect(201);

      const users = await User.find({ name: 'Name Only User' });
      expect(users).toHaveLength(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle very long names', async () => {
      const longName = 'a'.repeat(1000);
      const userWithLongName = {
        name: longName,
        email: 'long@test.com'
      };

      await request(app)
        .post('/api/users')
        .send(userWithLongName)
        .expect(201);

      const users = await User.find({ name: longName });
      expect(users).toHaveLength(1);
    });

    test('should handle special characters in names', async () => {
      const specialName = 'Test User áéíóú ñ @#$%';
      const userWithSpecialName = {
        name: specialName,
        email: 'special@test.com'
      };

      await request(app)
        .post('/api/users')
        .send(userWithSpecialName)
        .expect(201);

      const users = await User.find({ name: specialName });
      expect(users).toHaveLength(1);
    });

    test('should handle empty string name', async () => {
      const userWithEmptyName = {
        name: '',
        email: 'empty@test.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(userWithEmptyName);

      expect([400]).toContain(response.status);
    });
  });
});
