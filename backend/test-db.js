const mongoose = require('mongoose');
require('dotenv').config();

const testSchema = new mongoose.Schema({ name: String });
const Test = mongoose.model('Test', testSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    const testDoc = new Test({ name: 'Test Document' });
    await testDoc.save();
    console.log('Test document saved');
    mongoose.connection.close();
  })
  .catch(err => console.error('Connection error:', err));