const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const SheetsSchema = mongoose.Schema({
  templateId: {
    type: ObjectId,
    require: true,
    ref: 'Template'
    },
    learner: {
      type: Array
    },
    date: {
      type: Array
    },
    former: {
      type: Array
    },
}, { timestamps: true });

module.exports = mongoose.model('Sheets', SheetsSchema);