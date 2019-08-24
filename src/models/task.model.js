const mongoose = require('mongoose');
const { pick } = require('lodash');

const taskSchema = mongoose.Schema(
  {
    description: {
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
  },
  {
    timestamps: true,
  }
);

taskSchema.methods.transform = function() {
  const task = this;
  return pick(task, ['id', 'description', 'completed', 'owner']);
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
