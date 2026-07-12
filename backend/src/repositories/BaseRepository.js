class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data, session = null) {
    if (session) {
      const doc = await this.model.create([data], { session });
      return doc[0];
    }
    return await this.model.create(data);
  }

  async find(filter = {}, options = {}) {
    let query = this.model.find(filter);

    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    if (options.session) query = query.session(options.session);

    return await query.exec();
  }

  async findOne(filter = {}, options = {}) {
    let query = this.model.findOne(filter);
    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);
    if (options.session) query = query.session(options.session);
    return await query.exec();
  }

  async findById(id, options = {}) {
    let query = this.model.findById(id);
    if (options.select) query = query.select(options.select);
    if (options.populate) query = query.populate(options.populate);
    if (options.session) query = query.session(options.session);
    return await query.exec();
  }

  async update(filter, updateData, options = {}) {
    const opts = { new: true, runValidators: true, ...options };
    return await this.model.findOneAndUpdate(filter, updateData, opts).exec();
  }

  async updateById(id, updateData, options = {}) {
    const opts = { new: true, runValidators: true, ...options };
    return await this.model.findByIdAndUpdate(id, updateData, opts).exec();
  }

  async delete(filter, options = {}) {
    if (this.model.schema.paths.isDeleted) {
      return await this.model.findOneAndUpdate(filter, { isDeleted: true }, { new: true, ...options }).exec();
    }
    return await this.model.findOneAndDelete(filter, options).exec();
  }

  async deleteById(id, options = {}) {
    if (this.model.schema.paths.isDeleted) {
      return await this.model.findByIdAndUpdate(id, { isDeleted: true }, { new: true, ...options }).exec();
    }
    return await this.model.findByIdAndDelete(id, options).exec();
  }

  async count(filter = {}) {
    return await this.model.countDocuments(filter).exec();
  }

  async paginate(filter = {}, page = 1, limit = 10, options = {}) {
    const skip = (page - 1) * limit;
    const items = await this.find(filter, { ...options, limit, skip });
    const total = await this.count(filter);
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async aggregate(pipeline) {
    return await this.model.aggregate(pipeline).exec();
  }
}

module.exports = BaseRepository;
