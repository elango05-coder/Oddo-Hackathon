const BaseRepository = require('./BaseRepository');
const Department = require('../models/Department');

class DepartmentRepository extends BaseRepository {
  constructor() {
    super(Department);
  }

  async findByCode(code) {
    return await this.model.findOne({ code }).exec();
  }

  async findSubdepartments(parentId) {
    return await this.model.find({ parentId }).exec();
  }
}

module.exports = new DepartmentRepository();
