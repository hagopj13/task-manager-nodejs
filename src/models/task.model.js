const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  desctiption: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
