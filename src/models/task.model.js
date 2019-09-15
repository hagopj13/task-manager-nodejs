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
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

taskSchema.methods.transform = function() {
  const task = this;
  return pick(task.toJSON(), ['id', 'description', 'completed', 'owner']);
};

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
